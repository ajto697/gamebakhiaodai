/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ TỔNG HỢP ÂM THANH NGŨ CUNG XỨ HUẾ (VIETNAMESE PENTATONIC AUDIO SYNTHESIZER)
 * Tự tạo 100% hiệu ứng âm thanh (SFX) và nhạc nền pentatonic bằng Web Audio API thuần.
 * Không cần file audio ngoài, có nút bật/tắt toàn cục và thanh chỉnh âm lượng.
 */

import { AccessibilityManager } from './accessibility.ts';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterVolume = 0.75;
  private bgmPlaying = false;
  private bgmTimer: number | null = null;

  // Thang âm ngũ cung Huế (Hò - Xự - Xang - Xê - Cống: D4, E4, G4, A4, B4, D5)
  private pentatonicFreqs = [293.66, 329.63, 392.00, 440.00, 493.88, 587.33];

  private constructor() {
    const a11y = AccessibilityManager.getInstance();
    this.muted = a11y.settings.muted;
    this.masterVolume = a11y.settings.volume / 100;
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    AccessibilityManager.getInstance().updateSetting('muted', muted);
    if (muted && this.bgmTimer) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
      this.bgmPlaying = false;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    AccessibilityManager.getInstance().updateSetting('volume', Math.round(this.masterVolume * 100));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Âm thanh vung đòn đánh (Attack Whoosh)
   */
  public playAttackSwing(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    const targetGain = 0.25 * this.masterVolume;
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Âm thanh đòn đánh trúng mục tiêu (Hit Impact)
   */
  public playHitImpact(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    const targetGain = 0.35 * this.masterVolume;
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Âm thanh nhảy bật lên (Jump)
   */
  public playJump(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.18);

    const targetGain = 0.2 * this.masterVolume;
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  /**
   * Âm thanh lướt né (Dodge Whoosh)
   */
  public playDodge(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.16);

    const targetGain = 0.2 * this.masterVolume;
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  /**
   * Âm thanh Chiêu Đặc Biệt "NÉM KIM CHỈ!!"
   */
  public playSpecialSkill(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    [587.33, 880.00, 1174.66].forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.05);

      const targetGain = 0.2 * this.masterVolume;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.35);
    });
  }

  /**
   * Âm thanh chọn thẻ / nhặt vật phẩm
   */
  public playItemCollect(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);

    const targetGain = 0.25 * this.masterVolume;
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Âm thanh nhân vật bị trúng đòn
   */
  public playPlayerHurt(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.2);

    const targetGain = 0.3 * this.masterVolume;
    gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Âm thanh Khải Hoàn Ca Chiến Thắng (Victory Fanfare ngũ cung)
   */
  public playVictoryFanfare(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const fanfareNotes = [293.66, 392.00, 440.00, 587.33, 880.00];
    fanfareNotes.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.12);

      const targetGain = 0.22 * this.masterVolume;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.4);
    });
  }

  /**
   * Bật nhạc nền phong cách Ngũ cung nhẹ nhàng âm hưởng Cố đô Huế
   */
  public startAmbientBGM(): void {
    if (this.muted || this.bgmPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    let noteIndex = 0;

    // Giai điệu ngũ cung truyền thống (Hò - Xự - Xang - Xê - Cống)
    const melody = [0, 1, 2, 4, 3, 2, 1, 0, 2, 3, 4, 5, 4, 2, 1, 0];

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || !this.ctx) return;
      const freq = this.pentatonicFreqs[melody[noteIndex % melody.length] % this.pentatonicFreqs.length];
      noteIndex++;

      // Mô phỏng tiếng gảy Đàn Tranh truyền thống (pluckdecay)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const targetGain = 0.08 * this.masterVolume;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.65);
    }, 580);
  }
}
