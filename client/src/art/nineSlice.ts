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

  // Chuẩn hóa Unicode NFC theo Yêu cầu 4
  const cleanText = (text || '').normalize('NFC');

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.shadowBlur = 0; // Không dùng blur

  // 1. Bóng cứng lệch 1px dưới phải
  ctx.fillStyle = shadowColor;
  ctx.fillText(cleanText, ix + 1, iy + 1);

  // 2. Chữ chính
  ctx.fillStyle = textColor;
  ctx.fillText(cleanText, ix, iy);
  ctx.restore();
}

/**
 * Vẽ nút bấm trong canvas bằng khung 9-slice
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

  const label = (badgeIcon ? `${badgeIcon} ${text}` : text).normalize('NFC');
  drawPixelTextWithShadow(ctx, label, ix + iw / 2, iy + 5, {
    font: 'bold 9px "Pixelify Sans", monospace',
    textColor: isHighlighted ? '#fedb5b' : '#f7edd7',
    align: 'center',
    baseline: 'top',
  });
}

/**
 * Vẽ thanh Boss "LÃNG QUÊN" phía trên màn hình
 */
export function drawBossBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percentLangQuen: number, // 0 - 100
  bossName = 'BÓNG LÃNG QUÊN'
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iw = Math.floor(width);
  const ih = Math.floor(height);

  const panel = get9SliceCanvas();
  draw9Slice(ctx, panel, ix, iy, iw, ih, 6);

  drawPixelTextWithShadow(ctx, bossName.normalize('NFC'), ix + 8, iy + 4, {
    font: 'bold 16px "Pixelify Sans", monospace',
    textColor: '#fedb5b',
    shadowColor: '#161426',
    align: 'left',
    baseline: 'top',
  });

  drawPixelTextWithShadow(ctx, `LÃNG QUÊN: ${Math.round(percentLangQuen)}%`.normalize('NFC'), ix + iw - 8, iy + 4, {
    font: 'bold 16px "Pixelify Sans", monospace',
    textColor: '#e88827',
    shadowColor: '#161426',
    align: 'right',
    baseline: 'top',
  });

  const barX = ix + 8;
  const barY = iy + 22;
  const barW = iw - 16;
  const barH = ih - 26;

  ctx.fillStyle = '#161426';
  ctx.fillRect(barX, barY, barW, barH);

  const fillW = Math.max(0, Math.min(barW, Math.floor((barW * percentLangQuen) / 100)));
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    grad.addColorStop(0, '#87232e');
    grad.addColorStop(1, '#a83b6f');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fillW, barH);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(barX, barY, fillW, 2);
  }

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
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(hx + 1, hy, 8, 9);
      ctx.fillStyle = '#f29ec0';
      ctx.fillRect(hx + 2, hy + 2, 2, 2);
    } else {
      ctx.fillStyle = '#3b253b';
      ctx.fillRect(hx + 1, hy + 1, 8, 7);
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
    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.fillStyle = '#77e0b5';
    ctx.fillRect(barX, barY, fillW, 2);
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
    ctx.fillStyle = collected ? '#fedb5b' : '#261b2d';
    ctx.fillRect(px + 1, py + 1, 8, 8);
    if (collected) {
      ctx.fillStyle = '#e88827';
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
  cardHeight = 50
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const w = Math.floor(cardWidth);
  const h = Math.floor(cardHeight);

  ctx.save();

  // 1. Clip theo đúng khung của thẻ để không bao giờ vẽ lấn sang vùng của thẻ khác
  ctx.beginPath();
  ctx.rect(ix, iy, w, h);
  ctx.clip();

  // 2. Khung 9-slice riêng của thẻ
  const panel = get9SliceCanvas();
  draw9Slice(ctx, panel, ix, iy, w, h, 6);

  if (isSelected) {
    ctx.strokeStyle = '#fff39e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ix + 0.5, iy + 0.5, w - 1, h - 1);
  }

  // 3. Tiêu đề số thẻ
  const header = `[THẺ ${cardSlot}]`.normalize('NFC');
  drawPixelTextWithShadow(ctx, header, ix + w / 2, iy + 3, {
    font: 'bold 9px "Pixelify Sans", monospace',
    textColor: isSelected ? '#fedb5b' : '#c7aa8d',
    align: 'center',
    baseline: 'top',
  });

  // 4. Chia dòng nội dung (tối đa 3 dòng, cắt bằng '...' nếu dài)
  ctx.font = '8px "Pixelify Sans", monospace';
  const cleanText = (contentPreview || '').normalize('NFC');
  const words = cleanText.split(' ');
  const lines: string[] = [];
  let curLine = '';
  const maxTextW = w - 8;
  let wordIdx = 0;

  while (wordIdx < words.length && lines.length < 3) {
    const word = words[wordIdx];
    const testLine = curLine ? `${curLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxTextW) {
      curLine = testLine;
      wordIdx++;
    } else {
      if (curLine) {
        lines.push(curLine);
        curLine = '';
      } else {
        let truncated = word;
        while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxTextW) {
          truncated = truncated.slice(0, -1);
        }
        lines.push((truncated + '...').normalize('NFC'));
        wordIdx++;
      }
    }
  }

  if (curLine && lines.length < 3) {
    lines.push(curLine);
  }

  // Nếu còn từ chưa hiển thị hết ở dòng 3 -> thêm '...'
  if (wordIdx < words.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 0 && ctx.measureText(last + '...').width > maxTextW) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = (last + '...').normalize('NFC');
  }

  // 5. Vẽ tối đa 3 dòng chữ nằm gọn trong thẻ
  let textY = iy + 14;
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    drawPixelTextWithShadow(ctx, lines[i], ix + w / 2, textY, {
      font: '8px "Pixelify Sans", monospace',
      textColor: isSelected ? '#ffffff' : '#f7edd7',
      align: 'center',
      baseline: 'top',
    });
    textY += 10;
  }

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

  // Tên người nói
  drawPixelTextWithShadow(ctx, (speaker || '').normalize('NFC'), ix + 12, iy + 8, {
    font: 'bold 16px "Pixelify Sans", monospace',
    textColor: isBossSpeech ? '#bf363b' : '#fedb5b',
    shadowColor: '#161426',
    baseline: 'top',
  });

  // Chia dòng tự động, tối đa 3 dòng
  ctx.font = '10px "Pixelify Sans", monospace';
  const clean = (text || '').normalize('NFC');
  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const maxLineW = iw - 24;

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineW && i > 0) {
      lines.push(currentLine);
      currentLine = words[i];
      if (lines.length === 2) {
        const remaining = words.slice(i).join(' ');
        lines.push(remaining);
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }

  // Vẽ các dòng (tối đa 3 dòng)
  let lineY = iy + 28;
  for (const l of lines.slice(0, 3)) {
    drawPixelTextWithShadow(ctx, l, ix + 12, lineY, {
      font: '10px "Pixelify Sans", monospace',
      textColor: '#f7edd7',
      shadowColor: '#161426',
      baseline: 'top',
    });
    lineY += 14;
  }
}

/**
 * Bong bóng thoại của Boss trong vùng an toàn, không đè lên boss hay vật phẩm.
 * Chỉ DUY NHẤT một bong bóng cùng lúc.
 */
export function drawBossSpeechBubbleSafe(
  ctx: CanvasRenderingContext2D,
  speakerX: number,
  speakerY: number,
  text: string
): void {
  ctx.save();
  ctx.font = '10px "Pixelify Sans", monospace';

  const clean = (text || '').normalize('NFC');
  const words = clean.split(' ');
  const lines: string[] = [];
  let cur = '';
  const maxW = 200;

  for (let i = 0; i < words.length; i++) {
    const test = cur + (cur ? ' ' : '') + words[i];
    if (ctx.measureText(test).width > maxW && i > 0) {
      lines.push(cur);
      cur = words[i];
      if (lines.length === 2) {
        lines.push(words.slice(i).join(' '));
        break;
      }
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < 3) lines.push(cur);

  const displayLines = lines.slice(0, 3);
  let longestW = 80;
  for (const l of displayLines) {
    longestW = Math.max(longestW, ctx.measureText(l).width);
  }

  const boxW = Math.floor(longestW + 16);
  const boxH = Math.floor(displayLines.length * 13 + 12);

  let bx = Math.floor(speakerX - boxW / 2);
  bx = Math.max(12, Math.min(480 - boxW - 12, bx));
  let by = Math.floor(speakerY - boxH - 10);
  by = Math.max(10, Math.min(270 - boxH - 10, by));

  ctx.fillStyle = '#161426';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = '#bf363b';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

  ctx.fillStyle = '#161426';
  ctx.beginPath();
  ctx.moveTo(bx + boxW / 2 - 4, by + boxH);
  ctx.lineTo(bx + boxW / 2 + 4, by + boxH);
  ctx.lineTo(bx + boxW / 2, by + boxH + 4);
  ctx.closePath();
  ctx.fill();

  let textY = by + 6;
  for (const l of displayLines) {
    drawPixelTextWithShadow(ctx, l, bx + boxW / 2, textY, {
      font: '10px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
      baseline: 'top',
    });
    textY += 13;
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
