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
 * Bảng màu 3 tông riêng biệt (Highlight, Midtone, Shadow) cho từng cổ phục trong Codex 64x96
 * Quy tắc: Nguồn sáng trên - trái (Top-Left), viền nâu/tím đậm 1px (không dùng #000000).
 */
export interface Garment3TonePalette {
  id: string;
  name: string;
  outline: string;
  highlight: string;
  midtone: string;
  shadow: string;
  accents: Record<string, string>;
}

export const CODEX_GARMENT_PALETTES: Record<string, Garment3TonePalette> = {
  ao_ngu_than: {
    id: 'ao_ngu_than',
    name: 'Áo Ngũ Thân Tay Chẽn',
    outline: '#161426',
    highlight: '#7a586e',
    midtone: '#4f3547',
    shadow: '#2d1f2b',
    accents: {
      goldButtons: '#fedb5b',
      innerCollar: '#f7edd7',
      ditherBrocade: 'rgba(254, 219, 91, 0.18)',
    },
  },
  ao_tac: {
    id: 'ao_tac',
    name: 'Áo Tấc (Áo Tay Thụng)',
    outline: '#161426',
    highlight: '#3b6b99',
    midtone: '#1f3354',
    shadow: '#121e33',
    accents: {
      goldButtons: '#fedb5b',
      cuffLining: '#f7edd7',
      innerCollar: '#f7edd7',
    },
  },
  ao_nhat_binh: {
    id: 'ao_nhat_binh',
    name: 'Áo Nhật Bình',
    outline: '#331612',
    highlight: '#e6434a',
    midtone: '#ba252b',
    shadow: '#7a181c',
    accents: {
      goldCollar: '#fedb5b',
      goldCollarDark: '#e09922',
      tealEmbroidery: '#40bfa3',
      navyWave: '#1e3863',
      whiteSilk: '#fcf6ec',
      cuffNavy: '#1e3863',
      cuffGold: '#fedb5b',
      cuffWhite: '#fcf6ec',
      cuffRed: '#ba252b',
      cuffJade: '#40bfa3',
    },
  },
  ao_giao_linh: {
    id: 'ao_giao_linh',
    name: 'Áo Giao Lĩnh',
    outline: '#161426',
    highlight: '#40bfa3',
    midtone: '#1c5e59',
    shadow: '#103633',
    accents: {
      sashGold: '#fedb5b',
      innerCollar: '#f7edd7',
    },
  },
  ao_tu_than: {
    id: 'ao_tu_than',
    name: 'Áo Tứ Thân Kinh Bắc',
    outline: '#261b2d',
    highlight: '#ba5e1b',
    midtone: '#7a3d13',
    shadow: '#45220a',
    accents: {
      yemPink: '#d96499',
      beltGreen: '#40bfa3',
      skirtDark: '#161426',
    },
  },
  ao_ba_ba: {
    id: 'ao_ba_ba',
    name: 'Áo Bà Ba Nam Bộ',
    outline: '#161426',
    highlight: '#77e0b5',
    midtone: '#268c7e',
    shadow: '#144a42',
    accents: {
      buttons: '#fedb5b',
      scarfWhite: '#f7edd7',
      scarfBlack: '#161426',
      pantsBlack: '#161426',
    },
  },
};

/**
 * Hàm sinh ma trận ký tự 64x96 cho từng trang phục cổ phục:
 * - Kích thước chuẩn xác: 64 cột x 96 dòng.
 * - Quy tắc 3 tông: Nguồn sáng Trên - Trái (Top-Left):
 *   'H': Sáng (Highlight - vai trái, thân trái)
 *   'M': Chính (Midtone - trung tâm, thân áo)
 *   'S': Tối (Shadow - vai phải, nách phải, tà phải)
 * - Viền 1px: '#' (Nâu / tím đậm, không dùng đen thuần)
 * - Nếp gấp: 'F' (vai, thân)
 * - Đường khuy: 'B'
 * - Cổ áo: 'C' (cổ chính), 'c' (lót trắng/cửa tay)
 * - Họa tiết lặp 8x8 với dithering: 'E'
 * - Dải ngũ sắc: '1' (Navy), '2' (Vàng), '3' (Trắng), '4' (Đỏ), '5' (Lục)
 * - Sóng nước thủy ba: 'W', Ba ngọn tam sơn: 'T', Kim khánh: 'K'
 * - Yếm đào: 'Y', Thắt lưng: 'G', Váy/quần: 'P', Khăn rằn: 'R', Túi áo: 'Q', Nẹp vạt chéo: 'X'
 */
export function generateCodexCharMatrix(id: string): string[] {
  const rows: string[] = [];
  const W = 64;
  const H = 96;

  for (let y = 0; y < H; y++) {
    const r: string[] = new Array(W).fill('.');

    if (id === 'ao_ngu_than') {
      // 1. ÁO NGŨ THÂN TAY CHẼN (64x96)
      // Cổ đứng lập lĩnh (y: 8..15)
      if (y >= 8 && y <= 15) {
        for (let x = 27; x <= 36; x++) {
          if (x === 27 || x === 36 || y === 8 || y === 15) r[x] = '#';
          else if (y <= 10) r[x] = 'c'; // Lót cổ trắng
          else if (x <= 31) r[x] = 'H';
          else r[x] = 'M';
        }
      }

      // Vai và thân áo (y: 16..85)
      if (y >= 16 && y <= 85) {
        // Biên độ thân và tay chẽn theo y
        let leftBound = 20;
        let rightBound = 44;

        if (y <= 18) {
          leftBound = Math.round(27 - (y - 15) * 6);
          rightBound = Math.round(36 + (y - 15) * 6);
        } else if (y <= 54) {
          // Ống tay chẽn thon
          leftBound = Math.round(8 + (y - 18) * 0.25);
          rightBound = Math.round(56 - (y - 18) * 0.25);
        } else {
          // Thân áo suông dài
          leftBound = 20;
          rightBound = 44;
        }

        for (let x = leftBound; x <= rightBound; x++) {
          // Tay áo tách khỏi thân sau y: 38
          if (y > 38 && y <= 54 && x > 17 && x < 20) continue;
          if (y > 38 && y <= 54 && x > 44 && x < 47) continue;

          // Viền 1px
          const isEdge =
            x === leftBound ||
            x === rightBound ||
            y === 85 ||
            (y === 54 && ((x >= 12 && x <= 17) || (x >= 47 && x <= 52))) ||
            (y >= 38 && y <= 54 && (x === 17 || x === 20 || x === 44 || x === 47));

          if (isEdge) {
            r[x] = '#';
          } else {
            // Nguồn sáng Top-Left: Sáng 'H', Chính 'M', Tối 'S'
            if (x < 26) {
              r[x] = 'H';
            } else if (x > 38) {
              r[x] = 'S';
            } else {
              r[x] = 'M';
            }

            // Nếp gấp vai & nách
            if ((y === 18 && x >= 14 && x <= 26) || (y === 22 && x >= 16 && x <= 24)) {
              r[x] = 'H';
            }
            if ((y === 24 && x >= 40 && x <= 50) || (y === 28 && x >= 42 && x <= 48)) {
              r[x] = 'F';
            }

            // Họa tiết gấm lặp 8x8 dithering
            if (y >= 26 && y <= 82 && x >= 22 && x <= 42) {
              if ((x % 8 === 0 && y % 8 === 0) || (x % 8 === 4 && y % 8 === 4)) {
                r[x] = 'E';
              }
            }

            // Đường cài khuy vạt phải (Vạt 5 thân)
            if (x === 38 && y >= 26 && y <= 84) {
              r[x] = 'F';
            }
          }
        }

        // Hàng 5 khuy vàng (Ngũ Thường)
        if (y === 14) r[32] = 'B';
        if (y === 18) r[35] = 'B';
        if (y === 24) r[37] = 'B';
        if (y === 33) r[38] = 'B';
        if (y === 44) r[38] = 'B';

        // Viền tay áo chẽn (cửa tay)
        if (y === 53) {
          if (r[13] !== '.') r[13] = 'c';
          if (r[14] !== '.') r[14] = 'c';
          if (r[15] !== '.') r[15] = 'c';
          if (r[49] !== '.') r[49] = 'c';
          if (r[50] !== '.') r[50] = 'c';
          if (r[51] !== '.') r[51] = 'c';
        }
      }
    } else if (id === 'ao_tac') {
      // 2. ÁO TẤC / ÁO TAY THỤNG (64x96)
      // Cổ đứng lập lĩnh (y: 8..15)
      if (y >= 8 && y <= 15) {
        for (let x = 27; x <= 36; x++) {
          if (x === 27 || x === 36 || y === 8 || y === 15) r[x] = '#';
          else if (y <= 10) r[x] = 'c';
          else if (x <= 31) r[x] = 'H';
          else r[x] = 'M';
        }
      }

      // Tay thụng rộng buông dài quá bàn tay (y: 16..86)
      if (y >= 16 && y <= 86) {
        let leftBound = 19;
        let rightBound = 45;

        if (y <= 18) {
          leftBound = Math.round(27 - (y - 15) * 7.5);
          rightBound = Math.round(36 + (y - 15) * 8);
        } else if (y <= 68) {
          // Tay thụng buông rộng rủ xuống tận y: 68
          leftBound = 4;
          rightBound = 60;
        } else {
          leftBound = 19;
          rightBound = 45;
        }

        for (let x = leftBound; x <= rightBound; x++) {
          if (y > 42 && y <= 68 && x > 18 && x < 19) continue;
          if (y > 42 && y <= 68 && x > 45 && x < 46) continue;

          const isEdge =
            x === leftBound ||
            x === rightBound ||
            y === 86 ||
            (y === 68 && ((x >= 5 && x <= 18) || (x >= 46 && x <= 59))) ||
            (y >= 42 && y <= 68 && (x === 18 || x === 19 || x === 45 || x === 46));

          if (isEdge) {
            r[x] = '#';
          } else {
            if (x < 24) r[x] = 'H';
            else if (x > 38) r[x] = 'S';
            else r[x] = 'M';

            // Nếp lộn lót lụa trắng ở cửa tay thụng
            if (y >= 65 && y <= 67 && ((x >= 6 && x <= 17) || (x >= 47 && x <= 58))) {
              r[x] = 'c';
            }

            // Nếp buông rủ uy nghi
            if (y >= 28 && y <= 64 && (x === 12 || x === 52)) {
              r[x] = x < 32 ? 'H' : 'F';
            }
          }
        }

        // Hàng khuy cài
        if (y === 14) r[32] = 'B';
        if (y === 19) r[36] = 'B';
        if (y === 26) r[39] = 'B';
        if (y === 36) r[39] = 'B';
        if (y === 48) r[39] = 'B';
      }
    } else if (id === 'ao_nhat_binh') {
      // 3. ÁO NHẬT BÌNH TRIỀU NGUYỄN (64x96)
      // Thân và tay áo đối khâm (y: 10..86)
      if (y >= 10 && y <= 86) {
        let leftBound = 19;
        let rightBound = 45;

        if (y <= 18) {
          leftBound = Math.round(25 - (y - 9) * 1.6);
          rightBound = Math.round(39 + (y - 9) * 1.6);
        } else if (y <= 62) {
          leftBound = 8;
          rightBound = 56;
        } else {
          leftBound = 19;
          rightBound = 45;
        }

        for (let x = leftBound; x <= rightBound; x++) {
          if (y > 42 && y <= 62 && x > 18 && x < 19) continue;
          if (y > 42 && y <= 62 && x > 45 && x < 46) continue;

          const isEdge =
            x === leftBound ||
            x === rightBound ||
            y === 86 ||
            (y === 62 && ((x >= 8 && x <= 18) || (x >= 46 && x <= 56))) ||
            (y >= 42 && y <= 62 && (x === 18 || x === 19 || x === 45 || x === 46));

          if (isEdge) {
            r[x] = '#';
          } else {
            if (x < 26) r[x] = 'H';
            else if (x > 38) r[x] = 'S';
            else r[x] = 'M';
          }
        }

        // CỔ CHỮ NHẬT TO BẢN (RECTANGULAR Y-COLLAR) (y: 9..68)
        if (y >= 9 && y <= 25) {
          for (let x = 26; x <= 37; x++) {
            if (x === 26 || x === 37 || y === 9) r[x] = '#';
            else if (x >= 29 && x <= 34 && y <= 16) {
              r[x] = y <= 11 ? 'c' : '.'; // Khoang cổ lót trắng
            } else {
              r[x] = (x + y) % 4 === 0 ? 'E' : 'C';
            }
          }
        }

        // Dải đối khâm buông thẳng xuống ngực & bụng
        if (y >= 26 && y <= 68) {
          for (let x = 29; x <= 34; x++) {
            if (x === 29 || x === 34) r[x] = '#';
            else if (x === 31 || x === 32) {
              r[x] = (y === 32 || y === 44 || y === 56) ? 'E' : 'C';
            } else {
              r[x] = 'C';
            }
          }
        }

        // Kim khánh ngọc bội cài ngực
        if (y >= 23 && y <= 27) {
          for (let x = 30; x <= 33; x++) r[x] = 'K';
        }

        // Dải ngũ sắc ở cổ tay (y: 48..60, 5 dải màu: Navy, Gold, White, Red, Jade)
        if (y >= 48 && y <= 60) {
          const stripeIdx = Math.floor((y - 48) / 2.5);
          const stripeChar = (stripeIdx === 0 ? '1' : stripeIdx === 1 ? '2' : stripeIdx === 2 ? '3' : stripeIdx === 3 ? '4' : '5');
          for (let x = 9; x <= 17; x++) r[x] = stripeChar;
          for (let x = 47; x <= 55; x++) r[x] = stripeChar;
        }

        // Hoa văn sóng nước thủy ba tam sơn dưới gấu áo (y: 74..85)
        if (y >= 78 && y <= 85) {
          for (let x = 20; x <= 44; x++) {
            r[x] = 'W';
          }
        }
        if (y >= 73 && y <= 77) {
          // Ba ngọn núi Tam Sơn
          for (let x = 30; x <= 33; x++) r[x] = 'T';
          for (let x = 26; x <= 28; x++) if (y >= 75) r[x] = 'T';
          for (let x = 35; x <= 37; x++) if (y >= 75) r[x] = 'T';
        }
      }
    } else if (id === 'ao_giao_linh') {
      // 4. ÁO GIAO LĨNH (64x96)
      if (y >= 10 && y <= 85) {
        let leftBound = 20;
        let rightBound = 44;

        if (y <= 18) {
          leftBound = Math.round(28 - (y - 9) * 2.2);
          rightBound = Math.round(36 + (y - 9) * 2.2);
        } else if (y <= 64) {
          leftBound = 8;
          rightBound = 56;
        } else {
          leftBound = 20;
          rightBound = 44;
        }

        for (let x = leftBound; x <= rightBound; x++) {
          if (y > 42 && y <= 64 && x > 19 && x < 20) continue;
          if (y > 42 && y <= 64 && x > 44 && x < 45) continue;

          const isEdge =
            x === leftBound ||
            x === rightBound ||
            y === 85 ||
            (y === 64 && ((x >= 9 && x <= 19) || (x >= 45 && x <= 55))) ||
            (y >= 42 && y <= 64 && (x === 19 || x === 20 || x === 44 || x === 45));

          if (isEdge) {
            r[x] = '#';
          } else {
            if (x < 27) r[x] = 'H';
            else if (x > 37) r[x] = 'S';
            else r[x] = 'M';
          }
        }

        // CỔ VẠT CHÉO GIAO LĨNH (vạt trái đè lên vạt phải)
        if (y >= 11 && y <= 28) {
          const crossX = Math.round(27 + (y - 11) * 0.65);
          if (crossX < W) r[crossX] = 'X';
          if (crossX - 1 >= 0) r[crossX - 1] = 'X';
        }

        // Đai lưng và dải lụa buộc hông (y: 42..47 và dải rủ)
        if (y >= 42 && y <= 46) {
          for (let x = 20; x <= 44; x++) r[x] = 'G';
        }
        if (y >= 46 && y <= 65) {
          r[39] = 'L';
          r[40] = 'L';
          r[41] = 'L';
        }
      }
    } else if (id === 'ao_tu_than') {
      // 5. ÁO TỨ THÂN KINH BẮC (64x96)
      // Váy sồi đen bên dưới
      if (y >= 60 && y <= 85) {
        for (let x = 22; x <= 42; x++) r[x] = 'P';
      }

      if (y >= 12 && y <= 84) {
        let leftBound = 21;
        let rightBound = 43;

        if (y <= 19) {
          leftBound = Math.round(28 - (y - 11) * 2);
          rightBound = Math.round(36 + (y - 11) * 2);
        } else if (y <= 54) {
          leftBound = 13;
          rightBound = 51;
        } else {
          leftBound = 21;
          rightBound = 43;
        }

        for (let x = leftBound; x <= rightBound; x++) {
          if (y > 42 && y <= 54 && x > 18 && x < 21) continue;
          if (y > 42 && y <= 54 && x > 43 && x < 46) continue;

          const isEdge =
            x === leftBound ||
            x === rightBound ||
            y === 84 ||
            (y === 54 && ((x >= 14 && x <= 19) || (x >= 45 && x <= 50))) ||
            (y >= 42 && y <= 54 && (x === 19 || x === 21 || x === 43 || x === 45));

          if (isEdge) {
            r[x] = '#';
          } else {
            if (x < 26) r[x] = 'H';
            else if (x > 38) r[x] = 'S';
            else r[x] = 'M';
          }
        }

        // Cổ buông mở để lộ yếm đào hồng thắm (y: 14..42)
        if (y >= 14 && y <= 42) {
          const yemW = Math.min(8, Math.round(3 + (y - 14) * 0.2));
          for (let x = 32 - yemW; x <= 32 + yemW; x++) {
            r[x] = 'Y';
          }
        }

        // Thắt lưng lụa xanh non (y: 44..48)
        if (y >= 44 && y <= 48) {
          for (let x = 22; x <= 42; x++) r[x] = 'G';
        }

        // Nút thắt 2 vạt trước buông rủ (y: 48..76)
        if (y >= 48 && y <= 76) {
          r[29] = 'H';
          r[30] = 'H';
          r[31] = '#';
          r[33] = '#';
          r[34] = 'M';
          r[35] = 'M';
        }
      }
    } else if (id === 'ao_ba_ba') {
      // 6. ÁO BÀ BA NAM BỘ (64x96)
      // Quần lụa đen buông rủ bên dưới (y: 64..88)
      if (y >= 64 && y <= 88) {
        for (let x = 22; x <= 42; x++) r[x] = 'P';
      }

      if (y >= 12 && y <= 66) {
        let leftBound = 20;
        let rightBound = 44;

        if (y <= 18) {
          leftBound = Math.round(28 - (y - 11) * 2.5);
          rightBound = Math.round(36 + (y - 11) * 2.5);
        } else if (y <= 52) {
          leftBound = 12;
          rightBound = 52;
        } else {
          leftBound = 20;
          rightBound = 44;
        }

        for (let x = leftBound; x <= rightBound; x++) {
          if (y > 40 && y <= 52 && x > 19 && x < 20) continue;
          if (y > 40 && y <= 52 && x > 44 && x < 45) continue;

          const isEdge =
            x === leftBound ||
            x === rightBound ||
            y === 66 ||
            (y === 52 && ((x >= 14 && x <= 19) || (x >= 45 && x <= 50))) ||
            (y >= 40 && y <= 52 && (x === 19 || x === 20 || x === 44 || x === 45));

          if (isEdge) {
            r[x] = '#';
          } else {
            if (x < 26) r[x] = 'H';
            else if (x > 38) r[x] = 'S';
            else r[x] = 'M';
          }
        }

        // Cổ tròn xẻ giữa
        if (y >= 12 && y <= 16) {
          for (let x = 29; x <= 35; x++) {
            if (y === 12 && (x === 29 || x === 35)) r[x] = '#';
            else if (y === 16) r[x] = '#';
            else r[x] = 'c';
          }
        }

        // Đường xẻ ngực & hàng cúc ngọc thẳng tắp
        if (y >= 17 && y <= 64) {
          r[32] = (y === 20 || y === 28 || y === 36 || y === 45 || y === 54) ? 'B' : '#';
        }

        // Hai túi vuông phía trước vạt dưới (y: 50..57)
        if (y >= 50 && y <= 57) {
          for (let x = 23; x <= 28; x++) r[x] = (x === 23 || x === 28 || y === 50 || y === 57) ? '#' : 'Q';
          for (let x = 36; x <= 41; x++) r[x] = (x === 36 || x === 41 || y === 50 || y === 57) ? '#' : 'Q';
        }

        // Khăn rằn Nam Bộ vắt vai (y: 16..44)
        if (y >= 16 && y <= 44) {
          for (let x = 16; x <= 21; x++) {
            r[x] = (y % 3 === 0 || x === 16 || x === 21) ? 'R' : 'c';
          }
        }
      }
    }

    rows.push(r.join(''));
  }

  return rows;
}

/**
 * Kho ma trận chuỗi ký tự 64x96 cho từng cổ phục
 */
export const CODEX_CHAR_MATRICES: Record<string, string[]> = {
  ao_ngu_than: generateCodexCharMatrix('ao_ngu_than'),
  ao_tac: generateCodexCharMatrix('ao_tac'),
  ao_nhat_binh: generateCodexCharMatrix('ao_nhat_binh'),
  ao_giao_linh: generateCodexCharMatrix('ao_giao_linh'),
  ao_tu_than: generateCodexCharMatrix('ao_tu_than'),
  ao_ba_ba: generateCodexCharMatrix('ao_ba_ba'),
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
