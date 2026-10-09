/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ TỔNG HỢP ÂM THANH & NHẠC NỀN NGŨ CUNG XỨ HUẾ (WEBAUDIO SYNTHESIZER)
 * - 100% tạo bằng code Web Audio API thuần, KHÔNG sử dụng file audio ngoài, KHÔNG bản quyền.
 * - Trình duyệt chỉ phát sau thao tác đầu tiên của người chơi (First user interaction unlock).
 * - Mặc định bật âm lượng 60%, có nút Bật/Tắt toàn cục, tùy chọn riêng "Tắt nhạc nền", và thanh âm lượng.
 * - 14 hiệu ứng âm thanh SFX chuẩn mực: bước chân, nhảy, hạ cánh, combo 3 đòn, trúng đòn, chiêu K,
 *   nhặt đồ, thẻ đúng, thẻ sai, khiên nứt/vỡ, boss tan biến, mở khóa mảnh ghép, thắng, thua.
 * - Nhạc nền ngũ cung 8-bit (sóng vuông & tam giác) với 4 biến thể (menu, level, boss, rap_ao) và tự động giảm âm (ducking).
 */

import { AccessibilityManager } from './accessibility.ts';

export type BGMTrack = 'menu' | 'level' | 'boss' | 'rap_ao' | 'none';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private duckGain: GainNode | null = null;

  private unlocked = false;
  private muted = false;
  private musicMuted = false;
  private masterVolume = 0.6; // Mặc định bật 60% theo yêu cầu

  private currentTrack: BGMTrack = 'none';
  private bgmTimer: number | null = null;
  private bgmStepIndex = 0;
  private isDucked = false;

  // Thang âm ngũ cung Huế cơ bản (Hò - Xự - Xang - Xê - Cống: D, E, G, A, B)
  // Các tần số nốt chuẩn Hz:
  private readonly NOTE = {
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,
    C6: 1046.5,
    D6: 1174.66,
  };

  private constructor() {
    const a11y = AccessibilityManager.getInstance();
    this.muted = a11y.settings.muted ?? false;
    this.musicMuted = a11y.settings.musicMuted ?? false;
    this.masterVolume = (a11y.settings.volume ?? 60) / 100;

    // Gắn listener lắng nghe tương tác đầu tiên của người dùng để unlock WebAudio
    this.setupUnlockListeners();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };

    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  /**
   * Khởi tạo Web Audio Context & Cấu trúc Gain routing
   */
  private initContext(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // 1. Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // 2. SFX Gain -> Master Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // 3. Duck Gain -> BGM Gain -> Master Gain
        this.duckGain = this.ctx.createGain();
        this.duckGain.gain.setValueAtTime(this.isDucked ? 0.28 : 1.0, this.ctx.currentTime);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.musicMuted ? 0 : 0.65, this.ctx.currentTime);

        this.duckGain.connect(this.bgmGain);
        this.bgmGain.connect(this.masterGain);
      }
    }
  }

  /**
   * Mở khóa AudioContext sau thao tác đầu tiên của người chơi
   */
  public unlock(): void {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.unlocked = true;
        if (this.currentTrack !== 'none' && !this.musicMuted && !this.muted) {
          this.startBGMTrack(this.currentTrack);
        }
      }).catch((e) => console.warn('WebAudio unlock error:', e));
    } else if (this.ctx && this.ctx.state === 'running') {
      this.unlocked = true;
    }
  }

  // ============================================================================
  // CÀI ĐẶT ÂM LƯỢNG & BẬT / TẮT (VOLUME & MUTE CONTROLS)
  // ============================================================================

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    AccessibilityManager.getInstance().updateSetting('muted', muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public setMusicMuted(muted: boolean): void {
    this.musicMuted = muted;
    AccessibilityManager.getInstance().updateSetting('musicMuted', muted);
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.65, this.ctx.currentTime);
    }
  }

  public toggleMusicMute(): boolean {
    this.setMusicMuted(!this.musicMuted);
    return this.musicMuted;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    AccessibilityManager.getInstance().updateSetting('volume', Math.round(this.masterVolume * 100));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Giảm âm nhạc nền khi mở hội thoại hoặc tạm dừng (Ducking Volume 28%)
   */
  public setDucked(ducked: boolean): void {
    if (this.isDucked === ducked) return;
    this.isDucked = ducked;
    if (this.duckGain && this.ctx) {
      const now = this.ctx.currentTime;
      const targetGain = ducked ? 0.28 : 1.0;
      this.duckGain.gain.cancelScheduledValues(now);
      this.duckGain.gain.linearRampToValueAtTime(targetGain, now + 0.22);
    }
  }

  // ============================================================================
  // 1. DANH SÁCH 14 HIỆU ỨNG ÂM THANH (SFX TỔNG HỢP BẰNG CODE)
  // ============================================================================

  /**
   * 1.1 Bước chân (Footstep): âm trầm ngắn, tiếng gõ nhẹ vào mặt gạch/gỗ
   */
  public playFootstep(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  /**
   * 1.2 Nhảy (Jump): lướt tần số lên cao
   */
  public playJump(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * 1.3 Hạ cánh (Land): âm thịch êm dịu khi tiếp đất
   */
  public playLand(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * 1.4 Đánh 3 đòn với 3 cao độ tăng dần (Combo 1 -> 2 -> 3)
   */
  public playAttackSwing(comboStep: number = 1): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (comboStep === 1) {
      // Đòn 1: Cao độ thấp (260Hz -> 140Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.085);
      gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.085);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.085);
    } else if (comboStep === 2) {
      // Đòn 2: Cao độ vừa (380Hz -> 200Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } else {
      // Đòn 3: Cao độ cao, uy lực bùng nổ (520Hz -> 260Hz kèm âm bội)
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
  }

  /**
   * 1.5 Trúng đòn (Hit Impact): thịch ngắn punchy
   */
  public playHitImpact(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42, this.ctx.currentTime + 0.075);

    gain.gain.setValueAtTime(0.36, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.075);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.075);
  }

  /**
   * 1.6 Chiêu K (Skill K): vút lướt kim chỉ với ánh sáng lung linh
   */
  public playSkillK(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    // Tiếng vút chính
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1250, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);

    // Tiếng lấp lánh (Shimmer harmonic)
    const shimmer = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(2200, this.ctx.currentTime + 0.05);
    shimmer.frequency.exponentialRampToValueAtTime(2600, this.ctx.currentTime + 0.22);

    sGain.gain.setValueAtTime(0.14, this.ctx.currentTime + 0.05);
    sGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    shimmer.connect(sGain);
    sGain.connect(this.sfxGain);
    shimmer.start(this.ctx.currentTime + 0.05);
    shimmer.stop(this.ctx.currentTime + 0.22);
  }

  /**
   * 1.7 Nhặt đồ (Item Pickup): âm thanh "ting" chuông sáng ngọt ngào
   */
  public playItemPickup(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    // Âm nốt kép A5 (880Hz) và A6 (1760Hz) tạo tiếng ting trong trẻo
    [880.0, 1760.0].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const amp = idx === 0 ? 0.24 : 0.14;
      gain.gain.setValueAtTime(amp, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    });
  }

  /**
   * Bí danh tương thích ngược
   */
  public playItemCollect(): void {
    this.playItemPickup();
  }

  /**
   * 1.8 Thẻ đúng (Truth Card Correct): Hợp âm sáng tươi vui, bừng nở
   */
  public playTruthCardCorrect(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    // Hợp âm D trưởng / Ngũ cung sáng rực rỡ (D5, F#5, A5, D6)
    const chord = [587.33, 739.99, 880.0, 1174.66];
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const startTime = this.ctx.currentTime + idx * 0.025;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.24, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  /**
   * 1.9 Thẻ sai (Truth Card Wrong): Nốt trầm ngắn, dịu dàng, KHÔNG chói gắt
   */
  public playTruthCardWrong(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3 trầm ấm
    osc.frequency.linearRampToValueAtTime(115.0, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  /**
   * 1.10 Khiên nứt / Khiên vỡ (Shield Crack & Break)
   */
  public playShieldCrack(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playShieldBreak(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    // Tiếng vỡ kính pha lê (Glass crystal shatter)
    const shards = [1400, 1850, 2400];
    shards.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const st = this.ctx.currentTime + idx * 0.02;
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, st + 0.25);

      gain.gain.setValueAtTime(0.22, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(st);
      osc.stop(st + 0.25);
    });

    // Tiếng bục vỡ trầm
    const lowSnap = this.ctx.createOscillator();
    const lowGain = this.ctx.createGain();
    lowSnap.type = 'triangle';
    lowSnap.frequency.setValueAtTime(180, this.ctx.currentTime);
    lowSnap.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
    lowGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    lowGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    lowSnap.connect(lowGain);
    lowGain.connect(this.sfxGain);
    lowSnap.start();
    lowSnap.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * 1.11 Boss tan biến (Boss Dissolve): Sợi chỉ bay tung tóe và tan thành bụi vàng
   */
  public playBossDissolve(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    // Dải ngũ cung lấp lánh bay vút lên thiên đàng (D5 -> E5 -> G5 -> A5 -> B5 -> D6)
    const sparkleNotes = [this.NOTE.D5, this.NOTE.E5, this.NOTE.G5, this.NOTE.A5, this.NOTE.B5, this.NOTE.D6];
    sparkleNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const st = this.ctx.currentTime + idx * 0.08;
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.24, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(st);
      osc.stop(st + 0.5);
    });
  }

  /**
   * 1.12 Mở khóa mảnh ghép (Fragment Unlock): hồi âm trang trọng cung đình
   */
  public playFragmentUnlock(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const notes = [this.NOTE.C5, this.NOTE.E5, this.NOTE.G5, this.NOTE.C6];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const st = this.ctx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(st);
      osc.stop(st + 0.65);
    });
  }

  /**
   * 1.13 Thắng (Victory Fanfare): Khải hoàn ca ngũ cung Huế rực rỡ
   */
  public playVictoryFanfare(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const fanfare = [
      { f: this.NOTE.D4, d: 0.16 },
      { f: this.NOTE.G4, d: 0.16 },
      { f: this.NOTE.A4, d: 0.18 },
      { f: this.NOTE.D5, d: 0.35 },
      { f: this.NOTE.B4, d: 0.18 },
      { f: this.NOTE.D5, d: 0.6 },
    ];

    let t = this.ctx.currentTime;
    fanfare.forEach((note) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.85;
    });
  }

  /**
   * 1.14 Thua (Defeat): Ký ức mờ dần, giai điệu ngũ cung trầm lắng dịu dàng
   */
  public playDefeatSound(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const defeatNotes = [this.NOTE.D4, this.NOTE.C4, this.NOTE.A3, this.NOTE.G3, this.NOTE.D3];
    let t = this.ctx.currentTime;

    defeatNotes.forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
      t += 0.22;
    });
  }

  /**
   * Âm thanh né đòn (Dodge)
   */
  public playDodge(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  /**
   * Âm thanh nhân vật nhận sát thương (Player Hurt)
   */
  public playPlayerHurt(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(65, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  /**
   * Chiêu đặc biệt "NÉM KIM CHỈ!!"
   */
  public playSpecialSkill(): void {
    this.playSkillK();
  }

  // ============================================================================
  // 2. NHẠC NỀN NGŨ CUNG TRUYỀN THỐNG 8-BIT (BGM PROCEDURAL ENGINE)
  // Mỗi cảnh một biến thể:
  // - 'menu': Nhẹ nhàng, thanh thoát Cố Đô Huế (TITLE & CHAPTER_MAP)
  // - 'level': Màn chạy sôi động hơn, nhịp điệu rộn ràng (LEVEL c1_m1 -> c1_m4)
  // - 'boss': Gấp gáp, dồn dập, căng thẳng kịch tính (BOSS Bóng Lãng Quên)
  // - 'rap_ao': Ráp áo êm đềm, thanh bình, tao nhã (RAP_AO & REMIX)
  // ============================================================================

  public playBGM(track: BGMTrack): void {
    if (track === this.currentTrack && this.bgmTimer) return;
    this.currentTrack = track;
    if (track === 'none') {
      this.stopBGM();
      return;
    }
    this.startBGMTrack(track);
  }

  public stopBGM(): void {
    if (this.bgmTimer) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public startAmbientBGM(): void {
    this.playBGM('menu');
  }

  private startBGMTrack(track: BGMTrack): void {
    this.stopBGM();
    this.initContext();
    if (!this.ctx || !this.duckGain) return;

    this.bgmStepIndex = 0;

    // Cấu hình nhịp và giai điệu ngũ cung theo từng cảnh
    let stepInterval = 520; // ms
    let leadNotes: number[] = [];
    let bassNotes: number[] = [];
    let leadWave: OscillatorType = 'triangle';
    let bassWave: OscillatorType = 'sine';
    let leadVolume = 0.18;
    let bassVolume = 0.22;

    if (track === 'menu') {
      // MENU: Thanh thoát, nhẹ nhàng sông Hương đêm trăng (100 BPM)
      stepInterval = 560;
      leadWave = 'triangle';
      bassWave = 'sine';
      leadVolume = 0.16;
      bassVolume = 0.22;
      leadNotes = [
        this.NOTE.D4, this.NOTE.G4, this.NOTE.A4, this.NOTE.B4,
        this.NOTE.A4, this.NOTE.G4, this.NOTE.E4, this.NOTE.D4,
        this.NOTE.G4, this.NOTE.B4, this.NOTE.D5, this.NOTE.B4,
        this.NOTE.A4, this.NOTE.G4, this.NOTE.E4, this.NOTE.D4,
      ];
      bassNotes = [
        this.NOTE.D3, this.NOTE.D3, this.NOTE.G3, this.NOTE.G3,
        this.NOTE.A3, this.NOTE.A3, this.NOTE.D3, this.NOTE.D3,
      ];
    } else if (track === 'level') {
      // LEVEL: Sôi động, phiêu lưu rộn ràng trên bờ thành Cố Đô (140 BPM)
      stepInterval = 350;
      leadWave = 'square';
      bassWave = 'triangle';
      leadVolume = 0.14;
      bassVolume = 0.24;
      leadNotes = [
        this.NOTE.D4, this.NOTE.D4, this.NOTE.G4, this.NOTE.A4,
        this.NOTE.B4, this.NOTE.A4, this.NOTE.D5, this.NOTE.B4,
        this.NOTE.A4, this.NOTE.G4, this.NOTE.A4, this.NOTE.G4,
        this.NOTE.E4, this.NOTE.G4, this.NOTE.E4, this.NOTE.D4,
        this.NOTE.D4, this.NOTE.E4, this.NOTE.G4, this.NOTE.A4,
        this.NOTE.B4, this.NOTE.D5, this.NOTE.E5, this.NOTE.D5,
        this.NOTE.B4, this.NOTE.A4, this.NOTE.G4, this.NOTE.E4,
        this.NOTE.G4, this.NOTE.A4, this.NOTE.D4, this.NOTE.D4,
      ];
      bassNotes = [
        this.NOTE.D3, this.NOTE.A3, this.NOTE.D3, this.NOTE.G3,
        this.NOTE.D3, this.NOTE.A3, this.NOTE.E3, this.NOTE.D3,
      ];
    } else if (track === 'boss') {
      // BOSS: Gấp gáp, dồn dập, căng thẳng kịch tính (170 BPM)
      stepInterval = 230;
      leadWave = 'square';
      bassWave = 'triangle';
      leadVolume = 0.15;
      bassVolume = 0.28;
      leadNotes = [
        this.NOTE.D4, this.NOTE.D4, this.NOTE.F4, this.NOTE.G4,
        this.NOTE.A4, this.NOTE.A4, this.NOTE.D5, this.NOTE.D5,
        this.NOTE.C5, this.NOTE.A4, this.NOTE.G4, this.NOTE.F4,
        this.NOTE.G4, this.NOTE.A4, this.NOTE.D4, this.NOTE.D4,
        this.NOTE.D5, this.NOTE.C5, this.NOTE.A4, this.NOTE.G4,
        this.NOTE.A4, this.NOTE.D5, this.NOTE.F5, this.NOTE.D5,
        this.NOTE.C5, this.NOTE.A4, this.NOTE.G4, this.NOTE.F4,
        this.NOTE.D4, this.NOTE.D4, this.NOTE.A4, this.NOTE.D4,
      ];
      bassNotes = [
        this.NOTE.D3, this.NOTE.D3, this.NOTE.A3, this.NOTE.A3,
        this.NOTE.D3, this.NOTE.D3, this.NOTE.F3, this.NOTE.G3,
      ];
    } else if (track === 'rap_ao') {
      // RAP_AO / REMIX: Ráp áo êm đềm, thanh bình, tao nhã (88 BPM)
      stepInterval = 660;
      leadWave = 'triangle';
      bassWave = 'sine';
      leadVolume = 0.18;
      bassVolume = 0.22;
      leadNotes = [
        this.NOTE.G4, this.NOTE.B4, this.NOTE.D5, this.NOTE.B4,
        this.NOTE.A4, this.NOTE.G4, this.NOTE.E4, this.NOTE.G4,
        this.NOTE.A4, this.NOTE.D5, this.NOTE.E5, this.NOTE.D5,
        this.NOTE.B4, this.NOTE.A4, this.NOTE.G4, this.NOTE.E4,
      ];
      bassNotes = [
        this.NOTE.G3, this.NOTE.D3, this.NOTE.G3, this.NOTE.E3,
      ];
    }

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || this.musicMuted || !this.ctx || !this.duckGain) return;
      if (this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;
      const noteFreq = leadNotes[this.bgmStepIndex % leadNotes.length];

      // Giai điệu Lead (8-bit square hoặc triangle)
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      leadOsc.type = leadWave;
      leadOsc.frequency.setValueAtTime(noteFreq, now);

      leadGain.gain.setValueAtTime(leadVolume, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepInterval * 0.001 * 0.92);

      leadOsc.connect(leadGain);
      leadGain.connect(this.duckGain);

      leadOsc.start(now);
      leadOsc.stop(now + stepInterval * 0.001 * 0.92);

      // Điểm xuyết Bass nền (mỗi 2 bước lead)
      if (this.bgmStepIndex % 2 === 0) {
        const bassIdx = Math.floor(this.bgmStepIndex / 2) % bassNotes.length;
        const bassFreq = bassNotes[bassIdx];
        const bassOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();

        bassOsc.type = bassWave;
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bGain.gain.setValueAtTime(bassVolume, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + stepInterval * 0.002 * 0.88);

        bassOsc.connect(bGain);
        bGain.connect(this.duckGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepInterval * 0.002 * 0.88);
      }

      this.bgmStepIndex++;
    }, stepInterval);
  }
}
