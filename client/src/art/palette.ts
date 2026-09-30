/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BẢNG MÀU CHUẨN 32 MÀU (PALETTE) - DỰ ÁN "TẦM PHỤC KÝ"
 * Phong cách: Pixel art 32-bit Arcade, gam màu ấm hoàng hôn Cố đô Huế.
 * Viền: Tím than / Nâu sẫm đậm 1px (Tuyệt đối không dùng #000000 thuần).
 * Nguồn sáng: Top-Left (Trên - Trái).
 */

export interface PaletteColor {
  index: number;
  hex: string;
  name: string;
  category: 'dark_outline' | 'navy_bg' | 'amber_gold' | 'terracotta_red' | 'teal_jade' | 'lotus_pink' | 'parchment_light';
}

export const PALETTE: PaletteColor[] = [
  // 1. Nhóm viền & bóng tối (Dark Outlines & Deep Shadows - thay cho đen thuần)
  { index: 0, hex: '#161426', name: 'Tím Than Cung Đình', category: 'dark_outline' },
  { index: 1, hex: '#261b2d', name: 'Nâu Trầm Cổ Mộc', category: 'dark_outline' },
  { index: 2, hex: '#3b253b', name: 'Tím Rêu Phong', category: 'dark_outline' },
  { index: 3, hex: '#4f3547', name: 'Nâu Vỏ Măng', category: 'dark_outline' },

  // 2. Nhóm nền Navy & Đêm hoàng thành (Deep Navy & Atmospheric Tones)
  { index: 4, hex: '#15213b', name: 'Lam Đêm Ngọ Môn', category: 'navy_bg' },
  { index: 5, hex: '#1f3354', name: 'Xanh Chàm Đậm', category: 'navy_bg' },
  { index: 6, hex: '#2a4b73', name: 'Sông Hương Sẩm Tối', category: 'navy_bg' },
  { index: 7, hex: '#3b6b99', name: 'Sương Khói Lam Giang', category: 'navy_bg' },

  // 3. Nhóm Vàng Kim & Cam Hổ Phách (Imperial Gold & Amber Sunset)
  { index: 8, hex: '#7a3d13', name: 'Nâu Hổ Phách Đậm', category: 'amber_gold' },
  { index: 9, hex: '#ba5e1b', name: 'Cam Đất Nung', category: 'amber_gold' },
  { index: 10, hex: '#e88827', name: 'Cam Hoàng Hôn Huế', category: 'amber_gold' },
  { index: 11, hex: '#f7af34', name: 'Vàng Lưu Ly Cung Đình', category: 'amber_gold' },
  { index: 12, hex: '#fedb5b', name: 'Vàng Hoàng Kim Rực Rỡ', category: 'amber_gold' },
  { index: 13, hex: '#fff39e', name: 'Ánh Nắng Ban Chiều', category: 'amber_gold' },

  // 4. Nhóm Đỏ Gạch & Hồng Sen (Terracotta, Crimson & Lotus)
  { index: 14, hex: '#541924', name: 'Máu Đỏ Rượu Vang', category: 'terracotta_red' },
  { index: 15, hex: '#87232e', name: 'Đỏ Điều Cung Cấm', category: 'terracotta_red' },
  { index: 16, hex: '#bf363b', name: 'Đỏ Gạch Thành Quách', category: 'terracotta_red' },
  { index: 17, hex: '#e85a53', name: 'Đỏ San Hô Tươi', category: 'terracotta_red' },
  { index: 18, hex: '#a83b6f', name: 'Tím Huế Mộng Mơ', category: 'lotus_pink' },
  { index: 19, hex: '#d96499', name: 'Hồng Sen Thừa Phủ', category: 'lotus_pink' },
  { index: 20, hex: '#f29ec0', name: 'Cánh Sen E Ấp', category: 'lotus_pink' },

  // 5. Nhóm Xanh Ngọc & Teal Sông Nước (Jade, Teal & Flora)
  { index: 21, hex: '#143838', name: 'Xanh Rêu Đáy Hồ', category: 'teal_jade' },
  { index: 22, hex: '#1c5e59', name: 'Xanh Cổ Vịt Tối', category: 'teal_jade' },
  { index: 23, hex: '#268c7e', name: 'Xanh Ngọc Bích', category: 'teal_jade' },
  { index: 24, hex: '#40bfa3', name: 'Xanh Lá Non Triền Đê', category: 'teal_jade' },
  { index: 25, hex: '#77e0b5', name: 'Ngọc Bích Thanh Khiết', category: 'teal_jade' },

  // 6. Nhóm Giấy Điệp, Lụa Trắng & Nắng Nhạt (Parchment, White Silk & Skin tones)
  { index: 26, hex: '#63534b', name: 'Nâu Vải Đay', category: 'parchment_light' },
  { index: 27, hex: '#947a6b', name: 'Gỗ Mộc Trầm Tích', category: 'parchment_light' },
  { index: 28, hex: '#c7aa8d', name: 'Giấy Điệp Làng Chuồn', category: 'parchment_light' },
  { index: 29, hex: '#e8d2b7', name: 'Lụa Tơ Tằm Trắng Ngà', category: 'parchment_light' },
  { index: 30, hex: '#f7edd7', name: 'Trắng Sữa Vải Mộc', category: 'parchment_light' },
  { index: 31, hex: '#ffffff', name: 'Bạch Điểm Sáng Nhất', category: 'parchment_light' },
];

/**
 * Bản đồ mã màu tra cứu nhanh theo ID ký tự ASCII (Char Map cho Code-based Sprites)
 */
export const CHAR_PALETTE_MAP: Record<string, string> = {
  '.': 'transparent', // Trong suốt
  '#': PALETTE[0].hex, // Viền tím than (#161426)
  'X': PALETTE[1].hex, // Nâu trầm cổ mộc (#261b2d)
  'N': PALETTE[4].hex, // Lam đêm Ngọ Môn (#15213b)
  'n': PALETTE[6].hex, // Xanh sông Hương (#2a4b73)
  'o': PALETTE[8].hex, // Nâu hổ phách (#7a3d13)
  'O': PALETTE[10].hex, // Cam hoàng hôn (#e88827)
  'Y': PALETTE[11].hex, // Vàng lưu ly (#f7af34)
  'y': PALETTE[12].hex, // Vàng hoàng kim (#fedb5b)
  'W': PALETTE[13].hex, // Vàng nhạt (#fff39e)
  'R': PALETTE[15].hex, // Đỏ điều (#87232e)
  'r': PALETTE[16].hex, // Đỏ gạch (#bf363b)
  'P': PALETTE[18].hex, // Tím Huế (#a83b6f)
  'p': PALETTE[19].hex, // Hồng sen (#d96499)
  'T': PALETTE[22].hex, // Xanh cổ vịt (#1c5e59)
  't': PALETTE[23].hex, // Xanh ngọc (#268c7e)
  'G': PALETTE[24].hex, // Xanh lá non (#40bfa3)
  'd': PALETTE[27].hex, // Gỗ mộc (#947a6b)
  'L': PALETTE[28].hex, // Giấy điệp (#c7aa8d)
  'l': PALETTE[29].hex, // Lụa tơ tằm ngà (#e8d2b7)
  'w': PALETTE[30].hex, // Trắng sữa (#f7edd7)
  '!': PALETTE[31].hex, // Trắng tinh highlight (#ffffff)
};

/**
 * Lấy mã màu HEX từ index trong palette (0-31)
 */
export function getPaletteColor(index: number): string {
  if (index >= 0 && index < PALETTE.length) {
    return PALETTE[index].hex;
  }
  return PALETTE[0].hex;
}
