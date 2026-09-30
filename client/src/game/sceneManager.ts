/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ QUẢN LÝ MÁY TRẠNG THÁI CẢNH DUY NHẤT (SCENE MANAGER)
 * TITLE → CHAPTER_MAP → LEVEL(c1_m1..c1_m4) → BOSS → RAP_AO → (REMIX) → CHAPTER_MAP
 * Chuyển cảnh bằng hiệu ứng mờ dần (Fade Transition) mượt mà 60Hz.
 */

export type SceneType = 'TITLE' | 'CHAPTER_MAP' | 'LEVEL' | 'BOSS' | 'RAP_AO' | 'REMIX';

export class SceneManager {
  private static instance: SceneManager;

  public currentScene: SceneType = 'TITLE';
  public targetScene: SceneType | null = null;
  public currentLevelId = 'c1_m1';

  // Hiệu ứng mờ dần chuyển cảnh
  public fadeAlpha = 0.0;
  public fadeState: 'none' | 'fade_out' | 'fade_in' = 'none';
  private fadeSpeed = 0.08;

  // Tiến trình cốt truyện Chương 1: Áo Ngũ Thân Cố Đô Huế
  public unlockedStages: string[] = ['c1_m1'];
  public collectedPieces: string[] = [];
  public isBossDefeated = false;
  public isGarmentAssembled = false;

  // Menu và Modal trong Canvas
  public isPaused = false;            // Tạm dừng trò chơi (Phím P hoặc nút cảm ứng)
  public isPauseJournalOpen = false; // Tương thích ngược
  public isArtisanChatOpen = false;   // Phím T
  public isSettingsModalOpen = false; // Cài đặt âm thanh & A11y

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
      const data = localStorage.getItem('tam_phuc_ky_progress');
      if (data) {
        const parsed = JSON.parse(data);
        this.unlockedStages = parsed.unlockedStages || ['c1_m1'];
        this.collectedPieces = parsed.collectedPieces || [];
        this.isBossDefeated = Boolean(parsed.isBossDefeated);
        this.isGarmentAssembled = Boolean(parsed.isGarmentAssembled);
      }
    } catch (e) {
      console.warn('Lỗi đọc tiến trình:', e);
    }
  }

  public saveProgress(): void {
    try {
      const data = {
        unlockedStages: this.unlockedStages,
        collectedPieces: this.collectedPieces,
        isBossDefeated: this.isBossDefeated,
        isGarmentAssembled: this.isGarmentAssembled,
      };
      localStorage.setItem('tam_phuc_ky_progress', JSON.stringify(data));
    } catch (e) {
      console.warn('Lỗi lưu tiến trình:', e);
    }
  }

  /**
   * Bắt đầu chuyển cảnh với hiệu ứng mờ dần ngắn
   */
  public changeScene(target: SceneType, levelId?: string): void {
    if (this.fadeState !== 'none') return;
    this.targetScene = target;
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
   * Vẽ lớp phủ mờ chuyển cảnh lên màn hình (Letterbox Navy #0f0d1b)
   */
  public renderFade(ctx: CanvasRenderingContext2D, width = 480, height = 270): void {
    if (this.fadeAlpha > 0.001) {
      ctx.fillStyle = `rgba(15, 13, 27, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  public unlockNextLevel(): void {
    const sequence = ['c1_m1', 'c1_m2', 'c1_m3', 'c1_m4', 'c1_boss'];
    const idx = sequence.indexOf(this.currentLevelId);
    if (idx >= 0 && idx < sequence.length - 1) {
      const nextId = sequence[idx + 1];
      if (!this.unlockedStages.includes(nextId)) {
        this.unlockedStages.push(nextId);
        this.saveProgress();
      }
    }
  }
}
