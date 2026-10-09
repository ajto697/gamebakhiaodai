/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG SPRITE 64x96 BÁCH KHOA CỔ PHỤC (CODEX 64x96 SPRITE ENGINE)
 * - Sprite kích thước chuẩn 64x96 pixel.
 * - Đổ bóng 3 tông (Sáng, Chính, Tối) với nguồn sáng Trên - Trái (Top-Left).
 * - Viền nâu/tím đậm 1px (#161426 hoặc #331612, không dùng #000000 thuần).
 * - Chi tiết có chủ đích: nếp gấp vai/thân, đường nối, viền tay áo, hàng khuy,
 *   họa tiết thêu lặp 8x8 với dithering nhẹ, cổ áo chuẩn xác theo knowledge.json.
 * - Đặt trên giá treo gỗ có bóng dưới chân, nền hào quang nhấp nháy nhẹ (tắt khi bật Giảm hiệu ứng).
 * - Hỗ trợ nạp PNG từ manifest.json (codex_<id>), tự động chuyển sang sprite code nếu thiếu file.
 */

import { AssetManager } from '../assets/loader.ts';
import { AccessibilityManager } from '../engine/accessibility.ts';
import {
  CODEX_GARMENT_PALETTES,
  CODEX_CHAR_MATRICES,
  Garment3TonePalette,
} from './palette.ts';

// Cache canvas đã vẽ 64x96 để tái sử dụng tốc độ 60fps
const CODEX_CANVAS_CACHE = new Map<string, HTMLCanvasElement>();

/**
 * Vẽ sprite 64x96 từ ma trận ký tự và bảng màu 3 tông trong palette.ts
 */
export function renderSpriteFromMatrixAndPalette(
  ctx: CanvasRenderingContext2D,
  id: string,
  palette: Garment3TonePalette
): void {
  const matrix = CODEX_CHAR_MATRICES[id];
  if (!matrix) return;

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 96; y++) {
    const row = matrix[y] || '';
    for (let x = 0; x < 64; x++) {
      const ch = row[x] || '.';
      if (ch === '.') continue;

      let color = '';
      switch (ch) {
        case '#':
          color = palette.outline;
          break;
        case 'H':
          color = palette.highlight;
          break;
        case 'M':
          color = palette.midtone;
          break;
        case 'S':
          color = palette.shadow;
          break;
        case 'F':
          color = palette.shadow;
          break;
        case 'C':
          color = palette.accents.goldCollar || palette.midtone;
          break;
        case 'c':
          color = palette.accents.innerCollar || palette.accents.cuffLining || '#f7edd7';
          break;
        case 'B':
          color = palette.accents.goldButtons || palette.accents.buttons || '#fedb5b';
          break;
        case 'E':
          color = palette.accents.ditherBrocade || palette.accents.tealEmbroidery || 'rgba(254, 219, 91, 0.2)';
          break;
        case '1':
          color = palette.accents.cuffNavy || '#1e3863';
          break;
        case '2':
          color = palette.accents.cuffGold || '#fedb5b';
          break;
        case '3':
          color = palette.accents.cuffWhite || '#fcf6ec';
          break;
        case '4':
          color = palette.accents.cuffRed || '#ba252b';
          break;
        case '5':
          color = palette.accents.cuffJade || '#40bfa3';
          break;
        case 'W':
          color = palette.accents.navyWave || '#1e3863';
          break;
        case 'T':
          color = palette.accents.tealEmbroidery || '#40bfa3';
          break;
        case 'K':
          color = palette.accents.goldCollar || '#fedb5b';
          break;
        case 'Y':
          color = palette.accents.yemPink || '#d96499';
          break;
        case 'G':
          color = palette.accents.beltGreen || palette.accents.sashGold || '#40bfa3';
          break;
        case 'P':
          color = palette.accents.skirtDark || palette.accents.pantsBlack || '#161426';
          break;
        case 'R':
          color = palette.accents.scarfBlack || '#161426';
          break;
        case 'Q':
          color = palette.midtone;
          break;
        case 'X':
          color = palette.outline;
          break;
        case 'L':
          color = palette.accents.sashGold || '#fedb5b';
          break;
        default:
          color = palette.midtone;
          break;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Tạo canvas 64x96 cho từng trang phục cổ truyền kết hợp ma trận ký tự và chi tiết sắc sảo
 */
export function getOrCreateCodexSprite(id: string): HTMLCanvasElement {
  if (CODEX_CANVAS_CACHE.has(id)) {
    return CODEX_CANVAS_CACHE.get(id)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  const palette = CODEX_GARMENT_PALETTES[id] || CODEX_GARMENT_PALETTES.ao_ngu_than;

  // 1. Vẽ lớp nền chuẩn từ Ma trận chuỗi ký tự 64x96 trong palette.ts
  renderSpriteFromMatrixAndPalette(ctx, id, palette);

  // 2. Thêm các chi tiết có chủ đích: nếp gấp, đường nối, viền tay, hàng khuy, cổ chuẩn
  switch (id) {
    case 'ao_ngu_than':
      renderAoNguThan64x96(ctx);
      break;
    case 'ao_tac':
      renderAoTac64x96(ctx);
      break;
    case 'ao_nhat_binh':
      renderAoNhatBinh64x96(ctx);
      break;
    case 'ao_giao_linh':
      renderAoGiaoLinh64x96(ctx);
      break;
    case 'ao_tu_than':
      renderAoTuThan64x96(ctx);
      break;
    case 'ao_ba_ba':
      renderAoBaBa64x96(ctx);
      break;
    default:
      renderAoNguThan64x96(ctx);
      break;
  }

  CODEX_CANVAS_CACHE.set(id, canvas);
  return canvas;
}

/**
 * 1. ÁO NGŨ THÂN TAY CHẼN (64x96)
 * Đặc trưng: 5 thân vải, cổ đứng lập lĩnh kín đáo ôm khít, hàng 5 khuy cài vạt phải, tay chẽn ôm thon
 */
function renderAoNguThan64x96(ctx: CanvasRenderingContext2D): void {
  const outline = '#161426';
  const hi = '#7a586e';    // Sáng (Highlight)
  const mid = '#4f3547';   // Chính (Midtone)
  const dark = '#2d1f2b';  // Tối (Shadow)
  const gold = '#fedb5b';  // Khuy ngọc vàng kim
  const white = '#f7edd7'; // Lót cổ trắng

  // --- VIỀN NGOÀI 1PX (OUTLINE) ---
  ctx.fillStyle = outline;
  // Cổ đứng
  ctx.fillRect(27, 8, 10, 8);
  // Vai & thân
  ctx.beginPath();
  ctx.moveTo(27, 10);
  ctx.lineTo(8, 18);
  ctx.lineTo(12, 54);
  ctx.lineTo(17, 54);
  ctx.lineTo(18, 38);
  ctx.lineTo(20, 85);
  ctx.lineTo(44, 85);
  ctx.lineTo(46, 38);
  ctx.lineTo(47, 54);
  ctx.lineTo(52, 54);
  ctx.lineTo(56, 18);
  ctx.lineTo(37, 10);
  ctx.closePath();
  ctx.fill();

  // --- THÂN ÁO 3 TÔNG (3-TONE SHADING) ---
  // Lớp chính (Midtone)
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(28, 11);
  ctx.lineTo(9, 19);
  ctx.lineTo(13, 53);
  ctx.lineTo(16, 53);
  ctx.lineTo(19, 38);
  ctx.lineTo(21, 84);
  ctx.lineTo(43, 84);
  ctx.lineTo(45, 38);
  ctx.lineTo(48, 53);
  ctx.lineTo(51, 53);
  ctx.lineTo(55, 19);
  ctx.lineTo(36, 11);
  ctx.closePath();
  ctx.fill();

  // Mảng sáng Trên - Trái (Highlight: Vai trái, ngực trái, vạt trái)
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(28, 11);
  ctx.lineTo(9, 19);
  ctx.lineTo(12, 38);
  ctx.lineTo(23, 26);
  ctx.lineTo(25, 84);
  ctx.lineTo(21, 84);
  ctx.lineTo(19, 38);
  ctx.closePath();
  ctx.fill();
  // Vệt sáng trên vai trái
  ctx.fillRect(16, 17, 12, 4);

  // Mảng tối Dưới - Phải (Shadow: Nách phải, sườn phải, tà phải)
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(33, 11);
  ctx.lineTo(36, 11);
  ctx.lineTo(55, 19);
  ctx.lineTo(51, 53);
  ctx.lineTo(48, 53);
  ctx.lineTo(45, 38);
  ctx.lineTo(43, 84);
  ctx.lineTo(33, 84);
  ctx.closePath();
  ctx.fill();

  // --- CỔ ĐỨNG LẬP LĨNH KÍN ĐÁO ---
  // Lót cổ lụa trắng
  ctx.fillStyle = white;
  ctx.fillRect(28, 9, 8, 3);
  // Cổ áo chính
  ctx.fillStyle = mid;
  ctx.fillRect(28, 11, 8, 4);
  ctx.fillStyle = hi;
  ctx.fillRect(28, 11, 4, 4);

  // --- ĐƯỜNG CÀI KHUY VẠT PHẢI & THÂN CON (5 THÂN VẢI) ---
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 14);
  ctx.quadraticCurveTo(36, 20, 38, 28);
  ctx.lineTo(38, 84);
  ctx.stroke();

  // Đường ráp sống áo (thân sau & thân con bên trong)
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.moveTo(30, 24);
  ctx.lineTo(30, 84);
  ctx.stroke();

  // 5 HẠT KHUY NGỌC VÀNG KIM (NGŨ THƯỜNG: NHÂN - NGHĨA - LỄ - TRÍ - TÍN)
  const buttonCoords = [
    [32, 14], // Khuy cổ
    [35, 18], // Khuy xương quai xanh
    [37, 24], // Khuy dưới nách
    [38, 33], // Khuy ngực sườn
    [38, 44], // Khuy bụng
  ];
  buttonCoords.forEach(([bx, by]) => {
    ctx.fillStyle = outline;
    ctx.fillRect(bx - 1, by - 1, 3, 3);
    ctx.fillStyle = gold;
    ctx.fillRect(bx, by, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, 1, 1);
  });

  // HỌA TIẾT GẤM HOA VĂN LẶP 8x8 (DITHERING NHẸ)
  ctx.fillStyle = 'rgba(254, 219, 91, 0.18)';
  for (let y = 30; y < 80; y += 8) {
    for (let x = 23; x < 42; x += 8) {
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 2, y + 2, 1, 1);
    }
  }

  // Viền tay áo chẽn
  ctx.fillStyle = outline;
  ctx.fillRect(10, 52, 6, 2);
  ctx.fillRect(48, 52, 6, 2);
  ctx.fillStyle = white;
  ctx.fillRect(11, 52, 4, 1);
  ctx.fillRect(49, 52, 4, 1);
}

/**
 * 2. ÁO TẤC / ÁO TAY THỤNG (64x96)
 * Đặc trưng: Cổ đứng lập lĩnh, tay thụng rộng dài buông quá bàn tay một tấc, lễ phục trang nghiêm
 */
function renderAoTac64x96(ctx: CanvasRenderingContext2D): void {
  const outline = '#161426';
  const hi = '#3b6b99';    // Sáng
  const mid = '#1f3354';   // Chính
  const dark = '#121e33';  // Tối
  const gold = '#fedb5b';
  const white = '#f7edd7';

  ctx.fillStyle = outline;
  // Cổ đứng
  ctx.fillRect(27, 8, 10, 8);
  // Tay thụng rộng buông dài
  ctx.beginPath();
  ctx.moveTo(27, 10);
  ctx.lineTo(4, 18);
  ctx.lineTo(6, 68);
  ctx.lineTo(19, 68);
  ctx.lineTo(18, 42);
  ctx.lineTo(19, 86);
  ctx.lineTo(45, 86);
  ctx.lineTo(46, 42);
  ctx.lineTo(45, 68);
  ctx.lineTo(58, 68);
  ctx.lineTo(60, 18);
  ctx.lineTo(37, 10);
  ctx.closePath();
  ctx.fill();

  // Thân và tay thụng chính (Midtone)
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(28, 11);
  ctx.lineTo(5, 19);
  ctx.lineTo(7, 67);
  ctx.lineTo(18, 67);
  ctx.lineTo(19, 42);
  ctx.lineTo(20, 85);
  ctx.lineTo(44, 85);
  ctx.lineTo(45, 42);
  ctx.lineTo(46, 67);
  ctx.lineTo(57, 67);
  ctx.lineTo(59, 19);
  ctx.lineTo(36, 11);
  ctx.closePath();
  ctx.fill();

  // Mảng sáng Trên - Trái (Tay thụng trái đón sáng)
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(28, 11);
  ctx.lineTo(5, 19);
  ctx.lineTo(12, 67);
  ctx.lineTo(18, 67);
  ctx.lineTo(19, 36);
  ctx.lineTo(28, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(20, 16, 12, 4);

  // Mảng tối Dưới - Phải (Tay thụng phải khuất sáng)
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(34, 11);
  ctx.lineTo(59, 19);
  ctx.lineTo(57, 67);
  ctx.lineTo(46, 67);
  ctx.lineTo(44, 85);
  ctx.lineTo(34, 85);
  ctx.closePath();
  ctx.fill();

  // Nếp lộn lót lụa trắng ở cửa tay thụng
  ctx.fillStyle = white;
  ctx.fillRect(7, 65, 11, 2);
  ctx.fillRect(46, 65, 11, 2);

  // Cổ lập lĩnh
  ctx.fillStyle = white;
  ctx.fillRect(28, 9, 8, 3);
  ctx.fillStyle = mid;
  ctx.fillRect(28, 11, 8, 4);
  ctx.fillStyle = hi;
  ctx.fillRect(28, 11, 4, 4);

  // Đường vạt phải cài khuy
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 14);
  ctx.quadraticCurveTo(36, 20, 39, 28);
  ctx.lineTo(39, 85);
  ctx.stroke();

  // Hàng khuy vàng
  [14, 19, 26, 36, 48].forEach((by) => {
    const bx = by === 14 ? 32 : (by === 19 ? 36 : 39);
    ctx.fillStyle = gold;
    ctx.fillRect(bx, by, 2, 2);
  });
}

/**
 * 3. ÁO NHẬT BÌNH TRIỀU NGUYỄN (64x96)
 * Đặc trưng: Cổ chữ nhật to bản ghép thêu trước ngực, kim khánh ngọc bội, tay áo dải ngũ sắc, sóng thủy ba tam sơn
 */
function renderAoNhatBinh64x96(ctx: CanvasRenderingContext2D): void {
  const outline = '#331612';
  const hi = '#e6434a';    // Đỏ son sáng
  const mid = '#ba252b';   // Đỏ son chính
  const dark = '#7a181c';  // Đỏ tối
  const gold = '#fedb5b';
  const goldDark = '#e09922';
  const teal = '#40bfa3';
  const white = '#fcf6ec';
  const navy = '#1e3863';

  ctx.fillStyle = outline;
  // Khung thân & tay áo xòe nhẹ
  ctx.beginPath();
  ctx.moveTo(25, 10);
  ctx.lineTo(10, 18);
  ctx.lineTo(8, 62);
  ctx.lineTo(18, 62);
  ctx.lineTo(18, 42);
  ctx.lineTo(19, 86);
  ctx.lineTo(45, 86);
  ctx.lineTo(46, 42);
  ctx.lineTo(46, 62);
  ctx.lineTo(56, 62);
  ctx.lineTo(54, 18);
  ctx.lineTo(39, 10);
  ctx.closePath();
  ctx.fill();

  // Thân áo đỏ son chính
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(26, 11);
  ctx.lineTo(11, 19);
  ctx.lineTo(9, 61);
  ctx.lineTo(17, 61);
  ctx.lineTo(19, 42);
  ctx.lineTo(20, 85);
  ctx.lineTo(44, 85);
  ctx.lineTo(45, 42);
  ctx.lineTo(47, 61);
  ctx.lineTo(55, 61);
  ctx.lineTo(53, 19);
  ctx.lineTo(38, 11);
  ctx.closePath();
  ctx.fill();

  // Highlight sáng bên trái
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(26, 11);
  ctx.lineTo(11, 19);
  ctx.lineTo(13, 61);
  ctx.lineTo(17, 61);
  ctx.lineTo(28, 40);
  ctx.lineTo(28, 85);
  ctx.lineTo(20, 85);
  ctx.closePath();
  ctx.fill();

  // Shadow tối bên phải
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(34, 11);
  ctx.lineTo(53, 19);
  ctx.lineTo(55, 61);
  ctx.lineTo(47, 61);
  ctx.lineTo(44, 85);
  ctx.lineTo(34, 85);
  ctx.closePath();
  ctx.fill();

  // DẢI NGŨ SẮC CỔ TAY ÁO (Navy, Gold, White, Red, Jade)
  const rainbow = [navy, gold, white, mid, teal];
  for (let i = 0; i < 5; i++) {
    const cy = 48 + i * 2.5;
    ctx.fillStyle = rainbow[i];
    ctx.fillRect(9, cy, 8, 2);
    ctx.fillRect(47, cy, 8, 2);
  }

  // CỔ ÁO NHẬT BÌNH CHỮ NHẬT TO BẢN (RECTANGULAR Y-COLLAR)
  ctx.fillStyle = outline;
  ctx.fillRect(26, 9, 12, 18);
  ctx.fillRect(29, 26, 6, 42);

  ctx.fillStyle = goldDark;
  ctx.fillRect(27, 10, 10, 16);
  ctx.fillRect(30, 26, 4, 40);

  ctx.fillStyle = gold;
  ctx.fillRect(27, 10, 5, 16);
  ctx.fillRect(30, 26, 2, 40);

  // Khoang cổ trong & lót trắng
  ctx.fillStyle = outline;
  ctx.fillRect(29, 10, 6, 8);
  ctx.fillStyle = white;
  ctx.fillRect(30, 10, 4, 3);

  // Hoa văn thêu cổ
  ctx.fillStyle = teal;
  ctx.fillRect(28, 14, 2, 4);
  ctx.fillRect(34, 14, 2, 4);
  ctx.fillRect(31, 32, 2, 3);
  ctx.fillRect(31, 44, 2, 3);
  ctx.fillRect(31, 56, 2, 3);

  // KIM KHÁNH / NGỌC BỘI CÀI NGỰC
  ctx.fillStyle = gold;
  ctx.fillRect(30, 24, 4, 4);
  ctx.fillStyle = white;
  ctx.fillRect(31, 25, 2, 2);
  ctx.fillStyle = teal;
  ctx.fillRect(31, 28, 2, 3);

  // ĐOÀN PHƯỢNG HOÀNG THÊU VAI
  ctx.fillStyle = gold;
  ctx.fillRect(18, 22, 5, 5);
  ctx.fillRect(41, 22, 5, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(19, 23, 2, 2);
  ctx.fillRect(42, 23, 2, 2);

  // HOA VĂN THỦY BA TAM SƠN GẤU ÁO
  ctx.fillStyle = navy;
  ctx.fillRect(20, 78, 24, 7);
  // Sóng nước
  ctx.fillStyle = '#335c9e';
  ctx.fillRect(21, 80, 22, 2);
  ctx.fillRect(22, 83, 20, 2);
  // Ba ngọn núi Tam Sơn
  ctx.fillStyle = teal;
  ctx.fillRect(31, 74, 3, 6);
  ctx.fillRect(27, 76, 3, 4);
  ctx.fillRect(35, 76, 3, 4);
  ctx.fillStyle = gold;
  ctx.fillRect(32, 73, 1, 2);
}

/**
 * 4. ÁO GIAO LĨNH (64x96)
 * Đặc trưng: Cổ vạt chéo (vạt trái đè lên vạt phải), buộc dây lụa bên hông, tay thụng
 */
function renderAoGiaoLinh64x96(ctx: CanvasRenderingContext2D): void {
  const outline = '#161426';
  const hi = '#40bfa3';
  const mid = '#1c5e59';
  const dark = '#103633';
  const sash = '#fedb5b';
  const white = '#f7edd7';

  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.moveTo(28, 10);
  ctx.lineTo(8, 18);
  ctx.lineTo(9, 64);
  ctx.lineTo(19, 64);
  ctx.lineTo(19, 42);
  ctx.lineTo(20, 85);
  ctx.lineTo(44, 85);
  ctx.lineTo(45, 42);
  ctx.lineTo(45, 64);
  ctx.lineTo(55, 64);
  ctx.lineTo(56, 18);
  ctx.lineTo(36, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(29, 11);
  ctx.lineTo(9, 19);
  ctx.lineTo(10, 63);
  ctx.lineTo(18, 63);
  ctx.lineTo(20, 42);
  ctx.lineTo(21, 84);
  ctx.lineTo(43, 84);
  ctx.lineTo(44, 42);
  ctx.lineTo(46, 63);
  ctx.lineTo(54, 63);
  ctx.lineTo(55, 19);
  ctx.lineTo(35, 11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(29, 11);
  ctx.lineTo(9, 19);
  ctx.lineTo(14, 63);
  ctx.lineTo(18, 63);
  ctx.lineTo(28, 38);
  ctx.lineTo(28, 84);
  ctx.lineTo(21, 84);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(33, 11);
  ctx.lineTo(55, 19);
  ctx.lineTo(54, 63);
  ctx.lineTo(46, 63);
  ctx.lineTo(43, 84);
  ctx.lineTo(33, 84);
  ctx.closePath();
  ctx.fill();

  // CỔ VẠT CHÉO GIAO LĨNH (VẠT TRÁI ĐÈ VẠT PHẢI)
  // Lót trong trắng
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.moveTo(30, 11);
  ctx.lineTo(32, 18);
  ctx.lineTo(34, 11);
  ctx.closePath();
  ctx.fill();

  // Đường viền nẹp cổ vạt chéo
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(27, 11);
  ctx.lineTo(38, 28);
  ctx.moveTo(37, 11);
  ctx.lineTo(29, 22);
  ctx.stroke();

  // ĐAI LƯNG VÀ DẢI LỤA BUỘC HÔNG
  ctx.fillStyle = outline;
  ctx.fillRect(20, 42, 24, 5);
  ctx.fillStyle = sash;
  ctx.fillRect(21, 43, 22, 3);
  // Nút thắt và dải rủ bên sườn
  ctx.fillRect(38, 42, 4, 4);
  ctx.fillRect(39, 46, 3, 18);
}

/**
 * 5. ÁO TỨ THÂN KINH BẮC (64x96)
 * Đặc trưng: Cổ mở để lộ yếm đào thắm, 4 vạt áo (2 vạt sau may liền sống, 2 vạt trước buộc mối), thắt lưng xanh
 */
function renderAoTuThan64x96(ctx: CanvasRenderingContext2D): void {
  const outline = '#261b2d';
  const hi = '#ba5e1b';
  const mid = '#7a3d13';
  const dark = '#45220a';
  const yem = '#d96499';   // Yếm đào hồng thắm
  const belt = '#40bfa3';  // Thắt lưng lụa xanh non
  const skirt = '#161426'; // Váy sồi đen

  // Váy sồi đen bên dưới
  ctx.fillStyle = skirt;
  ctx.fillRect(22, 60, 20, 26);

  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.moveTo(28, 12);
  ctx.lineTo(12, 19);
  ctx.lineTo(14, 54);
  ctx.lineTo(19, 54);
  ctx.lineTo(20, 42);
  ctx.lineTo(21, 84);
  ctx.lineTo(43, 84);
  ctx.lineTo(44, 42);
  ctx.lineTo(45, 54);
  ctx.lineTo(50, 54);
  ctx.lineTo(52, 19);
  ctx.lineTo(36, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(29, 13);
  ctx.lineTo(13, 20);
  ctx.lineTo(15, 53);
  ctx.lineTo(18, 53);
  ctx.lineTo(21, 42);
  ctx.lineTo(22, 83);
  ctx.lineTo(42, 83);
  ctx.lineTo(43, 42);
  ctx.lineTo(46, 53);
  ctx.lineTo(49, 53);
  ctx.lineTo(51, 20);
  ctx.lineTo(35, 13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(29, 13);
  ctx.lineTo(13, 20);
  ctx.lineTo(17, 53);
  ctx.lineTo(26, 42);
  ctx.lineTo(25, 83);
  ctx.lineTo(22, 83);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(33, 13);
  ctx.lineTo(51, 20);
  ctx.lineTo(46, 53);
  ctx.lineTo(42, 83);
  ctx.lineTo(33, 83);
  ctx.closePath();
  ctx.fill();

  // YẾM ĐÀO HỒNG THẮM BÊN TRONG CỔ ÁO BUÔNG MỞ
  ctx.fillStyle = yem;
  ctx.beginPath();
  ctx.moveTo(28, 14);
  ctx.lineTo(32, 22);
  ctx.lineTo(36, 14);
  ctx.lineTo(34, 42);
  ctx.lineTo(30, 42);
  ctx.closePath();
  ctx.fill();

  // THẮT LƯNG LỤA XANH NON VÀ NÚT THẮT 2 VẠT TRƯỚC
  ctx.fillStyle = outline;
  ctx.fillRect(22, 44, 20, 5);
  ctx.fillStyle = belt;
  ctx.fillRect(23, 45, 18, 3);

  // Nút buộc vạt áo tứ thân trước bụng
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(32, 49, 4, 0, Math.PI * 2);
  ctx.fill();
  // Hai dải vạt áo buông rủ
  ctx.fillRect(29, 52, 3, 24);
  ctx.fillRect(33, 52, 3, 24);
  ctx.fillStyle = hi;
  ctx.fillRect(29, 52, 1, 24);
}

/**
 * 6. ÁO BÀ BA NAM BỘ (64x96)
 * Đặc trưng: Cổ tròn xẻ giữa, hàng cúc buông thẳng, vạt ngắn ngang hông xẻ tà hai bên, 2 túi vuông phía trước
 */
function renderAoBaBa64x96(ctx: CanvasRenderingContext2D): void {
  const outline = '#161426';
  const hi = '#77e0b5';
  const mid = '#268c7e';
  const dark = '#144a42';
  const button = '#fedb5b';
  const pants = '#161426'; // Quần lụa đen

  // Quần lụa đen Nam Bộ buông rủ bên dưới
  ctx.fillStyle = pants;
  ctx.fillRect(22, 64, 20, 24);
  ctx.fillStyle = '#261b2d';
  ctx.fillRect(23, 64, 9, 24);

  // Khung viền áo bà ba vạt ngắn
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.moveTo(28, 12);
  ctx.lineTo(12, 18);
  ctx.lineTo(14, 52);
  ctx.lineTo(19, 52);
  ctx.lineTo(20, 40);
  ctx.lineTo(21, 66);
  ctx.lineTo(43, 66);
  ctx.lineTo(44, 40);
  ctx.lineTo(45, 52);
  ctx.lineTo(50, 52);
  ctx.lineTo(52, 18);
  ctx.lineTo(36, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(29, 13);
  ctx.lineTo(13, 19);
  ctx.lineTo(15, 51);
  ctx.lineTo(18, 51);
  ctx.lineTo(21, 40);
  ctx.lineTo(22, 65);
  ctx.lineTo(42, 65);
  ctx.lineTo(43, 40);
  ctx.lineTo(46, 51);
  ctx.lineTo(49, 51);
  ctx.lineTo(51, 19);
  ctx.lineTo(35, 13);
  ctx.closePath();
  ctx.fill();

  // Highlight bên trái
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(29, 13);
  ctx.lineTo(13, 19);
  ctx.lineTo(17, 51);
  ctx.lineTo(26, 40);
  ctx.lineTo(25, 65);
  ctx.lineTo(22, 65);
  ctx.closePath();
  ctx.fill();

  // Shadow bên phải
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(33, 13);
  ctx.lineTo(51, 19);
  ctx.lineTo(46, 51);
  ctx.lineTo(42, 65);
  ctx.lineTo(33, 65);
  ctx.closePath();
  ctx.fill();

  // CỔ TRÒN XẺ GIỮA
  ctx.fillStyle = '#f7edd7';
  ctx.beginPath();
  ctx.arc(32, 13, 4, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(32, 13, 4, 0, Math.PI);
  ctx.stroke();

  // ĐƯỜNG XẺ NGỰC VÀ HÀNG CÚC NGỌC THẲNG TẮP
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.moveTo(32, 17);
  ctx.lineTo(32, 65);
  ctx.stroke();

  [20, 28, 36, 45, 54].forEach((by) => {
    ctx.fillStyle = button;
    ctx.fillRect(31, by, 2, 2);
  });

  // HAI TÚI VUÔNG PHÍA TRƯỚC VẠT DƯỚI
  // Túi trái
  ctx.fillStyle = outline;
  ctx.fillRect(23, 50, 7, 7);
  ctx.fillStyle = hi;
  ctx.fillRect(24, 51, 5, 5);
  // Túi phải
  ctx.fillStyle = outline;
  ctx.fillRect(34, 50, 7, 7);
  ctx.fillStyle = dark;
  ctx.fillRect(35, 51, 5, 5);

  // KHĂN RẰN NAM BỘ VẮT VAI
  ctx.fillStyle = '#f7edd7';
  ctx.fillRect(16, 17, 6, 26);
  ctx.fillStyle = '#161426';
  // Họa tiết sọc caro khăn rằn
  for (let ky = 18; ky < 42; ky += 3) {
    ctx.fillRect(16, ky, 6, 1);
  }
}

/**
 * Vẽ bệ đỡ / giá treo gỗ mỹ nghệ có bóng đổ và hào quang
 */
export function drawWoodenDisplayStand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  isUnlocked: boolean,
  tick = 0,
  reduceMotion = false
): void {
  // 1. Bóng đổ dưới chân giá đỡ
  ctx.fillStyle = 'rgba(15, 13, 27, 0.45)';
  ctx.beginPath();
  ctx.ellipse(Math.floor(cx), Math.floor(cy + 46), 26, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Hào quang nhấp nháy nhẹ nếu đã mở khóa (tắt khi bật Giảm hiệu ứng)
  if (isUnlocked) {
    ctx.save();
    const pulse = reduceMotion ? 0 : Math.sin(tick / 16) * 3;
    ctx.fillStyle = 'rgba(254, 219, 91, 0.1)';
    ctx.beginPath();
    ctx.arc(Math.floor(cx), Math.floor(cy - 4), 38 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Giá treo gỗ cổ truyền (Wooden Stand)
  const woodDark = '#331612';
  const woodMid = '#754826';
  const woodHi = '#a86c3b';

  // Đỉnh chốt gỗ
  ctx.fillStyle = woodDark;
  ctx.fillRect(cx - 3, cy - 50, 6, 8);
  ctx.fillStyle = woodHi;
  ctx.fillRect(cx - 2, cy - 49, 2, 6);

  // Xà ngang
  ctx.fillStyle = woodDark;
  ctx.fillRect(cx - 32, cy - 44, 64, 5);
  ctx.fillStyle = woodHi;
  ctx.fillRect(cx - 31, cy - 43, 62, 2);

  // Đầu chạm mây hai bên xà
  ctx.fillStyle = woodDark;
  ctx.fillRect(cx - 35, cy - 45, 4, 7);
  ctx.fillRect(cx + 31, cy - 45, 4, 7);

  // Cột trụ đứng
  ctx.fillStyle = woodDark;
  ctx.fillRect(cx - 3, cy + 30, 6, 16);
  ctx.fillStyle = woodHi;
  ctx.fillRect(cx - 2, cy + 30, 2, 16);

  // Chân đế bán nguyệt
  ctx.fillStyle = woodDark;
  ctx.fillRect(cx - 20, cy + 42, 40, 5);
  ctx.fillStyle = woodMid;
  ctx.fillRect(cx - 18, cy + 43, 36, 2);
}

/**
 * Hàm vẽ hoàn chỉnh Sprite trang phục trong Codex:
 * - Kiểm tra ảnh PNG pixel art từ manifest (codex_<id>.png).
 * - Nếu không có, vẽ sprite dự phòng 64x96 bằng code.
 */
export function drawCodexGarmentSprite(
  ctx: CanvasRenderingContext2D,
  id: string,
  centerX: number,
  centerY: number,
  isUnlocked: boolean,
  tick = 0,
  reduceMotion = false
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const ix = Math.floor(centerX);
  const iy = Math.floor(centerY);

  // Vẽ giá gỗ & hào quang
  drawWoodenDisplayStand(ctx, ix, iy, isUnlocked, tick, reduceMotion);

  if (!isUnlocked) {
    // Khi chưa mở khóa: bóng đen bí ẩn (Silhouette 1 màu tối)
    const spriteCanvas = getOrCreateCodexSprite(id);
    ctx.save();
    ctx.filter = 'brightness(0) opacity(0.35)';
    ctx.drawImage(spriteCanvas, ix - 32, iy - 48);
    ctx.restore();

    // Biểu tượng khóa ở giữa ngực áo
    ctx.fillStyle = '#161426';
    ctx.fillRect(ix - 7, iy - 7, 14, 14);
    ctx.fillStyle = '#ba5e1b';
    ctx.fillRect(ix - 5, iy - 5, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix - 2, iy - 3, 4, 4);
    ctx.restore();
    return;
  }

  // 1. Kiểm tra ảnh PNG từ manifest.json
  const assetMgr = AssetManager.getInstance();
  const manifestKey = 'codex_' + id;
  const pngSprite = assetMgr.sprites.get(manifestKey);

  if (pngSprite && !pngSprite.isFallback && pngSprite.frames.length > 0) {
    // Dùng ảnh PNG pixel art tải từ manifest
    ctx.drawImage(pngSprite.frames[0], ix - 32, iy - 48);
  } else {
    // Dùng sprite 64x96 vẽ bằng code
    const spriteCanvas = getOrCreateCodexSprite(id);
    ctx.drawImage(spriteCanvas, ix - 32, iy - 48);
  }

  ctx.restore();
}
