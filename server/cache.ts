/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ NHỚ ĐỆM PHÍA SERVER (IN-MEMORY CACHE WITH TTL)
 * Giúp tối ưu hóa chi phí API, tăng tốc độ phản hồi tức thì và hỗ trợ vận hành ngoại tuyến.
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Lưu giá trị vào cache với thời gian sống (TTL) tính bằng mili-giây
   */
  public set<T>(key: string, value: T, ttlMs = 1000 * 60 * 30): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Lấy giá trị từ cache nếu chưa hết hạn
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public size(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const globalCache = new SimpleCache();
