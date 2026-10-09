/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * QUẢN LÝ CÀI ĐẶT TIẾP CẬN (ACCESSIBILITY SETTINGS MANAGER)
 * Hỗ trợ người chơi đa dạng: Giảm chuyển động (tắt rung/tia tốc độ), Tương phản cao, Chữ to,
 * Tùy chỉnh độ khó (Dễ / Thường), Bật/Tắt phím cảm ứng ảo.
 */

export interface AccessibilitySettings {
  reduceMotion: boolean;      // Giảm chuyển động (tắt camera shake, tắt speed lines, tắt bloom mạnh)
  highContrast: boolean;      // Chế độ tương phản cao cho người thị lực yếu
  largeText: boolean;         // Chữ to dễ đọc
  difficulty: 'de' | 'thuong';// Độ khó (Dễ: nhiều máu, quái chậm; Thường: chuẩn mực)
  virtualControls: boolean;   // Phím ảo trên màn hình
  volume: number;             // Âm lượng tổng (0 - 100%, mặc định 60%)
  muted: boolean;             // Tắt âm thanh toàn cục (Master Mute)
  musicMuted: boolean;        // Tùy chọn riêng: Tắt nhạc nền (BGM Mute)
  weatherEffects: boolean;    // Hiệu ứng thời tiết (Mưa bụi / Cánh hoa / Đom đóm pixel)
  postProcessingBloom: boolean;// Hậu kỳ nhẹ: Bloom vùng sáng & Vignette nhẹ (mặc định BẬT)
}

const STORAGE_KEY = 'tam_phuc_ky_a11y_settings';

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  public settings: AccessibilitySettings = {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    difficulty: 'thuong',
    virtualControls: true,
    volume: 60,
    muted: false,
    musicMuted: false,
    weatherEffects: true,
    postProcessingBloom: true,
  };

  private listeners: Array<(s: AccessibilitySettings) => void> = [];

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  public loadSettings(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.settings = { ...this.settings, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Lỗi đọc cài đặt tiếp cận:', e);
    }
  }

  public saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (e) {
      console.warn('Lỗi lưu cài đặt tiếp cận:', e);
    }
  }

  public updateSetting<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  public subscribe(fn: (s: AccessibilitySettings) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifyListeners(): void {
    for (const fn of this.listeners) {
      fn(this.settings);
    }
  }
}
