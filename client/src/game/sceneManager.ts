/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ QUẢN LÝ MÁY TRẠNG THÁI CẢNH DUY NHẤT (SCENE MANAGER)
 * TITLE → CHAPTER_MAP → LEVEL(c1_m1..c1_m4) → BOSS → RAP_AO → (REMIX) → CHAPTER_MAP
 * Chuyển cảnh bằng hiệu ứng mờ dần (Fade Transition) mượt mà 60Hz.
 */

import { ClothingCodexManager } from './clothingCodex.ts';

export type SceneType = 'TITLE' | 'CHAPTER_MAP' | 'LEVEL' | 'BOSS' | 'RAP_AO' | 'REMIX';

export interface LookbookEntry {
  id: string;
  su_kien: string;
  outfit: {
    ao: string;
    quan: string;
    dau: string;
    giay: string;
    phu_kien: string;
  };
  diem: number;
  danh_hieu: string;
  nhan_xet: string;
  ngay_tao: string;
}

export class SceneManager {
  private static instance: SceneManager;

  public currentScene: SceneType = 'TITLE';
  public targetScene: SceneType | null = null;
  public currentLevelId = 'c1_m1';

  // Hiệu ứng chuyển cảnh 0.4 giây (Fade hoặc Quét ngang Cuộn Vải - Yêu cầu 9)
  public fadeAlpha = 0.0;
  public fadeState: 'none' | 'fade_out' | 'fade_in' = 'none';
  public transitionType: 'fade' | 'wipe' = 'wipe';
  private fadeSpeed = 1 / 12; // 12 khung ra + 12 khung vào = 24 khung = đúng chuẩn 0.4 giây tại 60Hz

  // ============================================================================
  // TIẾN TRÌNH TRẠNG THÁI THEO YÊU CẦU:
  // manh_da_co, the_da_hoc, man_da_qua, boss_da_ha, ao_da_rap, lookbook
  // ============================================================================
  public manh_da_co: string[] = [];
  public the_da_hoc: string[] = [];
  public man_da_qua: string[] = ['c1_m1'];
  public boss_da_ha = false;
  public ao_da_rap = false;
  public lookbook: LookbookEntry[] = [];

  // Thuộc tính tương thích ngược cho logic cũ
  public unlockedStages: string[] = ['c1_m1'];
  public collectedPieces: string[] = [];
  public isBossDefeated = false;
  public isGarmentAssembled = false;

  // Menu và Modal trong Canvas
  public isPaused = false;            // Tạm dừng trò chơi (Phím P hoặc nút cảm ứng)
  public isPauseJournalOpen = false; // Tương thích ngược
  public isArtisanChatOpen = false;   // Phím T (Cô Hạnh / Nghệ Nhân)
  public isSettingsModalOpen = false; // Cài đặt âm thanh & A11y
  public isCodexOpen = false;         // Bách khoa Cổ phục (Phím C)
  public isStoryCutsceneOpen = false; // Cốt truyện mở đầu Mất Áo với Cô Hạnh

  // Chế độ chụp ảnh minh chứng (Photo Mode)
  public isTimeFrozen = false;
  public hideDebugHud = false;
  public photoModeTarget: 'A' | 'B' | 'C' | null = null;
  public activeProofScene: 'A' | 'B' | 'C' | null = null;

  private constructor() {
    this.loadProgress();
  }

  public static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  public loadProgress(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem('tam_phuc_ky_progress');
        if (data) {
          const parsed = JSON.parse(data);
          this.manh_da_co = parsed.manh_da_co || parsed.collectedPieces || [];
          this.the_da_hoc = parsed.the_da_hoc || [];
          this.man_da_qua = parsed.man_da_qua || parsed.unlockedStages || ['c1_m1'];
          this.boss_da_ha = Boolean(parsed.boss_da_ha ?? parsed.isBossDefeated);
          this.ao_da_rap = Boolean(parsed.ao_da_rap ?? parsed.isGarmentAssembled);
          this.lookbook = Array.isArray(parsed.lookbook) ? parsed.lookbook : [];
        } else {
          this.manh_da_co = [];
          this.the_da_hoc = [];
          this.man_da_qua = ['c1_m1'];
          this.boss_da_ha = false;
          this.ao_da_rap = false;
          this.lookbook = [];
        }
      }

      this.collectedPieces = this.manh_da_co;
      this.unlockedStages = this.man_da_qua;
      this.isBossDefeated = this.boss_da_ha;
      this.isGarmentAssembled = this.ao_da_rap;

      ClothingCodexManager.getInstance().syncWithProgress(this.man_da_qua, this.boss_da_ha, this.ao_da_rap);
    } catch (e) {
      console.warn('Lỗi đọc tiến trình:', e);
    }
  }

  public saveProgress(): void {
    try {
      this.collectedPieces = this.manh_da_co;
      this.unlockedStages = this.man_da_qua;
      this.isBossDefeated = this.boss_da_ha;
      this.isGarmentAssembled = this.ao_da_rap;

      if (typeof localStorage !== 'undefined') {
        const data = {
          manh_da_co: this.manh_da_co,
          the_da_hoc: this.the_da_hoc,
          man_da_qua: this.man_da_qua,
          boss_da_ha: this.boss_da_ha,
          ao_da_rap: this.ao_da_rap,
          lookbook: this.lookbook,
          unlockedStages: this.man_da_qua,
          collectedPieces: this.manh_da_co,
          isBossDefeated: this.boss_da_ha,
          isGarmentAssembled: this.ao_da_rap,
        };
        localStorage.setItem('tam_phuc_ky_progress', JSON.stringify(data));
      }
      ClothingCodexManager.getInstance().syncWithProgress(this.man_da_qua, this.boss_da_ha, this.ao_da_rap);
    } catch (e) {
      console.warn('Lỗi lưu tiến trình:', e);
    }
  }

  /**
   * Nút "Chơi lại từ đầu" - Reset toàn bộ trạng thái tiến độ về điểm khởi đầu
   */
  public resetProgress(): void {
    this.manh_da_co = [];
    this.the_da_hoc = [];
    this.man_da_qua = ['c1_m1'];
    this.boss_da_ha = false;
    this.ao_da_rap = false;
    this.lookbook = [];
    this.collectedPieces = [];
    this.unlockedStages = ['c1_m1'];
    this.isBossDefeated = false;
    this.isGarmentAssembled = false;
    this.currentLevelId = 'c1_m1';
    try {
      localStorage.removeItem('tam_phuc_ky_progress');
    } catch (e) {
      console.warn(e);
    }
    this.saveProgress();
    this.changeScene('TITLE');
  }

  public hocThe(theId: string): void {
    if (!this.the_da_hoc.includes(theId)) {
      this.the_da_hoc.push(theId);
      this.saveProgress();
    }
  }

  public thuThapManh(manhId: string): void {
    if (!this.manh_da_co.includes(manhId)) {
      this.manh_da_co.push(manhId);
      this.saveProgress();
    }
  }

  public quaMan(manId: string): void {
    if (!this.man_da_qua.includes(manId)) {
      this.man_da_qua.push(manId);
      this.saveProgress();
    }
  }

  public luuLookbook(entry: LookbookEntry): void {
    this.lookbook.unshift(entry);
    this.saveProgress();
  }

  /**
   * Bắt đầu chuyển cảnh với hiệu ứng mờ dần hoặc quét ngang cuộn vải 0.4 giây (Yêu cầu 9)
   */
  public changeScene(target: SceneType, levelId?: string, transition: 'fade' | 'wipe' = 'wipe'): void {
    if (this.fadeState !== 'none') return;
    this.targetScene = target;
    this.transitionType = transition;
    if (levelId) {
      this.currentLevelId = levelId;
    }
    this.fadeState = 'fade_out';
  }

  /**
   * Cập nhật máy trạng thái chuyển cảnh
   */
  public update(): void {
    if (this.fadeState === 'fade_out') {
      this.fadeAlpha += this.fadeSpeed;
      if (this.fadeAlpha >= 1.0) {
        this.fadeAlpha = 1.0;
        if (this.targetScene) {
          this.currentScene = this.targetScene;
          this.targetScene = null;
        }
        this.fadeState = 'fade_in';
      }
    } else if (this.fadeState === 'fade_in') {
      this.fadeAlpha -= this.fadeSpeed;
      if (this.fadeAlpha <= 0.0) {
        this.fadeAlpha = 0.0;
        this.fadeState = 'none';
      }
    }
  }

  /**
   * Vẽ lớp phủ chuyển cảnh: Mờ dần (Fade) hoặc Quét ngang kiểu Cuộn Vải Lụa (Wipe 0.4s - Yêu cầu 9)
   */
  public renderFade(ctx: CanvasRenderingContext2D, width = 480, height = 270): void {
    if (this.fadeAlpha <= 0.001) return;

    if (this.transitionType === 'wipe') {
      ctx.save();
      if (this.fadeState === 'fade_out') {
        const wipeW = Math.round(width * this.fadeAlpha);
        ctx.fillStyle = '#0f0d1b';
        ctx.fillRect(0, 0, wipeW, height);

        ctx.fillStyle = '#ba5e1b';
        ctx.fillRect(wipeW - 5, 0, 2, height);
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(wipeW - 3, 0, 3, height);
      } else if (this.fadeState === 'fade_in') {
        const wipeX = Math.round(width * (1 - this.fadeAlpha));
        ctx.fillStyle = '#0f0d1b';
        ctx.fillRect(wipeX, 0, width - wipeX, height);

        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(wipeX, 0, 3, height);
        ctx.fillStyle = '#ba5e1b';
        ctx.fillRect(wipeX + 3, 0, 2, height);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = `rgba(15, 13, 27, ${this.fadeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  public unlockNextLevel(): void {
    const sequence = ['c1_m1', 'c1_m2', 'c1_m3', 'c1_m4', 'c1_boss'];
    const idx = sequence.indexOf(this.currentLevelId);
    if (idx >= 0 && idx < sequence.length - 1) {
      const nextId = sequence[idx + 1];
      if (!this.man_da_qua.includes(nextId)) {
        this.man_da_qua.push(nextId);
        this.unlockedStages = this.man_da_qua;
        this.saveProgress();
      }
    }
  }

  /**
   * Dựng cảnh ẢNH A: Mini-boss Màn 3 (c1_m3)
   */
  public setupProofSceneA(): void {
    this.photoModeTarget = 'A';
    this.activeProofScene = 'A';
    this.currentScene = 'LEVEL';
    this.currentLevelId = 'c1_m3';
    this.targetScene = null;
    this.fadeState = 'none';
    this.fadeAlpha = 0;
    this.isTimeFrozen = true;
    this.hideDebugHud = true;
  }

  /**
   * Dựng cảnh ẢNH B: Boss Cuối (Bóng Lãng Quên)
   */
  public setupProofSceneB(): void {
    this.photoModeTarget = 'B';
    this.activeProofScene = 'B';
    this.currentScene = 'BOSS';
    this.targetScene = null;
    this.fadeState = 'none';
    this.fadeAlpha = 0;
    this.isTimeFrozen = true;
    this.hideDebugHud = true;
  }

  /**
   * Dựng cảnh ẢNH C: Ráp Áo (1 mảnh đặt sai)
   */
  public setupProofSceneC(): void {
    this.photoModeTarget = 'C';
    this.activeProofScene = 'C';
    this.currentScene = 'RAP_AO';
    this.targetScene = null;
    this.fadeState = 'none';
    this.fadeAlpha = 0;
    this.isTimeFrozen = true;
    this.hideDebugHud = true;
  }
}

