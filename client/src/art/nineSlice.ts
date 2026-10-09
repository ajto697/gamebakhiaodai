/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG RENDER KHUNG GIAO DIỆN 9-SLICE & HUD ARCADE CHUẨN PIXEL-ART
 * - Đảm bảo nạp font Pixelify Sans trước khi vẽ chữ: await ensureFontLoaded()
 * - Mọi chuỗi vẽ lên canvas gọi text.normalize('NFC') trước khi vẽ.
 * - Khay thẻ: mỗi thẻ có khung riêng, clip theo khung, chia dòng tối đa 3 dòng, cắt bằng '...'.
 * - Nút "TẠM DỪNG" và "HỎI NGHỆ NHÂN" vẽ bằng 9-slice trực tiếp trong canvas.
 * - Cỡ chữ bội số của 8 (8, 16, 24) hoặc tối thiểu 10px cho thoại.
 * - Tọa độ số nguyên (Math.floor). Dùng bóng cứng lệch 1px thay cho blur.
 */

import { createFallback9Slice } from './fallbackSprites.ts';

let cached9SliceCanvas: HTMLCanvasElement | null = null;
let fontLoadedPromise: Promise<boolean> | null = null;

/**
 * Đảm bảo nạp font 'Pixelify Sans' trước khi vẽ bất kỳ văn bản nào
 * Nếu font tải lỗi, dùng fallback monospace mà không vỡ bố cục
 */
export async function ensureFontLoaded(): Promise<boolean> {
  if (fontLoadedPromise) return fontLoadedPromise;

  fontLoadedPromise = (async () => {
    try {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
        await document.fonts.load("16px 'Pixelify Sans'");
        return true;
      }
    } catch (err) {
      console.warn('Font loading fallback to monospace:', err);
    }
    return false;
  })();

  return fontLoadedPromise;
}

export function get9SliceCanvas(): HTMLCanvasElement {
  if (!cached9SliceCanvas) {
    cached9SliceCanvas = createFallback9Slice();
  }
  return cached9SliceCanvas;
}

/**
 * Cắt và vẽ 9-slice lên Canvas theo tọa độ số nguyên
 */
export function draw9Slice(
  ctx: CanvasRenderingContext2D,
  sliceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  corner = 8
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iw = Math.floor(w);
  const ih = Math.floor(h);

  const sw = sliceCanvas.width;
  const sh = sliceCanvas.height;
  const c = corner;

  const midSW = sw - c * 2;
  const midSH = sh - c * 2;
  const midDW = Math.max(0, iw - c * 2);
  const midDH = Math.max(0, ih - c * 2);

  // 1. Góc trên-trái
  ctx.drawImage(sliceCanvas, 0, 0, c, c, ix, iy, c, c);
  // 2. Viền trên giữa
  if (midDW > 0) {
    ctx.drawImage(sliceCanvas, c, 0, midSW, c, ix + c, iy, midDW, c);
  }
  // 3. Góc trên-phải
  ctx.drawImage(sliceCanvas, sw - c, 0, c, c, ix + iw - c, iy, c, c);

  // 4. Viền giữa-trái
  if (midDH > 0) {
    ctx.drawImage(sliceCanvas, 0, c, c, midSH, ix, iy + c, c, midDH);
  }
  // 5. Phần trung tâm
  if (midDW > 0 && midDH > 0) {
    ctx.drawImage(sliceCanvas, c, c, midSW, midSH, ix + c, iy + c, midDW, midDH);
  }
  // 6. Viền giữa-phải
  if (midDH > 0) {
    ctx.drawImage(sliceCanvas, sw - c, c, c, midSH, ix + iw - c, iy + c, c, midDH);
  }

  // 7. Góc dưới-trái
  ctx.drawImage(sliceCanvas, 0, sh - c, c, c, ix, iy + ih - c, c, c);
  // 8. Viền dưới giữa
  if (midDW > 0) {
    ctx.drawImage(sliceCanvas, c, sh - c, midSW, c, ix + c, iy + ih - c, midDW, c);
  }
  // 9. Góc dưới-phải
  ctx.drawImage(sliceCanvas, sw - c, sh - c, c, c, ix + iw - c, iy + ih - c, c, c);
}

/**
 * wrapText: tự xuống dòng theo bề rộng và cắt bằng "..." khi quá số dòng cho phép
 * Đảm bảo các chữ trong khung không bao giờ tràn hoặc lẹm dòng.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 999
): string[] {
  const clean = (text || '').normalize('NFC').trim();
  if (!clean) return [];

  const words = clean.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let curLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = curLine ? `${curLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      curLine = testLine;
    } else {
      if (curLine) {
        lines.push(curLine);
        curLine = word;
      } else {
        // Một từ quá dài vượt maxWidth -> cắt từ
        lines.push(word);
        curLine = '';
      }
      if (lines.length === maxLines) {
        break;
      }
    }
  }

  if (curLine && lines.length < maxLines) {
    lines.push(curLine);
  }

  // Khi có nhiều dòng hơn maxLines hoặc còn từ chưa render, thêm dấu "..." vào dòng cuối
  if (lines.length >= maxLines && words.length > 0) {
    const lastIdx = maxLines - 1;
    let last = lines[lastIdx] || '';
    if (ctx.measureText(last + '...').width <= maxWidth) {
      lines[lastIdx] = last + '...';
    } else {
      while (last.length > 0 && ctx.measureText(last + '...').width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[lastIdx] = (last.trimEnd() || '') + '...';
    }
  }

  return lines;
}

/**
 * fitText: thu nhỏ cỡ chữ (bội số của 8, tối thiểu 8px logic) khi chữ vẫn dài hơn maxWidth
 */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize = 16,
  minSize = 8,
  fontFamily = '"Pixelify Sans", monospace',
  fontWeight = 'normal'
): { fontSize: number; font: string } {
  const clean = (text || '').normalize('NFC');
  let size = Math.max(minSize, Math.floor(initialSize / 8) * 8);
  const weightPrefix = fontWeight ? `${fontWeight} ` : '';

  while (size > minSize) {
    const fontStr = `${weightPrefix}${size}px ${fontFamily}`;
    ctx.font = fontStr;
    if (ctx.measureText(clean).width <= maxWidth) {
      return { fontSize: size, font: fontStr };
    }
    size -= 8;
  }

  const finalFont = `${weightPrefix}${minSize}px ${fontFamily}`;
  return { fontSize: minSize, font: finalFont };
}

/**
 * Vẽ chữ pixel với bóng cứng lệch 1px (thay vì blur làm mờ)
 * Tự động gọi text.normalize('NFC')
 */
export function drawPixelTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: {
    font?: string;
    textColor?: string;
    shadowColor?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  }
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const font = options?.font || '16px "Pixelify Sans", monospace';
  const textColor = options?.textColor || '#fedb5b';
  const shadowColor = options?.shadowColor || '#161426';
  const align = options?.align || 'left';
  const baseline = options?.baseline || 'top';

  const cleanText = (text || '').normalize('NFC');

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.shadowBlur = 0;

  // 1. Bóng cứng lệch 1px dưới phải
  ctx.fillStyle = shadowColor;
  ctx.fillText(cleanText, ix + 1, iy + 1);

  // 2. Chữ chính
  ctx.fillStyle = textColor;
  ctx.fillText(cleanText, ix, iy);
  ctx.restore();
}

/**
 * Vẽ nút bấm trong canvas bằng khung 9-slice:
 * Căn chữ vào giữa nút, lề trong 6px.
 */
export function drawCanvasButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  isHighlighted = false,
  badgeIcon = ''
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iw = Math.floor(w);
  const ih = Math.floor(h);

  const panel = get9SliceCanvas();
  draw9Slice(ctx, panel, ix, iy, iw, ih, 6);

  if (isHighlighted) {
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ix + 1, iy + 1, iw - 2, ih - 2);
  }

  // Thống nhất xóa mọi chữ "HỎI CỤ" -> "HỎI NGHỆ NHÂN (T)"
  let labelText = text.replace(/HỎI CỤ/g, 'HỎI NGHỆ NHÂN');
  const label = (badgeIcon ? `${badgeIcon} ${labelText}` : labelText).normalize('NFC');

  // Lề trong 6px (padding 6px) -> max width cho chữ
  const maxTextW = iw - 12;
  const { font } = fitText(ctx, label, maxTextW, 9, 8, '"Pixelify Sans", monospace', 'bold');

  drawPixelTextWithShadow(ctx, label, ix + iw / 2, iy + Math.floor((ih - 9) / 2), {
    font,
    textColor: isHighlighted ? '#fedb5b' : '#f7edd7',
    align: 'center',
    baseline: 'top',
  });
}

/**
 * Vẽ thanh Boss "LÃNG QUÊN" phía trên màn hình
 */
/**
 * Vẽ thanh Boss "LÃNG QUÊN" phía trên màn hình:
 * - Có phần mất chớp rồi mờ dần (Lag damage bar)
 * - 2 vạch mốc phân chia 3 pha tại 66% và 33%
 * - Nhãn trạng thái Khiên Hiểu Lầm
 */
export function drawBossBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percentLangQuen: number, // 0 - 100
  bossName = 'BÓNG LÃNG QUÊN',
  lagPercentLangQuen?: number,
  shieldActive = false,
  shieldCrackedTimer = 0
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iw = Math.floor(width);
  const ih = Math.max(28, Math.floor(height));

  const panel = get9SliceCanvas();
  draw9Slice(ctx, panel, ix, iy, iw, ih, 6);

  // Vùng 1: Tên Boss ở bên trái (max 38% chiều rộng, fitText & wrapText chống đè)
  const maxNameW = Math.floor(iw * 0.38);
  const cleanName = bossName.normalize('NFC');
  const { font: nameFont } = fitText(ctx, cleanName, maxNameW, 10, 8, '"Pixelify Sans", monospace', 'bold');
  const nameLines = wrapText(ctx, cleanName, maxNameW, 1);
  const nameToDraw = nameLines[0] || cleanName;

  drawPixelTextWithShadow(ctx, nameToDraw, ix + 8, iy + 4, {
    font: nameFont,
    textColor: '#fedb5b',
    shadowColor: '#161426',
    align: 'left',
    baseline: 'top',
  });

  // Vùng 2: Huy hiệu Khiên Hiểu Lầm ở giữa (max 28% chiều rộng)
  if (shieldActive) {
    drawPixelTextWithShadow(ctx, '🛡️ KHIÊN BẬT'.normalize('NFC'), ix + iw / 2, iy + 4, {
      font: 'bold 8.5px "Pixelify Sans", monospace',
      textColor: '#e88827',
      shadowColor: '#161426',
      align: 'center',
      baseline: 'top',
    });
  } else if (shieldCrackedTimer > 0) {
    const secLeft = Math.ceil(shieldCrackedTimer / 60);
    drawPixelTextWithShadow(ctx, `⚡ KHIÊN VỠ (${secLeft}s)`.normalize('NFC'), ix + iw / 2, iy + 4, {
      font: 'bold 8.5px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#161426',
      align: 'center',
      baseline: 'top',
    });
  }

  // Vùng 3: LÃNG QUÊN: xx% ở bên phải (max 34% chiều rộng, fitText)
  const maxRightW = Math.floor(iw * 0.34);
  const rightText = `LÃNG QUÊN: ${Math.round(percentLangQuen)}%`.normalize('NFC');
  const { font: rightFont } = fitText(ctx, rightText, maxRightW, 10, 8, '"Pixelify Sans", monospace', 'bold');

  drawPixelTextWithShadow(ctx, rightText, ix + iw - 8, iy + 4, {
    font: rightFont,
    textColor: percentLangQuen <= 33 ? '#bf363b' : percentLangQuen <= 66 ? '#e88827' : '#77e0b5',
    shadowColor: '#161426',
    align: 'right',
    baseline: 'top',
  });

  const barX = ix + 8;
  const barY = iy + 17;
  const barW = iw - 16;
  const barH = ih - 21;

  ctx.fillStyle = '#161426';
  ctx.fillRect(barX, barY, barW, barH);

  // 1. Phần sát thương vừa mất (Lag Damage Chunk) chớp rồi mờ dần
  const lagPercent = lagPercentLangQuen !== undefined ? Math.max(percentLangQuen, lagPercentLangQuen) : percentLangQuen;
  const lagW = Math.max(0, Math.min(barW, Math.floor((barW * lagPercent) / 100)));
  const fillW = Math.max(0, Math.min(barW, Math.floor((barW * percentLangQuen) / 100)));

  if (lagW > fillW) {
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(barX + fillW, barY, lagW - fillW, barH);
  }

  // 2. Máu / Lãng Quên thực tế
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    grad.addColorStop(0, '#87232e');
    grad.addColorStop(1, percentLangQuen <= 33 ? '#bf363b' : '#a83b6f');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fillW, barH);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(barX, barY, fillW, 2);
  }

  // 3. Hai vạch mốc phân chia 3 pha tại 66% và 33%
  const mark66 = Math.floor(barX + (barW * 66) / 100);
  const mark33 = Math.floor(barX + (barW * 33) / 100);

  ctx.fillStyle = '#fedb5b';
  ctx.fillRect(mark66, barY, 1, barH);
  ctx.fillRect(mark33, barY, 1, barH);

  ctx.strokeStyle = '#f7af34';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
}

/**
 * Vẽ HUD Người Chơi:
 * - Ký Ức (5 tim)
 * - Chỉ (vạch teal)
 * - Mảnh ghép (4/4)
 */
export function drawPlayerHUD(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kyUcHearts: number,
  maxHearts = 5,
  chiEnergy: number,
  piecesCollected: number,
  totalPieces = 4
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const hudW = 160;
  const hudH = 50;
  const panel = get9SliceCanvas();

  draw9Slice(ctx, panel, ix, iy, hudW, hudH, 6);

  // Ký Ức
  drawPixelTextWithShadow(ctx, 'KÝ ỨC:'.normalize('NFC'), ix + 8, iy + 6, {
    font: '10px "Pixelify Sans", monospace',
    textColor: '#f7edd7',
  });

  for (let i = 0; i < maxHearts; i++) {
    const hx = ix + 50 + i * 14;
    const hy = iy + 6;
    const isFull = i < kyUcHearts;

    ctx.fillStyle = '#161426';
    ctx.fillRect(hx, hy + 1, 10, 8);

    if (isFull) {
      // Viền vàng kim ngọc bội
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(hx, hy, 10, 8);
      // Thân ngọc ruby hồng thắm
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(hx + 1, hy + 1, 8, 6);
      // Ánh sáng pha lê trắng
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx + 2, hy + 1, 2, 2);
      ctx.fillStyle = '#f4a7b9';
      ctx.fillRect(hx + 5, hy + 4, 2, 2);
    } else {
      ctx.fillStyle = '#3b253b';
      ctx.fillRect(hx + 1, hy + 1, 8, 6);
      ctx.fillStyle = '#261b2d';
      ctx.fillRect(hx + 2, hy + 2, 6, 4);
    }
  }

  // Chỉ
  drawPixelTextWithShadow(ctx, 'CHỈ:'.normalize('NFC'), ix + 8, iy + 20, {
    font: '10px "Pixelify Sans", monospace',
    textColor: '#77e0b5',
  });

  const barX = ix + 50;
  const barY = iy + 21;
  const barW = 70;
  const barH = 7;

  ctx.fillStyle = '#161426';
  ctx.fillRect(barX, barY, barW, barH);

  const fillW = Math.max(0, Math.min(barW, Math.floor((barW * chiEnergy) / 100)));
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    grad.addColorStop(0, '#1c5e59');
    grad.addColorStop(0.5, '#40bfa3');
    grad.addColorStop(1, '#77e0b5');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX, barY, fillW, 1);
  }

  ctx.strokeStyle = '#268c7e';
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

  // Mảnh ghép
  drawPixelTextWithShadow(ctx, `MẢNH: ${piecesCollected}/${totalPieces}`.normalize('NFC'), ix + 8, iy + 34, {
    font: '10px "Pixelify Sans", monospace',
    textColor: '#f7af34',
  });

  for (let i = 0; i < totalPieces; i++) {
    const px = ix + 70 + i * 14;
    const py = iy + 33;
    const collected = i < piecesCollected;

    ctx.fillStyle = '#161426';
    ctx.fillRect(px, py, 10, 10);
    if (collected) {
      // Mảnh vải gấm hoàng gia thêu kim tuyến
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(px + 1, py + 1, 8, 8);
      ctx.fillStyle = '#e88827';
      ctx.fillRect(px + 2, py + 2, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 3, py + 3, 2, 2);
    } else {
      ctx.fillStyle = '#261b2d';
      ctx.fillRect(px + 1, py + 1, 8, 8);
      ctx.fillStyle = '#4f3547';
      ctx.fillRect(px + 3, py + 3, 4, 4);
    }
  }
}

/**
 * Vẽ Thẻ Sự Thật ở khay dưới (Yêu cầu 2):
 * - Mỗi thẻ có khung riêng
 * - Vẽ bằng clip theo khung của nó (không tràn sang thẻ khác)
 * - Tự động xuống dòng đúng bề rộng khung của thẻ (tối đa 3 dòng, cắt bằng '...' nếu dài)
 */
export function drawTruthCardSlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cardSlot: number | string,
  contentPreview: string,
  isSelected: boolean,
  cardWidth = 92,
  cardHeight = 50,
  isDimmed = false
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const w = Math.floor(cardWidth);
  const h = Math.floor(cardHeight);

  ctx.save();

  // 1. Nếu là thẻ đang chọn: vẽ nhãn CHỌN phía trên khay thẻ, không đè lên viền trên của thẻ
  if (isSelected && !isDimmed) {
    drawPixelTextWithShadow(ctx, '▲ CHỌN', ix + w / 2, iy - 11, {
      font: 'bold 8px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
      align: 'center',
      baseline: 'top',
    });
  }

  // 2. Clip theo khung của thẻ
  ctx.beginPath();
  ctx.rect(ix, iy, w, h);
  ctx.clip();

  if (isDimmed) {
    ctx.globalAlpha = 0.45;
  }

  // 3. Khung 9-slice riêng của thẻ
  const panel = get9SliceCanvas();
  draw9Slice(ctx, panel, ix, iy, w, h, 6);

  if (isSelected && !isDimmed) {
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 2;
    ctx.strokeRect(ix + 0.5, iy + 0.5, w - 1, h - 1);
  }

  // 4. Tiêu đề số thẻ
  const header = (isDimmed ? `[THẺ ${cardSlot} • HỒI...]` : `[THẺ ${cardSlot}]`).normalize('NFC');
  drawPixelTextWithShadow(ctx, header, ix + w / 2, iy + 3, {
    font: 'bold 8px "Pixelify Sans", monospace',
    textColor: isDimmed ? '#8e7970' : (isSelected ? '#fedb5b' : '#c7aa8d'),
    align: 'center',
    baseline: 'top',
  });

  // 5. Chia dòng dùng wrapText & fitText (tối đa 4 dòng, không lẹm dòng cuối)
  ctx.font = '7.5px "Pixelify Sans", monospace';
  const cleanText = (contentPreview || '').normalize('NFC');
  const maxTextW = w - 8;
  const lines = wrapText(ctx, cleanText, maxTextW, 4);

  // 6. Vẽ các dòng chữ nằm gọn trong thẻ (tối đa 4 dòng chữ gọn gàng)
  let textY = iy + 13;
  for (let i = 0; i < lines.length; i++) {
    drawPixelTextWithShadow(ctx, lines[i], ix + w / 2, textY, {
      font: '7.5px "Pixelify Sans", monospace',
      textColor: isSelected ? '#ffffff' : '#f7edd7',
      align: 'center',
      baseline: 'top',
    });
    textY += 8.5;
  }

  ctx.restore();

  // 7. Nếu thẻ đang chọn: vẽ khung đọc trọn vẹn nổi phía trên khay thẻ (không đè nhãn CHỌN)
  if (isSelected && !isDimmed) {
    ctx.save();
    const popupW = 156;
    const popupH = 34;
    // Căn giữa so với thẻ, giới hạn không tràn lề canvas 480
    const popupX = Math.max(8, Math.min(480 - popupW - 8, ix + (w - popupW) / 2));
    const popupY = iy - 48; // Nằm phía trên nhãn CHỌN (iy - 11)

    ctx.fillStyle = 'rgba(22, 20, 38, 0.94)';
    ctx.fillRect(popupX, popupY, popupW, popupH);
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1;
    ctx.strokeRect(popupX + 0.5, popupY + 0.5, popupW - 1, popupH - 1);

    drawPixelTextWithShadow(ctx, `📖 THẺ ${cardSlot} (ĐẦY ĐỦ):`, popupX + 6, popupY + 3, {
      font: 'bold 8px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      baseline: 'top',
    });

    // Chia dòng cho khung đọc đầy đủ
    ctx.font = '7.5px "Pixelify Sans", monospace';
    const popupLines = wrapText(ctx, cleanText, popupW - 12, 2);

    let pY = popupY + 13;
    for (let pIdx = 0; pIdx < popupLines.length; pIdx++) {
      drawPixelTextWithShadow(ctx, popupLines[pIdx], popupX + 6, pY, {
        font: '7.5px "Pixelify Sans", monospace',
        textColor: '#ffffff',
        baseline: 'top',
      });
      pY += 9;
    }
    ctx.restore();
  }
}

/**
 * Vẽ Khiên Hiểu Lầm lục giác phát sáng nhấp nháy cho Mini-Boss (Ảnh A)
 */
export function drawHexagonShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius = 38,
  tick = 0,
  label = 'KHIÊN HIỂU LẦM',
  isCracked = false
): void {
  ctx.save();
  const pulse = (Math.sin(tick * 0.12) + 1) / 2;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const hx = cx + radius * Math.cos(angle);
    const hy = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();

  if (isCracked) {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#77e0b5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = `rgba(168, 59, 111, ${0.18 + pulse * 0.16})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(254, 219, 91, ${0.65 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vòng lục giác bên trong
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = cx + (radius * 0.65) * Math.cos(angle);
      const hy = cy + (radius * 0.65) * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(247, 175, 52, ${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Nhãn KHIÊN HIỂU LẦM
  const badgeY = cy - radius - 10;
  ctx.fillStyle = 'rgba(22, 20, 38, 0.9)';
  const labelW = 86;
  ctx.fillRect(cx - labelW / 2, badgeY - 5, labelW, 13);
  ctx.strokeStyle = '#fedb5b';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - labelW / 2 + 0.5, badgeY - 4.5, labelW - 1, 12);

  drawPixelTextWithShadow(ctx, `🛡️ ${label}`.normalize('NFC'), cx, badgeY - 3, {
    font: 'bold 8px "Pixelify Sans", monospace',
    textColor: '#fedb5b',
    shadowColor: '#161426',
    align: 'center',
    baseline: 'top',
  });

  ctx.restore();
}

/**
 * Vẽ Khiên Mạng Nhện Hiểu Lầm cho Boss Cuối (Ảnh B)
 */
export function drawSpiderWebShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius = 62,
  tick = 0,
  label = 'KHIÊN HIỂU LẦM',
  isCracked = false
): void {
  ctx.save();
  const pulse = (Math.sin(tick * 0.1) + 1) / 2;

  const numSpokes = 8;
  const numRings = 4;

  ctx.strokeStyle = isCracked ? '#77e0b5' : `rgba(254, 219, 91, ${0.6 + pulse * 0.4})`;
  ctx.lineWidth = 1.5;
  if (isCracked) ctx.setLineDash([4, 4]);

  // Vẽ các nan tỏa ra từ tâm
  for (let i = 0; i < numSpokes; i++) {
    const angle = (Math.PI * 2 / numSpokes) * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.stroke();
  }

  // Vẽ các vòng đa giác mạng nhện đồng tâm
  for (let r = 1; r <= numRings; r++) {
    const curR = (radius / numRings) * r;
    ctx.beginPath();
    for (let i = 0; i <= numSpokes; i++) {
      const angle = (Math.PI * 2 / numSpokes) * i;
      const x = cx + curR * Math.cos(angle);
      const y = cy + curR * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Nền mờ mạng nhện
  if (!isCracked) {
    ctx.fillStyle = `rgba(255, 243, 158, ${0.08 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.setLineDash([]);

  // Nhãn KHIÊN HIỂU LẦM
  const badgeY = cy - radius - 10;
  ctx.fillStyle = 'rgba(22, 20, 38, 0.92)';
  const labelW = 92;
  ctx.fillRect(cx - labelW / 2, badgeY - 5, labelW, 14);
  ctx.strokeStyle = isCracked ? '#77e0b5' : '#fedb5b';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - labelW / 2 + 0.5, badgeY - 4.5, labelW - 1, 13);

  drawPixelTextWithShadow(ctx, `🕸️ ${label}`.normalize('NFC'), cx, badgeY - 3, {
    font: 'bold 8px "Pixelify Sans", monospace',
    textColor: isCracked ? '#77e0b5' : '#fedb5b',
    shadowColor: '#161426',
    align: 'center',
    baseline: 'top',
  });

  ctx.restore();
}

/**
 * Vẽ Bong bóng đối thoại nghệ nhân / nhân vật
 * Tối đa 3 dòng, cỡ chữ tối thiểu 10px logic
 */
export function drawDialogueBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  speaker: string,
  text: string,
  isBossSpeech = false
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iw = Math.floor(w);
  const ih = Math.floor(h);

  const panel = get9SliceCanvas();
  draw9Slice(ctx, panel, ix, iy, iw, ih, 8);

  // Thống nhất tên nghệ nhân (xóa 'Cụ Nghệ Nhân' -> 'Nghệ Nhân May Đo:')
  let cleanSpeaker = (speaker || '').replace(/Cụ Nghệ Nhân/g, 'Nghệ Nhân May Đo').normalize('NFC');

  drawPixelTextWithShadow(ctx, cleanSpeaker, ix + 12, iy + 8, {
    font: 'bold 12px "Pixelify Sans", monospace',
    textColor: isBossSpeech ? '#bf363b' : '#fedb5b',
    shadowColor: '#161426',
    baseline: 'top',
  });

  // Chia dòng tự động bằng wrapText (tối đa 4 dòng)
  ctx.font = '9px "Pixelify Sans", monospace';
  const clean = (text || '').normalize('NFC');
  const lines = wrapText(ctx, clean, iw - 24, 4);

  let lineY = iy + 25;
  for (const l of lines) {
    drawPixelTextWithShadow(ctx, l, ix + 12, lineY, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#f7edd7',
      shadowColor: '#161426',
      baseline: 'top',
    });
    lineY += 12;
  }
}

/**
 * Bong bóng thoại của Boss trong vùng an toàn:
 * - Đặt DƯỚI thanh Boss trên cùng (y >= 40)
 * - LỆCH khỏi mặt Boss (sang bên trái, x <= 325)
 * - Đầy đủ trong vùng an toàn màn hình (cách mép 8px)
 */
export function drawBossSpeechBubbleSafe(
  ctx: CanvasRenderingContext2D,
  speakerX: number,
  speakerY: number,
  text: string
): void {
  ctx.save();
  ctx.font = 'bold 9px "Pixelify Sans", monospace';

  const clean = (text || '').normalize('NFC');
  const maxW = 185;
  const lines = wrapText(ctx, clean, maxW, 3);
  if (lines.length === 0) {
    ctx.restore();
    return;
  }

  let longestW = 80;
  for (const l of lines) {
    longestW = Math.max(longestW, ctx.measureText(l).width);
  }

  const boxW = Math.floor(longestW + 16);
  const boxH = Math.floor(lines.length * 12 + 12);

  // Đặt lệch hẳn sang bên trái mặt Boss (Boss ở x=350, mặt ở 340-365)
  // và đặt DƯỚI thanh Boss trên cùng (thanh Boss kết thúc ở y=36..38 -> by >= 42)
  let bx = Math.floor(speakerX - boxW / 2);
  bx = Math.max(8, Math.min(310, bx)); // Không vượt quá x=310 để không chạm mặt Boss
  let by = Math.max(42, Math.min(170 - boxH, Math.floor(speakerY - boxH - 12)));

  ctx.fillStyle = '#161426';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = '#bf363b';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

  // Đuôi chỉ về phía Boss
  const tailBaseX = Math.min(bx + boxW - 10, bx + boxW / 2 + 25);
  ctx.fillStyle = '#161426';
  ctx.beginPath();
  ctx.moveTo(tailBaseX - 4, by + boxH);
  ctx.lineTo(tailBaseX + 4, by + boxH);
  ctx.lineTo(tailBaseX + 6, by + boxH + 5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#bf363b';
  ctx.beginPath();
  ctx.moveTo(tailBaseX - 4, by + boxH);
  ctx.lineTo(tailBaseX + 6, by + boxH + 5);
  ctx.lineTo(tailBaseX + 4, by + boxH);
  ctx.stroke();

  let textY = by + 6;
  for (const l of lines) {
    drawPixelTextWithShadow(ctx, l, bx + boxW / 2, textY, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
      baseline: 'top',
    });
    textY += 12;
  }

  ctx.restore();
}

/**
 * Bộ xếp chỗ bong bóng thoại dùng chung (Common Bubble Layout Manager):
 * - Tối đa 2 bong bóng cùng lúc
 * - Nằm hoàn toàn trong vùng an toàn (cách mép 8px, dưới thanh trên cùng, trên HUD đáy)
 * - Đặt trên đầu người nói, không đè lên nhân vật, mini-boss, boss hay HUD
 * - Nếu thiếu chỗ: dịch sang trái/phải hoặc ẩn bong bóng ít quan trọng hơn (ưu tiên: quan niệm sai của boss/mini-boss)
 */
export interface BubbleRequest {
  id: string;
  speakerScreenX: number;
  speakerScreenY: number; // Đỉnh đầu người nói
  text: string;
  isBossOrMiniBoss?: boolean;
  priority?: number; // 10 = Boss, 9 = MiniBoss, 1 = Quái thường
}

export interface LaidOutBubble {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  tailX: number;
  tailY: number;
  isBoss: boolean;
}

export function layoutSpeechBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: BubbleRequest[],
  screenW = 480,
  _screenH = 270
): LaidOutBubble[] {
  // 1. Sắp xếp theo độ ưu tiên giảm dần, lấy tối đa 2 bong bóng
  const valid = bubbles
    .filter((b) => b.text && b.text.trim().length > 0)
    .sort((a, b) => {
      const pA = a.priority ?? (a.isBossOrMiniBoss ? 10 : 1);
      const pB = b.priority ?? (b.isBossOrMiniBoss ? 10 : 1);
      return pB - pA;
    });

  const topTwo = valid.slice(0, 2);
  const result: LaidOutBubble[] = [];

  for (const b of topTwo) {
    const isBoss = Boolean(b.isBossOrMiniBoss);
    ctx.font = isBoss ? 'bold 8.5px "Pixelify Sans", monospace' : '8px "Pixelify Sans", monospace';
    const lines = wrapText(ctx, b.text, 175, 3);
    if (lines.length === 0) continue;

    let maxLineW = 60;
    for (const l of lines) {
      maxLineW = Math.max(maxLineW, ctx.measureText(l).width);
    }
    const w = Math.min(190, Math.floor(maxLineW + 16));
    const h = Math.floor(lines.length * 11 + 10);

    // Mặc định: đặt phía trên đầu người nói
    let bx = Math.floor(b.speakerScreenX - w / 2);
    let by = Math.floor(b.speakerScreenY - h - 8);

    // Giới hạn vùng an toàn: cách mép màn hình 8px, dưới thanh boss (>= 38), trên khay đáy (<= 204)
    bx = Math.max(8, Math.min(screenW - w - 8, bx));
    by = Math.max(38, Math.min(204 - h, by));

    // Kiểm tra đè với bong bóng trước đó
    if (result.length > 0) {
      const prev = result[0];
      const overlap = !(bx + w + 4 < prev.x || bx > prev.x + prev.w + 4 || by + h < prev.y || by > prev.y + prev.h);
      if (overlap) {
        // Dịch sang trái hoặc phải
        if (prev.x + prev.w + w + 8 <= screenW - 8) {
          bx = prev.x + prev.w + 8;
        } else if (prev.x - w - 8 >= 8) {
          bx = prev.x - w - 8;
        } else {
          // Không còn chỗ -> ẩn bong bóng này
          continue;
        }
      }
    }

    const tailX = Math.max(bx + 8, Math.min(bx + w - 8, Math.floor(b.speakerScreenX)));
    const tailY = by + h;

    result.push({
      id: b.id,
      x: bx,
      y: by,
      w,
      h,
      lines,
      tailX,
      tailY,
      isBoss,
    });
  }

  return result;
}

export function drawLaidOutBubble(ctx: CanvasRenderingContext2D, b: LaidOutBubble): void {
  ctx.save();
  ctx.fillStyle = b.isBoss ? '#1a1024' : '#161426';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = b.isBoss ? '#bf363b' : '#77e0b5';
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

  // Đuôi bong bóng
  ctx.fillStyle = b.isBoss ? '#1a1024' : '#161426';
  ctx.beginPath();
  ctx.moveTo(b.tailX - 4, b.y + b.h);
  ctx.lineTo(b.tailX + 4, b.y + b.h);
  ctx.lineTo(b.tailX, b.y + b.h + 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = b.isBoss ? '#bf363b' : '#77e0b5';
  ctx.beginPath();
  ctx.moveTo(b.tailX - 4, b.y + b.h);
  ctx.lineTo(b.tailX, b.y + b.h + 4);
  ctx.lineTo(b.tailX + 4, b.y + b.h);
  ctx.stroke();

  let textY = b.y + 5;
  for (const l of b.lines) {
    drawPixelTextWithShadow(ctx, l, b.x + b.w / 2, textY, {
      font: b.isBoss ? 'bold 8.5px "Pixelify Sans", monospace' : '8px "Pixelify Sans", monospace',
      textColor: b.isBoss ? '#fedb5b' : '#f7edd7',
      shadowColor: '#05040a',
      align: 'center',
      baseline: 'top',
    });
    textY += 11;
  }
  ctx.restore();
}

/**
 * Chữ chiêu thức nổi kèm bóng cứng 1px
 * Kiểm thử bắt buộc: "BÓNG LÃNG QUÊN" và "Áo xưa lỗi thời rồi!"
 */
export function drawActionCallout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  scale = 1.0,
  _glowColor = '#f7af34'
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const clean = (text || '').normalize('NFC');

  ctx.save();
  ctx.translate(ix, iy);
  if (scale !== 1.0) {
    ctx.scale(scale, scale);
  }

  ctx.font = 'bold 16px "Pixelify Sans", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;

  // Bóng cứng lệch 1px góc dưới phải
  ctx.fillStyle = '#161426';
  ctx.fillText(clean, 1, 1);
  ctx.fillText(clean, 2, 2);

  // Chữ vàng chính giữa
  ctx.fillStyle = '#fedb5b';
  ctx.fillText(clean, 0, 0);

  // Vệt sáng trắng ở đỉnh
  ctx.fillStyle = '#ffffff';
  ctx.fillText(clean, 0, -1);

  ctx.restore();
}
