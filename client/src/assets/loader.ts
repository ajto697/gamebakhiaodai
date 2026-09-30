/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TRÌNH NẠP TÀI SẢN (ASSET LOADER & FALLBACK MANAGER)
 * Đọc manifest.json. Nếu file ảnh thiếu, tự động tạo sprite dự phòng bằng code.
 * Theo dõi cảnh báo tài sản thiếu phục vụ chế độ Debug (Phím D).
 */

import manifestData from './manifest.json';
import {
  BlitSpriteSheet,
  FALLBACK_SPRITE_REGISTRY,
  createHeroIdleFallback,
} from '../art/fallbackSprites.ts';

export interface SpriteAnchor {
  foot: { x: number; y: number };
  head?: { x: number; y: number };
  hand?: { x: number; y: number };
}

export interface ManifestSpriteEntry {
  id: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  anchor: SpriteAnchor;
  animations: Record<string, number[]>;
}

export class AssetManager {
  private static instance: AssetManager;
  public sprites: Map<string, BlitSpriteSheet> = new Map();
  public manifestEntries: Map<string, ManifestSpriteEntry> = new Map();
  public missingAssetIds: string[] = [];
  public isLoaded = false;

  private constructor() {
    // Nạp danh mục từ manifest
    for (const entry of (manifestData as any).sprites as ManifestSpriteEntry[]) {
      this.manifestEntries.set(entry.id, entry);
      // Khởi tạo ngay lập tức bằng fallback sprite để không bao giờ bị rỗng
      const fallbackCreator = FALLBACK_SPRITE_REGISTRY[entry.id];
      if (fallbackCreator) {
        this.sprites.set(entry.id, fallbackCreator());
      } else {
        const genericFallback = createHeroIdleFallback();
        genericFallback.id = entry.id;
        this.sprites.set(entry.id, genericFallback);
      }
    }
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Khởi động nạp toàn bộ tài sản trong manifest
   */
  public async loadAll(): Promise<void> {
    const entries = Array.from(this.manifestEntries.values());
    const loadPromises = entries.map((entry) => this.loadSingleSprite(entry));

    await Promise.all(loadPromises);
    this.isLoaded = true;
    console.log(
      `[AssetManager] Hoàn tất nạp ${this.sprites.size} tài sản. Số tài sản dùng sprite dự phòng bằng code: ${this.missingAssetIds.length}.`
    );
  }

  private async loadSingleSprite(entry: ManifestSpriteEntry): Promise<void> {
    const fullPath = (manifestData as any).basePath + entry.file;

    try {
      const img = await this.loadImageAsync(fullPath);
      // Nạp thành công PNG -> cắt thành các frame canvas
      const sheet = this.sliceSpriteSheet(img, entry);
      this.sprites.set(entry.id, sheet);
    } catch {
      // Thiếu file PNG -> Tự động dùng fallback sprite
      this.missingAssetIds.push(entry.id);
      const fallbackCreator = FALLBACK_SPRITE_REGISTRY[entry.id];

      if (fallbackCreator) {
        const fallbackSheet = fallbackCreator();
        this.sprites.set(entry.id, fallbackSheet);
      } else {
        // Fallback mặc định nếu chưa định nghĩa cụ thể
        const genericFallback = createHeroIdleFallback();
        genericFallback.id = entry.id;
        this.sprites.set(entry.id, genericFallback);
      }
    }
  }

  private loadImageAsync(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }

  private sliceSpriteSheet(
    img: HTMLImageElement,
    entry: ManifestSpriteEntry
  ): BlitSpriteSheet {
    const frames: HTMLCanvasElement[] = [];
    const count = entry.frameCount || 1;

    for (let i = 0; i < count; i++) {
      const c = document.createElement('canvas');
      c.width = entry.frameWidth;
      c.height = entry.frameHeight;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          img,
          i * entry.frameWidth,
          0,
          entry.frameWidth,
          entry.frameHeight,
          0,
          0,
          entry.frameWidth,
          entry.frameHeight
        );
      }
      frames.push(c);
    }

    return {
      id: entry.id,
      frameWidth: entry.frameWidth,
      frameHeight: entry.frameHeight,
      frameCount: count,
      fps: entry.fps || 6,
      frames,
      isFallback: false,
    };
  }

  /**
   * Lấy SpriteSheet theo ID (luôn đảm bảo trả về sprite hợp lệ qua fallback)
   */
  public getSprite(id: string): BlitSpriteSheet {
    let sprite = this.sprites.get(id);
    if (!sprite) {
      const fallbackCreator = FALLBACK_SPRITE_REGISTRY[id];
      if (fallbackCreator) {
        sprite = fallbackCreator();
      } else {
        sprite = createHeroIdleFallback();
        sprite.id = id;
      }
      this.sprites.set(id, sprite);
    }
    return sprite;
  }

  /**
   * Lấy điểm neo Anchor của Sprite từ Manifest
   */
  public getAnchor(id: string): SpriteAnchor {
    const entry = this.manifestEntries.get(id);
    if (entry && entry.anchor) {
      return entry.anchor;
    }
    return { foot: { x: 24, y: 46 } };
  }
}
