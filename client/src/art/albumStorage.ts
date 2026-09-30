/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * QUẢN LÝ BỘ SƯU TẬP ALBUM REMIX (SAVED LOOKS STORAGE)
 * Lưu trữ danh sách các bộ phối đồ đã được chấm điểm vào LocalStorage.
 */

import { OutfitSelection } from './paperdoll.ts';

export interface SavedLook {
  id: string;
  name: string;
  event: string;
  outfit: OutfitSelection;
  judgeResult: {
    den: 'xanh' | 'vang' | 'do';
    diem_hoa_hop: number;
    diem_ton_trong: number;
    diem_tot: string[];
    canh_bao: any[];
    the_kien_thuc?: any;
  };
  createdAt: string;
}

const STORAGE_KEY = 'tam_phuc_ky_saved_looks';

export class AlbumStorage {
  public static getLooks(): SavedLook[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveLook(look: Omit<SavedLook, 'id' | 'createdAt'>): SavedLook {
    const looks = this.getLooks();
    const newLook: SavedLook = {
      ...look,
      id: `look_${Date.now()}`,
      createdAt: new Date().toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    looks.unshift(newLook);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(looks));
    } catch (e) {
      console.warn('Không thể lưu vào localStorage:', e);
    }
    return newLook;
  }

  public static deleteLook(id: string): void {
    const looks = this.getLooks().filter((l) => l.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(looks));
    } catch (e) {
      console.warn('Lỗi khi xóa look:', e);
    }
  }
}
