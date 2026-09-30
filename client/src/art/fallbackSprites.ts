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
 * Tạo sprite 9-slice panel 24x24 px (khung navy viền vàng góc hoa văn)
 */
export function createFallback9Slice(): HTMLCanvasElement {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Nền navy thẫm (#15213b)
  ctx.fillStyle = '#15213b';
  ctx.fillRect(1, 1, size - 2, size - 2);

  // Viền ngoài tím than 1px (#161426)
  ctx.strokeStyle = '#161426';
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

  // Viền trong vàng kim lưu ly (#f7af34)
  ctx.strokeStyle = '#f7af34';
  ctx.strokeRect(2.5, 2.5, size - 5, size - 5);

  // Hoa văn góc 4 góc (Chấm vàng hoàng kim #fedb5b và cam hổ phách #e88827)
  const corners = [
    [2, 2], [size - 4, 2],
    [2, size - 4], [size - 4, size - 4],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(cx, cy, 2, 2);
    ctx.fillStyle = '#e88827';
    ctx.fillRect(cx + 0.5, cy + 0.5, 1, 1);
  });

  return canvas;
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Idle (48x48, 2 khung)
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

    // Chân & Guốc mộc (y: 40 - 45)
    ctx.fillStyle = '#161426'; // Viền chân
    ctx.fillRect(18, 42, 4, 4);
    ctx.fillRect(26, 42, 4, 4);
    ctx.fillStyle = '#947a6b'; // Gỗ guốc
    ctx.fillRect(19, 44, 3, 2);
    ctx.fillRect(27, 44, 3, 2);

    // Quần lụa trắng ống suông (y: 32 - 42)
    ctx.fillStyle = '#f7edd7'; // Trắng lụa
    ctx.fillRect(17, 32 + bob, 6, 10);
    ctx.fillRect(25, 32 + bob, 6, 10);
    ctx.fillStyle = '#c7aa8d'; // Nếp gấp quần
    ctx.fillRect(19, 34 + bob, 1, 8);
    ctx.fillRect(27, 34 + bob, 1, 8);

    // Thân áo cổ phục màu xanh chàm / teal (y: 20 - 35)
    ctx.fillStyle = '#1c5e59'; // Xanh cổ vịt
    ctx.fillRect(16, 20 + bob, 16, 15);
    ctx.fillStyle = '#268c7e'; // Sáng trên tà áo
    ctx.fillRect(17, 21 + bob, 7, 13);
    // Vạt chéo & khuy áo vàng kim
    ctx.fillStyle = '#f7af34';
    ctx.fillRect(24, 21 + bob, 2, 2);
    ctx.fillRect(25, 25 + bob, 2, 2);
    ctx.fillRect(26, 29 + bob, 2, 2);

    // Thắt lưng lụa cam hổ phách
    ctx.fillStyle = '#e88827';
    ctx.fillRect(16, 27 + bob, 16, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(23, 27 + bob, 3, 3);

    // Tay áo chẽn hai bên
    ctx.fillStyle = '#1c5e59';
    ctx.fillRect(13, 22 + bob, 3, 10);
    ctx.fillRect(32, 22 + bob, 3, 10);
    // Bàn tay màu da ngà
    ctx.fillStyle = '#e8d2b7';
    ctx.fillRect(13, 32 + bob, 3, 3);
    ctx.fillRect(32, 32 + bob, 3, 3);

    // Cổ đứng (Lập lĩnh)
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(21, 17 + bob, 6, 3);
    ctx.fillStyle = '#f7af34';
    ctx.fillRect(23, 17 + bob, 2, 1);

    // Khuôn mặt chibi (y: 8 - 18)
    ctx.fillStyle = '#e8d2b7'; // Da mặt
    ctx.fillRect(18, 8 + bob, 12, 10);
    // Mắt chibi
    ctx.fillStyle = '#161426';
    ctx.fillRect(21, 12 + bob, 2, 3);
    ctx.fillRect(26, 12 + bob, 2, 3);
    ctx.fillStyle = '#ffffff'; // Chấm sáng mắt
    ctx.fillRect(21, 12 + bob, 1, 1);
    ctx.fillRect(26, 12 + bob, 1, 1);
    // Má hồng sen
    ctx.fillStyle = '#f29ec0';
    ctx.fillRect(19, 15 + bob, 2, 1);
    ctx.fillRect(28, 15 + bob, 2, 1);

    // Khăn đóng / Dải quấn đầu cam hoàng hôn
    ctx.fillStyle = '#e88827';
    ctx.fillRect(17, 5 + bob, 14, 4);
    ctx.fillStyle = '#fedb5b'; // Nếp chữ Nhân trán
    ctx.fillRect(23, 6 + bob, 2, 3);
    // Dải khăn bay phía sau
    ctx.fillStyle = '#ba5e1b';
    ctx.fillRect(13 - (f * 1), 7 + bob, 4, 3);

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

    const bob = f % 2 === 1 ? 1 : 0;

    // Chân chạy
    ctx.fillStyle = '#f7edd7'; // Quần lụa
    ctx.fillRect(18 + legOffsets.l, 33 + bob, 5, 8);
    ctx.fillRect(26 + legOffsets.r, 33 + bob, 5, 8);
    // Guốc
    ctx.fillStyle = '#947a6b';
    ctx.fillRect(18 + legOffsets.l, 41 + bob, 5, 3);
    ctx.fillRect(26 + legOffsets.r, 41 + bob, 5, 3);

    // Thân áo nghiêng theo hướng chạy
    ctx.fillStyle = '#1c5e59';
    ctx.fillRect(18, 20 + bob, 15, 14);
    // Tà áo phất nhẹ về sau
    ctx.fillStyle = '#268c7e';
    ctx.fillRect(14, 26 + bob, 5, 8);

    // Thắt lưng cam
    ctx.fillStyle = '#e88827';
    ctx.fillRect(18, 26 + bob, 15, 3);

    // Tay vung
    ctx.fillStyle = '#1c5e59';
    ctx.fillRect(14 - legOffsets.l, 22 + bob, 4, 8);
    ctx.fillRect(32 + legOffsets.l, 22 + bob, 4, 8);

    // Đầu & Dải khăn bay phấp phới
    ctx.fillStyle = '#e8d2b7';
    ctx.fillRect(20, 8 + bob, 12, 10);
    ctx.fillStyle = '#161426';
    ctx.fillRect(24, 12 + bob, 2, 3); // Mắt
    ctx.fillStyle = '#e88827'; // Khăn đầu
    ctx.fillRect(19, 5 + bob, 14, 4);
    // Đuôi khăn bay dài theo gió chạy
    ctx.fillStyle = '#ba5e1b';
    ctx.fillRect(10 - f, 6 + bob + (f % 2), 9, 3);

    frames.push(c);
  }

  return {
    id: 'hero_run',
    frameWidth: fw,
    frameHeight: fh,
    frameCount: 4,
    fps: 10,
    frames,
    isFallback: true,
  };
}

/**
 * Tạo Fallback Sprite Sheet cho Hero Attack 1 (64x48, 3 khung) - Đấm móc kèm vệt gió vàng
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

    // Nhân vật ở vị trí x: 16 - 36
    ctx.fillStyle = '#f7edd7'; // Quần
    ctx.fillRect(20, 32, 6, 12);
    ctx.fillRect(28, 32, 6, 12);
    ctx.fillStyle = '#947a6b'; // Guốc
    ctx.fillRect(20, 44, 6, 2);
    ctx.fillRect(28, 44, 6, 2);

    ctx.fillStyle = '#1c5e59'; // Áo
    ctx.fillRect(18, 20, 16, 14);
    ctx.fillStyle = '#e88827'; // Thắt lưng
    ctx.fillRect(18, 26, 16, 3);

    // Đầu
    ctx.fillStyle = '#e8d2b7';
    ctx.fillRect(20, 8, 12, 10);
    ctx.fillStyle = '#161426'; // Mắt quyết liệt
    ctx.fillRect(25, 12, 3, 2);
    ctx.fillStyle = '#e88827'; // Khăn
    ctx.fillRect(19, 5, 14, 4);

    // Cánh tay ra đòn vung ra phía trước
    const reach = [36, 44, 48][f];
    ctx.fillStyle = '#1c5e59';
    ctx.fillRect(32, 22, reach - 32, 5);
    ctx.fillStyle = '#e8d2b7'; // Nắm đấm
    ctx.fillRect(reach, 21, 6, 6);

    // Vệt chém năng lượng vàng cam rực rỡ ở khung 1 và 2
    if (f >= 1) {
      ctx.fillStyle = '#fedb5b'; // Tia chớp vàng
      ctx.fillRect(reach + 6, 16, 6, 14);
      ctx.fillStyle = '#f7af34'; // Vệt cam
      ctx.fillRect(reach + 4, 18, 4, 10);
      ctx.fillStyle = '#ffffff'; // Lõi trắng chớp giật
      ctx.fillRect(reach + 7, 20, 3, 6);
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

    // Cuộn len tròn (x: 6-26, y: 10-28)
    ctx.fillStyle = '#7a3d13'; // Viền nâu hổ phách
    ctx.beginPath();
    ctx.arc(16, 18 + hop, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e88827'; // Cam hổ phách
    ctx.beginPath();
    ctx.arc(16, 18 + hop, 8, 0, Math.PI * 2);
    ctx.fill();

    // Sợi chỉ rối lộn xộn
    ctx.fillStyle = '#f7af34'; // Vàng chỉ
    ctx.fillRect(11, 14 + hop, 10, 2);
    ctx.fillRect(9, 18 + hop, 14, 2);
    ctx.fillRect(13, 22 + hop, 8, 2);

    // Hai mắt ngơ ngác
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 16 + hop, 3, 4);
    ctx.fillRect(18, 16 + hop, 3, 4);
    ctx.fillStyle = '#161426'; // Con ngươi
    ctx.fillRect(13 + (f % 2), 17 + hop, 2, 2);
    ctx.fillRect(19 + (f % 2), 17 + hop, 2, 2);

    // Sợi chỉ thò ra ngoe nguẩy bên ngoài
    ctx.fillStyle = '#e88827';
    ctx.fillRect(23, 14 + hop - f, 4, 2);
    ctx.fillRect(26, 12 + hop - f, 2, 4);

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

    const floatY = Math.sin(f * (Math.PI / 2)) * 2;

    // Đám mây bụi tím xám
    ctx.fillStyle = '#3b253b';
    ctx.beginPath();
    ctx.arc(16, 16 + floatY, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2a4b73';
    ctx.beginPath();
    ctx.arc(16, 16 + floatY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Mắt phát sáng xanh ngọc
    ctx.fillStyle = '#77e0b5';
    ctx.fillRect(12, 14 + floatY, 3, 3);
    ctx.fillRect(18, 14 + floatY, 3, 3);

    // Khói bụi nhỏ xung quanh
    ctx.fillStyle = '#4f3547';
    ctx.fillRect(6, 18 + floatY + (f % 2), 3, 3);
    ctx.fillRect(24, 12 + floatY - (f % 2), 2, 2);

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

    // Khiên Hiểu Lầm mờ ảo (Bong bóng tím nhạt bao quanh)
    ctx.strokeStyle = '#a83b6f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(168, 59, 111, 0.15)';
    ctx.beginPath();
    ctx.arc(32, 32, 27, 0, Math.PI * 2);
    ctx.fill();

    // Cuộn vải gấm lớn vặn vẹo (Màu đỏ rượu & vàng rơm)
    ctx.fillStyle = '#541924';
    ctx.fillRect(18 + sway, 16, 28, 36);

    ctx.fillStyle = '#87232e'; // Đỏ điều
    ctx.fillRect(20 + sway, 18, 24, 32);

    // Hoa văn gấm hoàng gia méo mó
    ctx.fillStyle = '#f7af34';
    ctx.fillRect(24 + sway, 22, 6, 6);
    ctx.fillRect(34 + sway, 32, 6, 6);
    ctx.fillRect(26 + sway, 40, 8, 4);

    // Cây kéo may cổ cắm trên lưng
    ctx.fillStyle = '#c7aa8d';
    ctx.fillRect(38 + sway, 8, 4, 14);
    ctx.fillRect(42 + sway, 6, 6, 6);

    // Khuôn mặt ma mị ngộ nghĩnh
    ctx.fillStyle = '#fff39e';
    ctx.fillRect(24 + sway, 26, 4, 5); // Mắt trái
    ctx.fillRect(34 + sway, 26, 4, 5); // Mắt phải
    ctx.fillStyle = '#161426';
    ctx.fillRect(25 + sway, 28, 2, 3);
    ctx.fillRect(35 + sway, 28, 2, 3);

    // Nụ cười ngoác miệng
    ctx.fillStyle = '#161426';
    ctx.fillRect(26 + sway, 36, 12, 3);

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
 * Cuộn chỉ rối bám bụi, mắt là hai khuy áo, miệng đường chỉ may nguệch ngoạc
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

    const breathe = [0, 2, 4, 2][f];

    // Khói bụi và mạng nhện xung quanh boss
    ctx.fillStyle = 'rgba(79, 53, 71, 0.3)';
    ctx.beginPath();
    ctx.arc(80, 80, 68 + breathe, 0, Math.PI * 2);
    ctx.fill();

    // Thân cuộn chỉ rối khổng lồ (Màu tím than & xanh chàm)
    ctx.fillStyle = '#161426'; // Viền đậm
    ctx.beginPath();
    ctx.arc(80, 80, 56 + (breathe * 0.5), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#261b2d'; // Nâu trầm cổ mộc
    ctx.beginPath();
    ctx.arc(80, 80, 53 + (breathe * 0.5), 0, Math.PI * 2);
    ctx.fill();

    // Các lớp sợi len chỉ rối chằng chịt đa sắc
    const threadColors = ['#7a3d13', '#a83b6f', '#1c5e59', '#ba5e1b', '#3b6b99'];
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = threadColors[i % threadColors.length];
      const angle = (i * 20 * Math.PI) / 180;
      const r = 25 + ((i * 7) % 25);
      const tx = 80 + Math.cos(angle) * r;
      const ty = 80 + Math.sin(angle) * r;
      ctx.fillRect(tx - 12, ty - 2, 24, 4);
    }

    // Mắt là 2 chiếc khuy áo đồng cổ 4 lỗ to tướng
    const eyeY = 65 + (breathe * 0.4);
    // Khuy trái
    ctx.fillStyle = '#f7af34'; // Vàng đồng
    ctx.beginPath();
    ctx.arc(60, eyeY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a3d13';
    ctx.beginPath();
    ctx.arc(60, eyeY, 11, 0, Math.PI * 2);
    ctx.fill();
    // 4 lỗ khuy
    ctx.fillStyle = '#161426';
    ctx.fillRect(57, eyeY - 4, 2, 2);
    ctx.fillRect(61, eyeY - 4, 2, 2);
    ctx.fillRect(57, eyeY + 2, 2, 2);
    ctx.fillRect(61, eyeY + 2, 2, 2);

    // Khuy phải
    ctx.fillStyle = '#f7af34';
    ctx.beginPath();
    ctx.arc(100, eyeY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a3d13';
    ctx.beginPath();
    ctx.arc(100, eyeY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#161426';
    ctx.fillRect(97, eyeY - 4, 2, 2);
    ctx.fillRect(101, eyeY - 4, 2, 2);
    ctx.fillRect(97, eyeY + 2, 2, 2);
    ctx.fillRect(101, eyeY + 2, 2, 2);

    // Miệng là đường chỉ may ziczac vụng về
    ctx.fillStyle = '#fedb5b';
    const mouthY = 100 + (breathe * 0.4);
    for (let x = 54; x <= 106; x += 6) {
      ctx.fillRect(x, mouthY + ((x / 6) % 2 === 0 ? 0 : 4), 5, 2);
    }

    // Các xúc tu sợi chỉ vươn dài ra dưới sàn
    ctx.fillStyle = '#a83b6f';
    ctx.fillRect(40, 130 + breathe, 16, 5);
    ctx.fillRect(104, 130 + breathe, 16, 5);
    ctx.fillRect(72, 134 + breathe, 16, 6);

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
 * Kho đăng ký toàn bộ Sprite dự phòng sẵn sàng phục vụ game engine
 */
export const FALLBACK_SPRITE_REGISTRY: Record<string, () => BlitSpriteSheet> = {
  hero_idle: createHeroIdleFallback,
  hero_run: createHeroRunFallback,
  hero_attack_1: createHeroAttackFallback,
  mob_chi_roi: createMobChiRoiFallback,
  mob_bui_mo: createMobBuiMoFallback,
  miniboss_vat_ao: createMiniBossVatAoFallback,
  boss_idle: createBossLangQuenFallback,
  item_truth_card: createItemTruthCardFallback,
};
