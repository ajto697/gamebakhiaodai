/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ TẠO SPRITE DỰ PHÒNG BẰNG CODE (FALLBACK SPRITES ENGINE)
 * Sử dụng ma trận ký tự (char matrix) + Bảng màu 32 màu + Hàm blit để render trực tiếp lên Canvas.
 * Đảm bảo 100% tài sản luôn hiển thị sắc nét dù chưa nạp file PNG ngoài.
 */

import { CHAR_PALETTE_MAP } from './palette.ts';

export interface BlitSpriteFrame {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

export interface BlitSpriteSheet {
  id: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  frames: HTMLCanvasElement[];
  isFallback: boolean;
}

/**
 * Hàm vẽ ma trận ký tự lên một canvas theo bảng mã màu
 */
export function blitCharMatrix(
  rows: string[],
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    const row = rows[y] || '';
    for (let x = 0; x < width; x++) {
      const char = row[x] || '.';
      const color = CHAR_PALETTE_MAP[char];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas;
}

/**
 * Tạo sprite 9-slice panel 24x24 px (khung nhung gấm hoàng gia viền vàng kim góc chạm sen)
 */
export function createFallback9Slice(): HTMLCanvasElement {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Nền nhung gấm tím hoàng gia thẫm (#1a1226)
  ctx.fillStyle = '#1a1226';
  ctx.fillRect(1, 1, size - 2, size - 2);

  // Lớp gấm lót tâm mượt
  ctx.fillStyle = '#231834';
  ctx.fillRect(3, 3, size - 6, size - 6);

  // Viền ngoài tím than sẫm 1px (#0f0d1b)
  ctx.strokeStyle = '#0f0d1b';
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

  // Viền trong vàng kim lưu ly đôi (#f7af34)
  ctx.strokeStyle = '#f7af34';
  ctx.strokeRect(2.5, 2.5, size - 5, size - 5);
  ctx.strokeStyle = '#fedb5b';
  ctx.strokeRect(3.5, 3.5, size - 7, size - 7);

  // Hoa văn góc 4 góc chạm hình cánh sen và ngọc bích
  const corners = [
    [1, 1], [size - 4, 1],
    [1, size - 4], [size - 4, size - 4],
  ];
  corners.forEach(([cx, cy]) => {
    // Đế vàng
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(cx, cy, 3, 3);
    // Điểm ngọc bích tâm hoa sen
    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(cx + 1, cy + 1, 1, 1);
  });

  return canvas;
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Idle (48x48, 2 khung)
 * Nhân vật Tầm Phục Sĩ khoác Áo Ngũ Thân Lập Lĩnh, khăn đóng chữ Nhất, ngọc bội
 */
export function createHeroIdleFallback(): BlitSpriteSheet {
  const fw = 48;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 2; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const bob = f === 1 ? 1 : 0;

    // 1. Chân & Hài thêu nhung Cung Đình (y: 40 - 45)
    ctx.fillStyle = '#161426'; // Đế hài nhung đen
    ctx.fillRect(17, 41, 5, 4);
    ctx.fillRect(26, 41, 5, 4);
    ctx.fillStyle = '#fedb5b'; // Mũi hài thêu hoa văn mây vàng kim
    ctx.fillRect(18, 43, 3, 2);
    ctx.fillRect(27, 43, 3, 2);

    // 2. Quần lụa trắng ống suông buông rủ (y: 31 - 42)
    ctx.fillStyle = '#f7edd7'; // Bạch lụa
    ctx.fillRect(16, 31 + bob, 6, 11);
    ctx.fillRect(25, 31 + bob, 6, 11);
    // Đường nếp gấp lụa đổ bóng mềm
    ctx.fillStyle = '#dbcca9';
    ctx.fillRect(18, 33 + bob, 1, 8);
    ctx.fillRect(27, 33 + bob, 1, 8);

    // 3. Thân Áo Ngũ Thân (Xanh chàm ngọc bích / Teal hoàng gia) (y: 19 - 36)
    ctx.fillStyle = '#134743'; // Nền áo chàm đậm
    ctx.fillRect(15, 19 + bob, 18, 16);
    ctx.fillStyle = '#1f6e65'; // Vạt áo trước
    ctx.fillRect(16, 20 + bob, 10, 14);
    ctx.fillStyle = '#268c7e'; // Sắc ngọc bích tà áo
    ctx.fillRect(17, 21 + bob, 6, 12);

    // Đường vạt cong cài sang sườn phải & 5 hạt khuy vàng kim Ngũ Thường
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 20 + bob);
    ctx.quadraticCurveTo(27, 24 + bob, 27, 32 + bob);
    ctx.stroke();

    // 5 Hạt khuy ngọc vàng kim
    [21, 23, 26, 29, 32].forEach((ky, idx) => {
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(23 + (idx > 1 ? 3 : idx * 1), ky + bob, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(23 + (idx > 1 ? 3 : idx * 1), ky + bob, 1, 1);
    });

    // 4. Thắt lưng lụa đỏ son (Đỏ điều hoàng triều) & Khánh ngọc bội
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(15, 27 + bob, 18, 3);
    ctx.fillStyle = '#f7af34'; // Dây thắt vàng
    ctx.fillRect(22, 27 + bob, 3, 3);
    // Miếng ngọc bội xanh lục bảo rủ bên hông
    ctx.fillStyle = '#77e0b5';
    ctx.fillRect(27, 29 + bob, 2, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(27, 33 + bob, 2, 2);

    // 5. Tay áo chẽn thon gọn hai bên
    ctx.fillStyle = '#1a5952';
    ctx.fillRect(12, 21 + bob, 4, 11);
    ctx.fillRect(32, 21 + bob, 4, 11);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(13, 22 + bob, 2, 9);
    ctx.fillRect(33, 22 + bob, 2, 9);

    // Cổ tay áo lộn lót lụa trắng
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(12, 31 + bob, 4, 1);
    ctx.fillRect(32, 31 + bob, 4, 1);

    // Bàn tay da ngà thanh tú
    ctx.fillStyle = '#e8d2b7';
    ctx.fillRect(12, 32 + bob, 4, 3);
    ctx.fillRect(32, 32 + bob, 4, 3);

    // 6. Cổ Đứng Lập Lĩnh (Lót cổ nội trắng tôn nghiêm)
    ctx.fillStyle = '#f7edd7'; // Cổ nội trắng
    ctx.fillRect(20, 16 + bob, 8, 4);
    ctx.fillStyle = '#1f6e65'; // Cổ áo ngoài
    ctx.fillRect(21, 17 + bob, 6, 3);
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1;
    ctx.strokeRect(21.5, 17.5 + bob, 5, 2);

    // 7. Khuôn mặt chibi thanh tú & Đôi mắt sáng (y: 8 - 18)
    ctx.fillStyle = '#eedbc5'; // Da mặt ngà sáng
    ctx.fillRect(18, 8 + bob, 12, 9);
    // Mắt long lanh
    ctx.fillStyle = '#161426';
    ctx.fillRect(20, 11 + bob, 2, 3);
    ctx.fillRect(26, 11 + bob, 2, 3);
    ctx.fillStyle = '#ffffff'; // Chấm sáng tinh anh
    ctx.fillRect(20, 11 + bob, 1, 1);
    ctx.fillRect(26, 11 + bob, 1, 1);
    // Má hồng hoa sen
    ctx.fillStyle = '#f4a7b9';
    ctx.fillRect(18, 14 + bob, 2, 1);
    ctx.fillRect(28, 14 + bob, 2, 1);
    // Miệng mỉm cười đoan trang
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(23, 15 + bob, 2, 1);

    // 8. Khăn đóng xếp nếp chữ Nhất (Màu đen bóng lụa)
    ctx.fillStyle = '#161426';
    ctx.beginPath();
    ctx.ellipse(24, 6 + bob, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(17, 5 + bob, 14, 4);
    // Nếp gấp chữ Nhất viền chỉ vàng trán
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23, 5 + bob, 2, 3);
    // Tóc mai đen nhánh hai bên tai
    ctx.fillStyle = '#161426';
    ctx.fillRect(17, 9 + bob, 1, 4);
    ctx.fillRect(30, 9 + bob, 1, 4);

    frames.push(c);
  }

  return {
    id: 'hero_idle',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 2,
    fps: 4,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Run (48x48, 4 khung)
 * Tà áo và dải lụa thắt lưng tung bay uyển chuyển
 */
export function createHeroRunFallback(): BlitSpriteSheet {
  const fw = 48;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const legOffsets = [
      { l: -4, r: 4 },
      { l: 0, r: 0 },
      { l: 4, r: -4 },
      { l: 0, r: 0 },
    ][f];

    const bounce = [0, -1, 0, 1][f];

    // 1. Chân bước nhịp nhàng & Hài thêu hoa văn
    ctx.fillStyle = '#161426';
    ctx.fillRect(17 + legOffsets.l, 41 + bounce, 5, 4);
    ctx.fillRect(26 + legOffsets.r, 41 - bounce, 5, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(18 + legOffsets.l, 43 + bounce, 3, 2);
    ctx.fillRect(27 + legOffsets.r, 43 - bounce, 3, 2);

    // 2. Quần lụa trắng
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(16 + legOffsets.l, 31 + bounce, 6, 11);
    ctx.fillRect(25 + legOffsets.r, 31 - bounce, 6, 11);

    // 3. Thân áo ngũ thân bay nhẹ về phía sau
    const trail = [0, -1, -2, -1][f];
    ctx.fillStyle = '#134743';
    ctx.fillRect(15 + trail, 19 + bounce, 18, 16);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(16 + trail, 20 + bounce, 8, 14);

    // Khuy vàng & tà áo
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23 + trail, 22 + bounce, 2, 2);
    ctx.fillRect(25 + trail, 26 + bounce, 2, 2);
    ctx.fillRect(27 + trail, 30 + bounce, 2, 2);

    // 4. Thắt lưng đỏ & Dải lụa bay phất phới phía sau
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(15 + trail, 27 + bounce, 18, 3);
    // Dải lụa bay về sau
    ctx.fillStyle = '#e88827';
    ctx.fillRect(10 + trail, 28 + bounce, 6, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(8 + trail, 29 + bounce, 4, 2);

    // 5. Tay áo vung theo bước chạy
    const armL = [2, 0, -2, 0][f];
    const armR = [-2, 0, 2, 0][f];
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(12 + armL, 21 + bounce, 4, 11);
    ctx.fillRect(32 + armR, 21 + bounce, 4, 11);
    ctx.fillStyle = '#e8d2b7';
    ctx.fillRect(12 + armL, 32 + bounce, 4, 3);
    ctx.fillRect(32 + armR, 32 + bounce, 4, 3);

    // 6. Cổ áo lập lĩnh
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(20, 16 + bounce, 8, 4);
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(21, 17 + bounce, 6, 3);
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1;
    ctx.strokeRect(21.5, 17.5 + bounce, 5, 2);

    // 7. Khuôn mặt & Khăn đóng
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(18, 8 + bounce, 12, 9);
    ctx.fillStyle = '#161426';
    ctx.fillRect(21, 11 + bounce, 2, 3);
    ctx.fillRect(27, 11 + bounce, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 11 + bounce, 1, 1);
    ctx.fillRect(27, 11 + bounce, 1, 1);
    ctx.fillStyle = '#f4a7b9';
    ctx.fillRect(19, 14 + bounce, 2, 1);
    ctx.fillRect(29, 14 + bounce, 2, 1);

    // Khăn đóng & Dải khăn bay
    ctx.fillStyle = '#161426';
    ctx.fillRect(17, 5 + bounce, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23, 5 + bounce, 2, 3);
    // Dải khăn sau bay trong gió
    ctx.fillStyle = '#ba5e1b';
    ctx.fillRect(11 + trail, 6 + bounce, 6, 3);

    frames.push(c);
  }

  return {
    id: 'hero_run',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 8,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Attack 1 (64x48, 3 khung) - Vung Ngân Châm Kim Tuyến chém ra vòng cung lấp lánh cánh sen
 */
export function createHeroAttackFallback(): BlitSpriteSheet {
  const fw = 64;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 3; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // 1. Chân & Quần
    ctx.fillStyle = '#161426';
    ctx.fillRect(16, 41, 6, 4);
    ctx.fillRect(28, 41, 6, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(17, 43, 4, 2);
    ctx.fillRect(29, 43, 4, 2);

    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(15, 31, 7, 11);
    ctx.fillRect(27, 31, 7, 11);

    // 2. Thân áo vặn người xuất chiêu
    ctx.fillStyle = '#134743';
    ctx.fillRect(16, 19, 18, 16);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(18, 20, 8, 14);

    ctx.fillStyle = '#bf363b';
    ctx.fillRect(16, 27, 18, 3);

    // 3. Cổ áo & Mặt
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(21, 16, 8, 4);
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(22, 17, 6, 3);

    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(19, 8, 12, 9);
    ctx.fillStyle = '#161426';
    ctx.fillRect(23, 11, 2, 3);
    ctx.fillRect(28, 11, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 11, 1, 1);
    ctx.fillRect(28, 11, 1, 1);

    ctx.fillStyle = '#161426';
    ctx.fillRect(18, 5, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(24, 5, 2, 3);

    // 4. Cánh tay ra đòn vung ra phía trước
    const reach = [36, 44, 48][f];
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(30, 21, reach - 30, 6);
    ctx.fillStyle = '#eedbc5'; // Bàn tay nắm kim
    ctx.fillRect(reach, 21, 5, 5);

    // Cây Ngân Châm bạc sáng bóng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(reach + 5, 20, 8, 2);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(reach + 4, 19, 2, 4);

    // 5. VỆT CHÉM BÁN NGUYỆT KIM TUYẾN LUNG LINH (Arc Slash VFX)
    if (f >= 1) {
      // Vòng cung ánh sáng vàng kim & xanh ngọc
      ctx.strokeStyle = '#fedb5b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(38, 22, 16 + f * 3, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      ctx.strokeStyle = '#77e0b5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(38, 22, 14 + f * 3, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Cánh hoa sen lất phất bay theo đường kiếm
      ctx.fillStyle = '#f4a7b9';
      ctx.fillRect(reach + 8, 10, 3, 2);
      ctx.fillRect(reach + 12, 30, 2, 3);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(reach + 14, 18, 2, 2);
    }

    frames.push(c);
  }

  return {
    id: 'hero_attack_1',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 3,
    fps: 12,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Quái Chỉ Rối (32x32, 4 khung)
 * Cuộn tơ ngũ sắc rối nhảy nhót ngộ nghĩnh, mắt là 2 hạt nút gỗ, đuôi tơ lụa uốn lượn
 */
export function createMobChiRoiFallback(): BlitSpriteSheet {
  const fw = 32;
  const fh = 32;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const hop = [0, -3, -1, 0][f];

    // Quầng bụi tơ lụa nhỏ dưới chân
    ctx.fillStyle = 'rgba(232, 136, 39, 0.25)';
    ctx.beginPath();
    ctx.arc(16, 26, 7, 0, Math.PI * 2);
    ctx.fill();

    // Thân cuộn chỉ tròn bồng bềnh
    ctx.fillStyle = '#4a2411'; // Viền ngoài
    ctx.beginPath();
    ctx.arc(16, 17 + hop, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ba5e1b'; // Lớp chỉ nền cam đất
    ctx.beginPath();
    ctx.arc(16, 17 + hop, 9, 0, Math.PI * 2);
    ctx.fill();

    // Các đường chỉ tơ ngũ sắc đan chéo
    ctx.fillStyle = '#fedb5b'; // Chỉ vàng
    ctx.fillRect(10, 13 + hop, 12, 2);
    ctx.fillRect(9, 18 + hop, 14, 2);
    ctx.fillStyle = '#40bfa3'; // Chỉ xanh ngọc
    ctx.fillRect(11, 21 + hop, 10, 2);
    ctx.fillStyle = '#bf363b'; // Chỉ đỏ son
    ctx.fillRect(8, 15 + hop, 3, 5);
    ctx.fillRect(21, 15 + hop, 3, 5);

    // Hai mắt là hạt nút áo gỗ tròn ngơ ngác
    ctx.fillStyle = '#f7edd7'; // Trắng ngà
    ctx.beginPath();
    ctx.arc(12, 16 + hop, 3, 0, Math.PI * 2);
    ctx.arc(20, 16 + hop, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#161426'; // Lỗ cúc áo
    ctx.fillRect(11 + (f % 2), 15 + hop, 2, 2);
    ctx.fillRect(19 + (f % 2), 15 + hop, 2, 2);

    // Sợi tơ lụa thò ra ngoe nguẩy linh hoạt như đuôi
    const tailWave = Math.sin((f * Math.PI) / 2) * 3;
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(23, 15 + hop);
    ctx.quadraticCurveTo(27 + tailWave, 11 + hop, 25 + tailWave, 6 + hop);
    ctx.stroke();

    frames.push(c);
  }

  return {
    id: 'mob_chi_roi',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 8,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Bóng Bụi Mờ (32x32, 4 khung)
 * Đám khói sương trầm hương Cố Đô lơ lửng ma mị, đom đóm xanh ngọc bay quanh
 */
export function createMobBuiMoFallback(): BlitSpriteSheet {
  const fw = 32;
  const fh = 32;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const floatY = Math.sin(f * (Math.PI / 2)) * 2.5;

    // Hào quang khói sương mờ ảo
    ctx.fillStyle = 'rgba(119, 224, 181, 0.15)';
    ctx.beginPath();
    ctx.arc(16, 16 + floatY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Đám mây bụi tím than cung đình
    ctx.fillStyle = '#2c1933';
    ctx.beginPath();
    ctx.arc(16, 16 + floatY, 10, 0, Math.PI * 2);
    ctx.arc(11, 17 + floatY, 7, 0, Math.PI * 2);
    ctx.arc(21, 17 + floatY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3f2549';
    ctx.beginPath();
    ctx.arc(16, 16 + floatY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Mắt phát sáng xanh ngọc bích linh diệu
    ctx.fillStyle = '#77e0b5';
    ctx.beginPath();
    ctx.arc(12, 15 + floatY, 2.5, 0, Math.PI * 2);
    ctx.arc(20, 15 + floatY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 14 + floatY, 1, 1);
    ctx.fillRect(20, 14 + floatY, 1, 1);

    // Đom đóm lấp lánh bay quanh
    const fireflyAngle = (f * Math.PI) / 2;
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(16 + Math.cos(fireflyAngle) * 11, 16 + floatY + Math.sin(fireflyAngle) * 9, 2, 2);

    frames.push(c);
  }

  return {
    id: 'mob_bui_mo',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 6,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Mini-Boss: Bóng Mờ Vạt Áo (64x64, 4 khung)
 * Tấm áo gấm hoàng gia bị nguyền rủa, vạt áo tung bay ma mị, khiên bảo vệ tím ngọc
 */
export function createMiniBossVatAoFallback(): BlitSpriteSheet {
  const fw = 64;
  const fh = 64;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const sway = Math.sin(f * (Math.PI / 2)) * 3;

    // 1. Khiên Hiểu Lầm ma mị bao quanh (Shield Sphere)
    ctx.strokeStyle = '#a83b6f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(168, 59, 111, 0.18)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    // Hạt tinh thể khiên xoay quanh
    const kAngle = (f * Math.PI) / 2;
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(32 + Math.cos(kAngle) * 29 - 2, 32 + Math.sin(kAngle) * 29 - 2, 4, 4);

    // 2. Tấm áo gấm vạt rộng hoàng cung uốn lượn
    ctx.fillStyle = '#4a1525'; // Nền gấm đỏ rượu
    ctx.fillRect(16 + sway, 15, 32, 38);

    ctx.fillStyle = '#87232e'; // Đỏ điều hoàng gia
    ctx.fillRect(18 + sway, 17, 28, 34);

    // Cổ đứng & vạt chéo gấm thêu phượng
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(28 + sway, 15, 8, 4);
    // Hoa văn gấm hoàng gia vàng kim
    ctx.fillRect(22 + sway, 23, 7, 5);
    ctx.fillRect(35 + sway, 31, 7, 5);
    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(24 + sway, 25, 3, 2);
    ctx.fillRect(37 + sway, 33, 3, 2);

    // Hai tà áo uốn lượn như cánh ma quái
    ctx.fillStyle = '#6b1c1c';
    ctx.beginPath();
    ctx.moveTo(16 + sway, 20);
    ctx.lineTo(8 + sway, 36);
    ctx.lineTo(16 + sway, 38);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(48 + sway, 20);
    ctx.lineTo(56 + sway, 36);
    ctx.lineTo(48 + sway, 38);
    ctx.closePath();
    ctx.fill();

    // 3. Cây kéo may cổ bằng thép gỉ cắm trên lưng
    ctx.fillStyle = '#63534b';
    ctx.fillRect(38 + sway, 6, 4, 16);
    ctx.beginPath();
    ctx.arc(36 + sway, 7, 5, 0, Math.PI * 2);
    ctx.arc(44 + sway, 7, 5, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Khuôn mặt ma mị tinh quái
    ctx.fillStyle = '#fedb5b'; // Mắt vàng rực
    ctx.beginPath();
    ctx.arc(25 + sway, 28, 3.5, 0, Math.PI * 2);
    ctx.arc(39 + sway, 28, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#161426'; // Con ngươi
    ctx.fillRect(25 + sway, 27, 2, 3);
    ctx.fillRect(39 + sway, 27, 2, 3);

    // Nụ cười ngoác miệng chỉ khâu méo mó
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24 + sway, 38);
    ctx.quadraticCurveTo(32 + sway, 44, 40 + sway, 38);
    ctx.stroke();

    frames.push(c);
  }

  return {
    id: 'miniboss_vat_ao',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 6,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Boss Cuối: "Bóng Lãng Quên" (160x160, 4 khung)
 * Quái vật tơ chỉ bóng tối cổ đại, mắt khuy đồng rực lửa, kim kéo cổ cắm sau lưng
 */
export function createBossLangQuenFallback(): BlitSpriteSheet {
  const fw = 160;
  const fh = 160;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const breathe = [0, 3, 5, 2][f];
    const sway = Math.sin((f * Math.PI) / 2) * 2;

    // 1. Quầng hắc khí tơ lụa ma mị bao quanh (Dark Shadow Aura)
    ctx.fillStyle = 'rgba(45, 20, 50, 0.35)';
    ctx.beginPath();
    ctx.arc(80, 80, 72 + breathe, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(168, 59, 111, 0.2)';
    ctx.beginPath();
    ctx.arc(80, 80, 64 + breathe, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hai cây kéo may khổng lồ bằng sắt cổ gỉ sét cắm chéo sau lưng
    // Kéo trái
    ctx.fillStyle = '#63534b';
    ctx.fillRect(44, 25 - breathe, 5, 38);
    ctx.fillRect(40, 20 - breathe, 14, 5);
    // Kéo phải
    ctx.fillRect(111, 25 - breathe, 5, 38);
    ctx.fillRect(106, 20 - breathe, 14, 5);

    // Cây kim may khổng lồ xuyên chéo
    ctx.fillStyle = '#dbcca9';
    ctx.fillRect(60, 18 - breathe, 40, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(96, 17 - breathe, 6, 6);

    // 3. Thân cuộn chỉ rối khổng lồ (Nền tím than & nhung đen rách nát)
    ctx.fillStyle = '#140f21';
    ctx.beginPath();
    ctx.arc(80 + sway, 80, 58 + breathe * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#261b2d';
    ctx.beginPath();
    ctx.arc(80 + sway, 80, 54 + breathe * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Các mảng vải gấm hoàng gia bị xé rách dính trên thân quái vật
    ctx.fillStyle = '#7a1f2f'; // Vải đỏ điều
    ctx.fillRect(52 + sway, 65, 22, 28);
    ctx.fillStyle = '#fedb5b'; // Thêu vàng
    ctx.fillRect(56 + sway, 70, 6, 4);

    ctx.fillStyle = '#1d5c42'; // Vải xanh chàm
    ctx.fillRect(86 + sway, 68, 24, 24);
    ctx.fillStyle = '#77e0b5';
    ctx.fillRect(92 + sway, 74, 5, 4);

    // Các lớp sợi tơ chỉ rối chằng chịt đa sắc
    const threadColors = ['#bf363b', '#fedb5b', '#40bfa3', '#a83b6f', '#e88827', '#ffffff'];
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = threadColors[i % threadColors.length];
      const angle = (i * 15 * Math.PI) / 180;
      const r = 26 + ((i * 9) % 26);
      const tx = 80 + sway + Math.cos(angle) * r;
      const ty = 80 + Math.sin(angle) * r;
      ctx.fillRect(tx - 10, ty - 2, 20, 3);
    }

    // 4. Hai Mắt là Khuy Áo Đồng Cổ Phát Sáng Rực Lửa Tà Ác
    const eyeY = 64 + breathe * 0.4;
    // Khuy trái
    ctx.fillStyle = '#fedb5b'; // Vàng đồng rực sáng
    ctx.beginPath();
    ctx.arc(60 + sway, eyeY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#87232e'; // Tâm đỏ rực lửa
    ctx.beginPath();
    ctx.arc(60 + sway, eyeY, 12, 0, Math.PI * 2);
    ctx.fill();
    // 4 lỗ khuy phát quang
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(56 + sway, eyeY - 4, 3, 3);
    ctx.fillRect(61 + sway, eyeY - 4, 3, 3);
    ctx.fillRect(56 + sway, eyeY + 2, 3, 3);
    ctx.fillRect(61 + sway, eyeY + 2, 3, 3);

    // Khuy phải
    ctx.fillStyle = '#fedb5b';
    ctx.beginPath();
    ctx.arc(100 + sway, eyeY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#87232e';
    ctx.beginPath();
    ctx.arc(100 + sway, eyeY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(96 + sway, eyeY - 4, 3, 3);
    ctx.fillRect(101 + sway, eyeY - 4, 3, 3);
    ctx.fillRect(96 + sway, eyeY + 2, 3, 3);
    ctx.fillRect(101 + sway, eyeY + 2, 3, 3);

    // 5. Miệng Quái Vật: Răng nanh nhọn hoắt như những mũi kim may bạc
    const mouthY = 100 + breathe * 0.4;
    ctx.fillStyle = '#161426'; // Vòm miệng tối om
    ctx.fillRect(50 + sway, mouthY - 2, 60, 14);

    // Hàng răng kim may nhọn
    ctx.fillStyle = '#ffffff';
    for (let rx = 52 + sway; rx <= 104 + sway; rx += 7) {
      // Răng trên
      ctx.beginPath();
      ctx.moveTo(rx, mouthY - 2);
      ctx.lineTo(rx + 4, mouthY - 2);
      ctx.lineTo(rx + 2, mouthY + 5);
      ctx.closePath();
      ctx.fill();
      // Răng dưới
      ctx.beginPath();
      ctx.moveTo(rx + 3, mouthY + 12);
      ctx.lineTo(rx + 7, mouthY + 12);
      ctx.lineTo(rx + 5, mouthY + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Đường chỉ may ziczac khóa miệng méo mó
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 50 + sway; x <= 108 + sway; x += 8) {
      ctx.lineTo(x, mouthY + ((x / 8) % 2 === 0 ? 0 : 10));
    }
    ctx.stroke();

    // 6. Các xúc tu tơ chỉ uốn lượn sống động dưới sàn
    const tentacleWave = Math.sin((f * Math.PI) / 2) * 4;
    ctx.fillStyle = '#a83b6f';
    ctx.fillRect(36 + tentacleWave, 132 + breathe, 22, 6);
    ctx.fillRect(102 - tentacleWave, 132 + breathe, 22, 6);
    ctx.fillStyle = '#7a1f2f';
    ctx.fillRect(68, 136 + breathe, 24, 7);

    frames.push(c);
  }

  return {
    id: 'boss_idle',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 4,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Thẻ Sự Thật (24x32, 4 khung)
 */
export function createItemTruthCardFallback(): BlitSpriteSheet {
  const fw = 24;
  const fh = 32;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const shine = f;

    // Khung thẻ mạ vàng (#f7af34)
    ctx.fillStyle = '#161426';
    ctx.fillRect(1, 1, fw - 2, fh - 2);

    ctx.fillStyle = '#f7edd7'; // Giấy lụa ngà
    ctx.fillRect(2, 2, fw - 4, fh - 4);

    // Viền vàng kim
    ctx.strokeStyle = '#f7af34';
    ctx.strokeRect(3.5, 3.5, fw - 7, fh - 7);

    // Họa tiết hoa sen cổ phong ở giữa
    ctx.fillStyle = '#d96499'; // Hồng sen
    ctx.fillRect(10, 12, 4, 6);
    ctx.fillRect(8, 14, 8, 3);
    ctx.fillStyle = '#268c7e'; // Cuống sen
    ctx.fillRect(11, 18, 2, 4);

    // Dòng chữ thi văn tượng trưng
    ctx.fillStyle = '#7a3d13';
    ctx.fillRect(6, 7, 12, 2);
    ctx.fillRect(6, 24, 12, 2);

    // Tia lấp lánh quét qua thẻ
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4 + shine * 3, 4 + shine * 4, 3, 2);

    frames.push(c);
  }

  return {
    id: 'item_truth_card',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 6,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Jump (48x48, 2 khung)
 * Tầm Phục Sĩ phi thân trên không, tà áo ngũ thân và dải lụa bay lượn uyển chuyển
 */
export function createHeroJumpFallback(): BlitSpriteSheet {
  const fw = 48;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 2; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const lift = f === 0 ? -3 : -1;

    // 1. Chân co lên khi phi thân & Hài thêu hoàng cung
    ctx.fillStyle = '#161426';
    ctx.fillRect(16, 36 + lift, 5, 4);
    ctx.fillRect(25, 38 + lift, 5, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(17, 38 + lift, 3, 2);
    ctx.fillRect(26, 40 + lift, 3, 2);

    // 2. Quần lụa trắng co gối
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(16, 29 + lift, 6, 8);
    ctx.fillRect(24, 30 + lift, 6, 9);
    ctx.fillStyle = '#dbcca9';
    ctx.fillRect(18, 30 + lift, 1, 6);

    // 3. Thân Áo Ngũ Thân xòe rộng đón gió (Màu ngọc bích hoàng triều)
    ctx.fillStyle = '#134743';
    ctx.fillRect(13, 17 + lift, 22, 14);
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(14, 18 + lift, 12, 13);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(15, 19 + lift, 8, 11);

    // Tà áo xòe lượn sóng 2 bên
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(11, 26 + lift, 4, 5);
    ctx.fillRect(33, 26 + lift, 4, 5);

    // 5 Khuy ngọc vàng kim
    ctx.fillStyle = '#fedb5b';
    [19, 22, 25].forEach((ky, idx) => {
      ctx.fillRect(23 + idx, ky + lift, 2, 2);
    });

    // 4. Thắt lưng đỏ son & Dải lụa bay phất phới phía dưới
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(13, 24 + lift, 22, 3);
    // Dải lụa buông rủ bay lượn
    ctx.fillStyle = '#e88827';
    ctx.fillRect(21, 27 + lift, 3, 9);
    ctx.fillRect(25, 27 + lift, 3, 7);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(21, 35 + lift, 3, 2);
    ctx.fillRect(25, 33 + lift, 3, 2);

    // Ngọc bội xanh lục bảo rung rinh
    ctx.fillStyle = '#77e0b5';
    ctx.fillRect(28, 26 + lift, 2, 4);

    // 5. Hai tay dang ngang giữ thăng bằng thanh thoát
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(9, 18 + lift, 5, 8);
    ctx.fillRect(34, 18 + lift, 5, 8);
    ctx.fillStyle = '#eedbc5'; // Bàn tay ngà
    ctx.fillRect(8, 25 + lift, 4, 3);
    ctx.fillRect(36, 25 + lift, 4, 3);

    // Ngân Châm lấp lánh trên tay phải
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(39, 22 + lift, 7, 2);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(38, 21 + lift, 2, 4);

    // 6. Cổ áo lập lĩnh & Mặt
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(20, 14 + lift, 8, 4);
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(21, 15 + lift, 6, 3);

    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(18, 6 + lift, 12, 9);
    ctx.fillStyle = '#161426';
    ctx.fillRect(20, 9 + lift, 2, 3);
    ctx.fillRect(26, 9 + lift, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 9 + lift, 1, 1);
    ctx.fillRect(26, 9 + lift, 1, 1);

    // Má hồng sen
    ctx.fillStyle = '#f4a7b9';
    ctx.fillRect(18, 12 + lift, 2, 1);
    ctx.fillRect(28, 12 + lift, 2, 1);

    // 7. Khăn đóng đen chữ Nhất & Dải khăn bay ngược chiều gió
    ctx.fillStyle = '#161426';
    ctx.fillRect(17, 3 + lift, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23, 3 + lift, 2, 3);
    // Dải khăn sau bay bổng
    ctx.fillStyle = '#161426';
    ctx.fillRect(12, 2 + lift, 6, 3);

    frames.push(c);
  }

  return {
    id: 'hero_jump',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 2,
    fps: 4,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Dodge / Lướt Nhanh (48x48, 3 khung)
 * Thân pháp phi hồ lướt sát mặt đất để lại tàn ảnh lụa óng ánh
 */
export function createHeroDodgeFallback(): BlitSpriteSheet {
  const fw = 48;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 3; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // 1. VỆT TÀN ẢNH LỤA HOÀNG GIA (Afterimage Ghost Trail)
    ctx.fillStyle = 'rgba(64, 191, 163, 0.28)';
    ctx.fillRect(6, 26, 14, 12);
    ctx.fillStyle = 'rgba(254, 219, 91, 0.35)';
    ctx.fillRect(2, 28, 10, 3);
    ctx.fillRect(4, 32, 8, 2);

    // 2. Chân xoạc thấp lướt nhanh
    ctx.fillStyle = '#161426';
    ctx.fillRect(14, 42, 8, 3);
    ctx.fillRect(28, 42, 9, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(20, 43, 3, 2);
    ctx.fillRect(35, 43, 3, 2);

    // Quần lụa trắng là là mặt sàn
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(16, 35, 12, 7);
    ctx.fillRect(26, 36, 11, 6);

    // 3. Thân áo ngũ thân nghiêng thấp khí thế
    ctx.fillStyle = '#134743';
    ctx.fillRect(16, 25, 22, 12);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(18, 26, 12, 10);

    // Khuy vàng & viền vạt
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(25, 27, 2, 2);
    ctx.fillRect(28, 30, 2, 2);

    // 4. Thắt lưng đỏ & Dải lụa bay dài phía sau
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(16, 31, 20, 3);
    ctx.fillStyle = '#e88827';
    ctx.fillRect(7, 30, 10, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(3, 31, 5, 2);

    // 5. Tay áo & Ngân Châm chĩa phía trước
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(30, 27, 8, 5);
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(37, 27, 4, 4);

    // Mũi kim may bạc lướt gió xé không khí
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(41, 28, 6, 2);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(40, 27, 2, 4);

    // 6. Khuôn mặt & Khăn đóng nghiêng tập trung
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(22, 16, 11, 9);
    ctx.fillStyle = '#161426';
    ctx.fillRect(27, 19, 3, 2); // Mắt nhìn thẳng cương nghị
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 19, 1, 1);

    ctx.fillStyle = '#161426';
    ctx.fillRect(20, 13, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(25, 13, 2, 3);

    // Dải khăn bay dài phía sau
    ctx.fillStyle = '#161426';
    ctx.fillRect(10, 14, 10, 3);

    frames.push(c);
  }

  return {
    id: 'hero_dodge',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 3,
    fps: 12,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Attack 2 (Đòn Đâm Kim Tuyến Tuyệt Chiêu - 64x48, 3 khung)
 */
export function createHeroAttack2Fallback(): BlitSpriteSheet {
  const fw = 64;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 3; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const lunge = f * 3;

    // 1. Chân tấn vững chãi
    ctx.fillStyle = '#161426';
    ctx.fillRect(12, 41, 7, 4);
    ctx.fillRect(28 + lunge, 41, 7, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(13, 43, 4, 2);
    ctx.fillRect(30 + lunge, 43, 4, 2);

    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(12, 31, 8, 11);
    ctx.fillRect(26 + lunge, 32, 9, 10);

    // 2. Thân áo ngũ thân nghiêng dồn lực
    ctx.fillStyle = '#134743';
    ctx.fillRect(15 + lunge, 19, 18, 16);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(18 + lunge, 20, 10, 14);

    ctx.fillStyle = '#bf363b';
    ctx.fillRect(15 + lunge, 27, 18, 3);

    // 3. Đầu & Mặt
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(18 + lunge, 8, 12, 9);
    ctx.fillStyle = '#161426';
    ctx.fillRect(23 + lunge, 11, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24 + lunge, 11, 1, 1);

    ctx.fillStyle = '#161426';
    ctx.fillRect(17 + lunge, 5, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23 + lunge, 5, 2, 3);

    // 4. Tay phóng đòn đâm thẳng
    const thrustX = 32 + lunge + f * 5;
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(26 + lunge, 20, thrustX - (26 + lunge), 5);
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(thrustX, 20, 5, 5);

    // Ngân Châm phóng thẳng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(thrustX + 5, 21, 12, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(thrustX + 4, 20, 2, 5);

    // 5. TIA NĂNG LƯỢNG KIM TUYẾN THẦN THỐNG (Thrust Beam VFX)
    if (f >= 1) {
      // Tia chớp chỉ vàng rực sáng
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(thrustX + 17, 21, 14, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(thrustX + 17, 22, 14, 1);

      // Ngôi sao 4 cánh lóe sáng ở mũi kim
      const starX = thrustX + 18;
      const starY = 22;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(starX - 3, starY, 7, 1);
      ctx.fillRect(starX, starY - 3, 1, 7);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(starX - 1, starY - 1, 3, 3);

      // Hạt tơ lụa ngũ sắc phóng ra
      ctx.fillStyle = '#77e0b5';
      ctx.fillRect(thrustX + 22, 17, 2, 2);
      ctx.fillRect(thrustX + 26, 26, 2, 2);
    }

    frames.push(c);
  }

  return {
    id: 'hero_attack_2',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 3,
    fps: 12,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Attack 3 (Đòn Xoay Vòng Sen Nở Vàng Kim - 64x48, 4 khung)
 */
export function createHeroAttack3Fallback(): BlitSpriteSheet {
  const fw = 64;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // 1. Chân xoay tròn
    ctx.fillStyle = '#161426';
    ctx.fillRect(20, 41, 6, 4);
    ctx.fillRect(30, 41, 6, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(21, 43, 4, 2);
    ctx.fillRect(31, 43, 4, 2);

    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(19, 31, 7, 11);
    ctx.fillRect(29, 31, 7, 11);

    // 2. Thân áo xoay tròn 360 độ xòe rộng
    ctx.fillStyle = '#134743';
    ctx.fillRect(16, 19, 24, 16);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(18, 20, 20, 14);

    ctx.fillStyle = '#bf363b';
    ctx.fillRect(16, 27, 24, 3);

    // 3. Đầu & Khăn đóng
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(22, 8, 12, 9);
    ctx.fillStyle = '#161426';
    ctx.fillRect(25, 11, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(25, 11, 1, 1);

    ctx.fillStyle = '#161426';
    ctx.fillRect(21, 5, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(27, 5, 2, 3);

    // 4. VÒNG SÁNG HOA SEN VÀNG KIM TRỌN VẸN (Full Circular Lotus Arc)
    const spinAngle = (f * Math.PI) / 2;
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(28, 24, 22, spinAngle, spinAngle + Math.PI * 1.2);
    ctx.stroke();

    ctx.strokeStyle = '#77e0b5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(28, 24, 19, spinAngle + 0.2, spinAngle + Math.PI);
    ctx.stroke();

    // 5. Cánh hoa sen hồng Cố Đô bay tung tóe theo vòng xoay
    const petalAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    ctx.fillStyle = '#f4a7b9';
    petalAngles.forEach((a) => {
      const px = 28 + Math.cos(spinAngle + a) * 23;
      const py = 24 + Math.sin(spinAngle + a) * 21;
      ctx.fillRect(px - 1, py - 1, 3, 2);
    });

    frames.push(c);
  }

  return {
    id: 'hero_attack_3',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 12,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Crouch / Cúi Người (48x48, 2 khung)
 * Tầm Phục Sĩ hạ thấp trọng tâm, tà áo ngũ thân buông là là mặt sàn, tay cầm ngân châm thủ thế
 */
export function createHeroCrouchFallback(): BlitSpriteSheet {
  const fw = 48;
  const fh = 48;
  const frames: HTMLCanvasElement[] = [];

  for (let f = 0; f < 2; f++) {
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const breathe = f === 1 ? 1 : 0;

    // 1. Chân & Hài thêu quỳ thấp sát sàn (y: 41 - 45)
    ctx.fillStyle = '#161426';
    ctx.fillRect(15, 42, 7, 3);
    ctx.fillRect(26, 42, 8, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(16, 43, 4, 2);
    ctx.fillRect(28, 43, 4, 2);

    // 2. Quần lụa trắng gập nếp sát sàn
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(14, 35 + breathe, 10, 8);
    ctx.fillRect(25, 36 + breathe, 10, 7);
    ctx.fillStyle = '#dbcca9';
    ctx.fillRect(16, 37 + breathe, 1, 5);
    ctx.fillRect(27, 38 + breathe, 1, 5);

    // 3. Thân Áo Ngũ Thân hạ thấp xòe nhẹ trên mặt đất
    ctx.fillStyle = '#134743';
    ctx.fillRect(13, 23 + breathe, 22, 14);
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(14, 24 + breathe, 14, 12);
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(15, 25 + breathe, 10, 10);

    // Khuy vàng cài sang sườn phải
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23, 26 + breathe, 2, 2);
    ctx.fillRect(25, 29 + breathe, 2, 2);
    ctx.fillRect(27, 32 + breathe, 2, 2);

    // 4. Thắt lưng đỏ son & Dải lụa nằm sát sàn
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(13, 30 + breathe, 22, 3);
    ctx.fillStyle = '#e88827';
    ctx.fillRect(19, 33 + breathe, 5, 5);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(20, 36 + breathe, 3, 2);

    // Ngọc bội xanh rủ bên hông
    ctx.fillStyle = '#77e0b5';
    ctx.fillRect(26, 32 + breathe, 2, 3);

    // 5. Tay áo & Ngân Châm thủ thế tầm thấp
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(10, 26 + breathe, 5, 8);
    ctx.fillRect(29, 26 + breathe, 7, 5);
    ctx.fillStyle = '#eedbc5'; // Bàn tay ngà
    ctx.fillRect(11, 33 + breathe, 4, 3);
    ctx.fillRect(35, 26 + breathe, 4, 4);

    // Ngân Châm chĩa thẳng ngang tầm ngực thủ thế
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(39, 27 + breathe, 7, 2);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(38, 26 + breathe, 2, 4);

    // 6. Cổ áo lập lĩnh & Khuôn mặt cúi thấp
    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(19, 19 + breathe, 8, 4);
    ctx.fillStyle = '#1f6e65';
    ctx.fillRect(20, 20 + breathe, 6, 3);

    // Mặt cúi thấp mắt quan sát sắc bén
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(17, 12 + breathe, 12, 8);
    ctx.fillStyle = '#161426';
    ctx.fillRect(20, 15 + breathe, 2, 2); // Mắt nhìn thẳng
    ctx.fillRect(25, 15 + breathe, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 15 + breathe, 1, 1);
    ctx.fillRect(25, 15 + breathe, 1, 1);

    // Má hồng sen
    ctx.fillStyle = '#f4a7b9';
    ctx.fillRect(17, 17 + breathe, 2, 1);
    ctx.fillRect(27, 17 + breathe, 2, 1);

    // 7. Khăn đóng đen chữ Nhất nghiêng nhẹ
    ctx.fillStyle = '#161426';
    ctx.fillRect(16, 9 + breathe, 14, 4);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(22, 9 + breathe, 2, 3);

    frames.push(c);
  }

  return {
    id: 'hero_crouch',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 2,
    fps: 4,
    frames,
    isFallback: true,
  };
}

import { getOrCreateCodexSprite } from './codexSprites.ts';

function createCodexFallback(id: string): () => BlitSpriteSheet {
  return () => {
    const canvas = getOrCreateCodexSprite(id.replace('codex_', ''));
    return {
      id,
      frameWidth: 64,
      frameHeight: 96,
      frameCount: 1,
      fps: 1,
      frames: [canvas],
      isFallback: true,
    };
  };
}

/**
 * Kho đăng ký toàn bộ Sprite dự phòng sẵn sàng phục vụ game engine
 */
export const FALLBACK_SPRITE_REGISTRY: Record<string, () => BlitSpriteSheet> = {
  hero_idle: createHeroIdleFallback,
  hero_run: createHeroRunFallback,
  hero_jump: createHeroJumpFallback,
  hero_crouch: createHeroCrouchFallback,
  hero_dodge: createHeroDodgeFallback,
  hero_attack_1: createHeroAttackFallback,
  hero_attack_2: createHeroAttack2Fallback,
  hero_attack_3: createHeroAttack3Fallback,
  mob_chi_roi: createMobChiRoiFallback,
  mob_bui_mo: createMobBuiMoFallback,
  miniboss_vat_ao: createMiniBossVatAoFallback,
  boss_idle: createBossLangQuenFallback,
  item_truth_card: createItemTruthCardFallback,
  codex_ao_ngu_than: createCodexFallback('codex_ao_ngu_than'),
  codex_ao_tac: createCodexFallback('codex_ao_tac'),
  codex_ao_nhat_binh: createCodexFallback('codex_ao_nhat_binh'),
  codex_ao_giao_linh: createCodexFallback('codex_ao_giao_linh'),
  codex_ao_tu_than: createCodexFallback('codex_ao_tu_than'),
  codex_ao_ba_ba: createCodexFallback('codex_ao_ba_ba'),
};

