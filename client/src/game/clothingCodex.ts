/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BÁCH KHOA TOÀN THƯ CỔ PHỤC VIỆT NAM (VIETNAMESE TRADITIONAL CLOTHING CODEX)
 * - Sprite minh họa 64x96 theo quy chuẩn 32-bit Arcade Retro.
 * - Đổ bóng 3 tông (Sáng, Chính, Tối) với nguồn sáng Trên - Trái.
 * - Viền nâu/tím đậm 1px (không dùng đen #000000).
 * - Bố cục chia khối dọc có khoảng cách rõ ràng, vùng đọc nội dung cuộn được mượt mà.
 * - Hàm wrapText chống tràn mọi đoạn chữ, tự động cắt "..." khi quá số dòng.
 * - Chữ sắc nét với font bội số 8px/16px, bóng cứng 1px không nhòe blur, tọa độ số nguyên.
 * - Hỗ trợ nạp PNG từ manifest.json (codex_<id>.png), tự động chuyển sang sprite code 64x96 nếu thiếu file.
 */

import { draw9Slice, get9SliceCanvas } from '../art/nineSlice.ts';
import { drawCodexGarmentSprite } from '../art/codexSprites.ts';
import { AccessibilityManager } from '../engine/accessibility.ts';

export interface CodexItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'Lễ Phục' | 'Thường Phục' | 'Cung Đình' | 'Dân Gian';
  era: string;
  primaryColor: string;
  description: string;
  culturalSignificance: string;
  usageContext: string;
  pairingNotes: string;
  unlockHint: string;
  unlockedLevelId: string;
}

export const CLOTHING_CODEX_DATA: CodexItem[] = [
  {
    id: 'ao_ngu_than',
    name: 'Áo Ngũ Thân Tay Chẽn',
    subtitle: 'Thường phục chuẩn mực Cố đô Huế',
    category: 'Thường Phục',
    era: 'Thời Nguyễn (Thế kỷ XIX - XX)',
    primaryColor: '#4f3547',
    description:
      'Áo truyền thống gồm 5 thân vải: 4 thân ngoài tượng trưng tứ thân phụ mẫu (cha mẹ ruột và cha mẹ chồng/vợ), 1 thân con bên trong tượng trưng cho người mặc được chở che. Cổ đứng lập lĩnh kín đáo ôm khít cổ, tay chẽn gọn gàng, cài 5 khuy bên vạt phải. (Họa tiết gấm: CẦN THAM KHẢO HÌNH từ hiện vật bảo tàng Cố đô Huế).',
    culturalSignificance:
      'Định hình bởi chúa Nguyễn Phúc Khoát (1744) và hoàn thiện dưới vua Minh Mạng (1827-1837) nhằm thống nhất y phục toàn quốc. Năm hạt khuy tượng trưng cho Ngũ Thường (Nhân - Nghĩa - Lễ - Trí - Tín), răn dạy nếp sống khiêm cung mực thước.',
    usageContext:
      'Nghi lễ xưa, lễ cưới truyền thống, ngày Tết, nghi lễ trang trọng, lễ hội văn hóa di sản.',
    pairingNotes:
      'Mặc cùng quần lụa ống rộng; phối với khăn đóng; giày tây hoặc guốc mộc; tránh mặc với quần short gây mất phom dáng tôn nghiêm.',
    unlockHint: 'Khám phá ngay tại Cửa Ngọ Môn (Màn 1)',
    unlockedLevelId: 'c1_m1',
  },
  {
    id: 'ao_tac',
    name: 'Áo Tấc (Áo Tay Thụng)',
    subtitle: 'Lễ phục trang trọng thời Nguyễn',
    category: 'Lễ Phục',
    era: 'Triều Nguyễn (1802 - 1945)',
    primaryColor: '#1c3b5e',
    description:
      'Còn gọi là áo thụng hoặc áo lễ, biến thể tay thụng rộng dài của áo ngũ thân lập lĩnh. Ống tay áo may thụng dài buông quá bàn tay từ một tấc trở lên. Khi làm lễ hai tay chắp trước ngực tạo tư thế cung kính trang nghiêm. (Họa tiết dệt: CẦN THAM KHẢO HÌNH theo điển chế triều Nguyễn).',
    culturalSignificance:
      'Dành cho mọi tầng lớp từ vua quan đến thứ dân trong các dịp tế tự, hôn lễ, lễ tết cổ truyền. Tà áo thụng rủ xuống uy nghi, biểu trưng cho sự tôn ti trật tự và đạo hiếu truyền đời.',
    usageContext:
      'Tế tự đình miếu, đại lễ triều đình, lễ gia tiên, rước dâu cưới hỏi, lễ tết trang trọng.',
    pairingNotes:
      'Luôn mặc cùng khăn đóng đen và quần lụa trắng suông rộng; tay thụng cần giữ sạch sẽ, không xắn tay áo khi hành lễ.',
    unlockHint: 'Hoàn thành thử thách vượt Sông Hương (Màn 2)',
    unlockedLevelId: 'c1_m2',
  },
  {
    id: 'ao_nhat_binh',
    name: 'Áo Nhật Bình',
    subtitle: 'Lễ phục cung đình Hoàng Hậu & Công Chúa',
    category: 'Cung Đình',
    era: 'Triều Nguyễn (Khởi lập từ năm 1807)',
    primaryColor: '#a62424',
    description:
      'Lễ phục cao quý của phụ nữ hoàng tộc triều Nguyễn. Đặc trưng bởi cổ áo hình chữ nhật to bản ghép thêu trước ngực, vạt đối khâm cài dải ngọc cúc kim hoàn. Cổ tay áo thêu dải ngũ sắc (xanh, vàng, trắng, đỏ, lục) tượng trưng thuyết Ngũ Hành; gấu áo thêu họa tiết sóng nước thủy ba tam sơn vững bền.',
    culturalSignificance:
      'Màu sắc phẩm phục phân định nghiêm ngặt: Hoàng Hậu dùng màu vàng chính sắc, Hoàng Thái Hậu màu hoàng kim, Công Chúa màu đỏ thắm, cung tần màu tím hoặc lục. Hoa văn sóng nước thủy ba tam sơn biểu thị giang sơn bền vững.',
    usageContext:
      'Nghi lễ cung đình xưa, hoạt động tái hiện lễ hội truyền thống, phục dựng lịch sử tại Đại Nội Huế.',
    pairingNotes:
      'Mặc cùng xiêm váy thêu và quần lụa trắng; đầu đội vành khăn ngũ sắc hoặc trâm phượng hoàng kim.',
    unlockHint: 'Giải cứu di sản tại Điện Thái Hòa (Màn 3)',
    unlockedLevelId: 'c1_m3',
  },
  {
    id: 'ao_giao_linh',
    name: 'Áo Giao Lĩnh',
    subtitle: 'Cổ phục vạt chéo thời Lý - Trần - Lê',
    category: 'Lễ Phục',
    era: 'Thế kỷ XI - XVIII (Thời Lý, Trần, Lê)',
    primaryColor: '#1d5c42',
    description:
      'Áo có cổ vạt chéo (vạt trái đè lên vạt phải) buộc dây lụa bên hông, tay áo thụng hoặc ống rộng. Dạng thức trang phục cổ xưa tiêu biểu của Đại Việt trước khi áo ngũ thân lập lĩnh ra đời. (Họa tiết hoa văn: CẦN THAM KHẢO HÌNH từ tranh tượng cổ thời Lê).',
    culturalSignificance:
      'Gắn liền với thời kỳ văn hiến Đại Việt hưng thịnh, thể hiện sự hòa hợp âm dương đất trời và phong thái ung dung, khoáng đạt của bậc trí giả xưa.',
    usageContext:
      'Không gian phục dựng cổ trang Đại Việt, sân khấu tuồng chèo cổ, lễ hội tái hiện lịch sử tiền Nguyễn.',
    pairingNotes:
      'Đi kèm thường hoặc xiêm quây bên dưới; thắt đai lưng lụa thả dải mềm mại; tránh nhầm lẫn với y phục thời Nguyễn.',
    unlockHint: 'Tìm kiếm mảnh ghép tại Lăng Tự Đức (Màn 4)',
    unlockedLevelId: 'c1_m4',
  },
  {
    id: 'ao_tu_than',
    name: 'Áo Tứ Thân Kinh Bắc',
    subtitle: 'Dáng ngọc đồng bằng sông Hồng',
    category: 'Dân Gian',
    era: 'Thế kỷ XVII - XX (Bắc Bộ)',
    primaryColor: '#7a3d13',
    description:
      'Gồm 4 vạt (2 vạt sau may liền sống áo, 2 vạt trước buông thả để thắt mối trước bụng). Mặc ngoài yếm đào thắm và áo cánh mỏng, thắt lưng lụa xanh non buông dải, kết hợp cùng váy sồi đen. Trang phục dân gian dùng vải mộc nhuộm nâu, không thêu họa tiết cung đình.',
    culturalSignificance:
      'Biểu tượng của đức tính đảm đang, thùy mị của người phụ nữ nông thôn Bắc Bộ và làn điệu Dân ca Quan họ trữ tình đậm đà tình quê hương xứ sở.',
    usageContext:
      'Lễ hội mùa xuân truyền thống, hát canh Quan họ, hội làng vùng Kinh Bắc sông Cầu.',
    pairingNotes:
      'Phối cùng nón quai thao (nón ba tầm), khăn mỏ quạ và guốc mộc; không mang đặc trưng trang phục cung đình Huế.',
    unlockHint: 'Hoàn thành Màn Ráp Áo hoặc Đánh bại Bóng Lãng Quên',
    unlockedLevelId: 'c1_boss',
  },
  {
    id: 'ao_ba_ba',
    name: 'Áo Bà Ba Nam Bộ',
    subtitle: 'Hồn quê sông nước phương Nam',
    category: 'Dân Gian',
    era: 'Thế kỷ XIX - Hiện đại (Nam Bộ)',
    primaryColor: '#268c7e',
    description:
      'Áo cổ tròn hoặc cổ tim xẻ giữa, cài hàng khuy, vạt ngắn ngang hông xẻ hai bên tà thoải mái, có hai túi vuông phía trước vạt dưới. Thường may bằng vải ú, gấm hoặc lụa mềm màu trơn mộc mạc.',
    culturalSignificance:
      'Gắn liền với tính cách hào sảng, mộc mạc, chân tình của người dân vùng đồng bằng sông Cửu Long trong quá trình khai hoang mở cõi phương Nam.',
    usageContext:
      'Lao động thường nhật, đờn ca tài tử, du lịch miệt vườn sông nước, lễ hội dân gian Nam Bộ.',
    pairingNotes:
      'Mặc cùng quần lụa đen rộng, quàng khăn rằn caro, đi guốc mộc hoặc dép nhẹ; nét đẹp dân dã thuần khiết.',
    unlockHint: 'Mở khóa qua Phòng Thử Đồ Remix',
    unlockedLevelId: 'remix',
  },
];

/**
 * Hàm cắt dòng văn bản theo chiều rộng khung và số dòng tối đa (chống tràn viền)
 * Đo lường chính xác theo font được truyền vào (mặc định 8px "Pixelify Sans", monospace).
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 999,
  font = '8px "Pixelify Sans", monospace'
): string[] {
  const clean = (text || '').normalize('NFC').trim();
  if (!clean) return [];

  ctx.save();
  ctx.font = font;

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length > 0) {
    const lastIdx = lines.length - 1;
    let last = lines[lastIdx];
    const isOverMaxWidth = ctx.measureText(last).width > maxWidth;
    const isTruncatedEarly = words.length > 0 && lines.join(' ').replace(/\.\.\.$/, '') !== words.join(' ');

    if (isOverMaxWidth || (isTruncatedEarly && lines.length === maxLines)) {
      while (last.length > 0 && ctx.measureText(last + '...').width > maxWidth) {
        last = last.slice(0, -1).trim();
      }
      lines[lastIdx] = last ? last + '...' : '...';
    }
  }

  ctx.restore();
  return lines;
}

/**
 * Vẽ chữ pixel sắc nét (tọa độ số nguyên, font bội số 8px, bóng cứng 1px không nhòe)
 */
export function drawCrispPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font?: string;
    textColor?: string;
    shadowColor?: string;
    align?: CanvasTextAlign;
  } = {}
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.font = options.font || '8px "Pixelify Sans", monospace';
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = 'top';

  const ix = Math.floor(x);
  const iy = Math.floor(y);

  // Bóng cứng lệch 1px (không dùng blur)
  if (options.shadowColor) {
    ctx.fillStyle = options.shadowColor;
    ctx.fillText(text, ix + 1, iy + 1);
  }

  // Chữ chính
  ctx.fillStyle = options.textColor || '#f7edd7';
  ctx.fillText(text, ix, iy);
  ctx.restore();
}

export class ClothingCodexManager {
  private static instance: ClothingCodexManager;

  public selectedIndex = 0;
  public unlockedIds: Set<string> = new Set(['ao_ngu_than']);
  public isPixelArtViewerOpen = false;

  // Cuộn nội dung đọc chi tiết
  public scrollOffset = 0;
  public maxScroll = 0;

  private constructor() {
    this.loadUnlocked();
  }

  public static getInstance(): ClothingCodexManager {
    if (!ClothingCodexManager.instance) {
      ClothingCodexManager.instance = new ClothingCodexManager();
    }
    return ClothingCodexManager.instance;
  }

  public loadUnlocked(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('tam_phuc_ky_codex');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.unlockedIds = new Set(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc tiến trình codex:', e);
    }
  }

  public saveUnlocked(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('tam_phuc_ky_codex', JSON.stringify(Array.from(this.unlockedIds)));
      }
    } catch (e) {
      console.warn('Lỗi lưu tiến trình codex:', e);
    }
  }

  public syncWithProgress(unlockedStages: string[], isBossDefeated: boolean, isGarmentAssembled: boolean): void {
    this.unlockedIds.add('ao_ngu_than');
    if (unlockedStages.includes('c1_m2')) this.unlockedIds.add('ao_tac');
    if (unlockedStages.includes('c1_m3')) this.unlockedIds.add('ao_nhat_binh');
    if (unlockedStages.includes('c1_m4')) this.unlockedIds.add('ao_giao_linh');
    if (isBossDefeated || unlockedStages.includes('c1_boss') || isGarmentAssembled) {
      this.unlockedIds.add('ao_tu_than');
      this.unlockedIds.add('ao_ba_ba');
    }
    this.saveUnlocked();
  }

  public unlockItem(id: string): void {
    this.unlockedIds.add(id);
    this.saveUnlocked();
  }

  public isUnlocked(id: string): boolean {
    return this.unlockedIds.has(id);
  }

  public scrollUp(): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - 16);
  }

  public scrollDown(): void {
    this.scrollOffset = Math.min(this.maxScroll, this.scrollOffset + 16);
  }

  public selectNext(): void {
    this.selectedIndex = (this.selectedIndex + 1) % CLOTHING_CODEX_DATA.length;
    this.scrollOffset = 0;
  }

  public selectPrev(): void {
    this.selectedIndex = (this.selectedIndex - 1 + CLOTHING_CODEX_DATA.length) % CLOTHING_CODEX_DATA.length;
    this.scrollOffset = 0;
  }

  /**
   * Render toàn bộ Modal Bách Khoa Cổ Phục lên Canvas 480x270
   */
  public renderModal(ctx: CanvasRenderingContext2D, logicWidth = 480, logicHeight = 270, tick = 0): void {
    // 0. Nếu đang mở chế độ xem tranh Pixel-Art 32-bit trên phông xanh lá #00FF00
    if (this.isPixelArtViewerOpen) {
      this.drawPixelArtIllustration(ctx, logicWidth, logicHeight);
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 1. Lớp phủ tối mờ màn hình
    ctx.fillStyle = 'rgba(15, 13, 27, 0.94)';
    ctx.fillRect(0, 0, logicWidth, logicHeight);

    // 2. Khung 9-slice chính của Codex
    const panel = get9SliceCanvas();
    const mx = 16;
    const my = 8;
    const mw = logicWidth - 32; // 448
    const mh = logicHeight - 16; // 254
    draw9Slice(ctx, panel, mx, my, mw, mh, 8);

    // BỐ CỤC ĐẦU TRANG: Tách riêng tiêu đề chính và phụ, không chồng đè
    // Dòng 1: Tiêu đề chính (16px)
    drawCrispPixelText(
      ctx,
      'BÁCH KHOA CỔ PHỤC VIỆT NAM (CODEX)',
      logicWidth / 2,
      my + 6,
      {
        font: 'bold 16px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        shadowColor: '#161426',
        align: 'center',
      }
    );

    // Dòng 2: Dòng phụ thông tin phục hồi (8px)
    const unlockedCount = CLOTHING_CODEX_DATA.filter((i) => this.isUnlocked(i.id)).length;
    drawCrispPixelText(
      ctx,
      `Đã giải cứu & phục hồi: ${unlockedCount}/${CLOTHING_CODEX_DATA.length} Cổ phục Di sản`,
      logicWidth / 2,
      my + 22,
      {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#77e0b5',
        shadowColor: '#161426',
        align: 'center',
      }
    );

    // Nút đóng góc trên phải [ESC / C]
    drawCrispPixelText(
      ctx,
      '✕ [ESC/C]',
      mx + mw - 14,
      my + 6,
      {
        font: 'bold 8px "Pixelify Sans", monospace',
        textColor: '#ba5e1b',
        shadowColor: '#161426',
        align: 'right',
      }
    );

    // Đường gạch ngăn cách đầu trang
    ctx.strokeStyle = '#3b253b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + 10, my + 32);
    ctx.lineTo(mx + mw - 10, my + 32);
    ctx.stroke();

    // 3. CỘT TRÁI (DANH SÁCH 6 CỔ PHỤC)
    const listX = mx + 8;
    const listY = my + 36;
    const listW = 120;
    const listH = mh - 50; // 204

    ctx.fillStyle = '#261b2d';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = '#4f3547';
    ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

    CLOTHING_CODEX_DATA.forEach((item, idx) => {
      const isSel = idx === this.selectedIndex;
      const isUnl = this.isUnlocked(item.id);
      const iy = listY + 4 + idx * 33;

      ctx.fillStyle = isSel ? '#40bfa3' : (isUnl ? '#3b253b' : '#1c1726');
      ctx.fillRect(listX + 3, iy, listW - 6, 30);
      ctx.strokeStyle = isSel ? '#fedb5b' : '#4f3547';
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.strokeRect(listX + 3.5, iy + 0.5, listW - 7, 29);

      // Icon trạng thái
      drawCrispPixelText(ctx, isUnl ? '👘' : '🔒', listX + 6, iy + 5, {
        font: '8px "Pixelify Sans", monospace',
      });

      // Tên trang phục (cắt dòng nếu dài)
      const nameLines = wrapText(ctx, item.name, listW - 28, 1);
      drawCrispPixelText(ctx, nameLines[0] || item.name, listX + 22, iy + 4, {
        font: isSel ? 'bold 8px "Pixelify Sans", monospace' : '8px "Pixelify Sans", monospace',
        textColor: isSel ? '#161426' : (isUnl ? '#fedb5b' : '#8e7970'),
      });

      // Phân loại
      drawCrispPixelText(ctx, `[${item.category}]`, listX + 22, iy + 16, {
        font: '8px "Pixelify Sans", monospace',
        textColor: isSel ? '#161426' : (isUnl ? '#77e0b5' : '#63534b'),
      });
    });

    // 4. CỘT PHẢI (KHUNG TRƯNG BÀY SPRITE 64x96 & VÙNG ĐỌC NỘI DUNG CUỘN ĐƯỢC)
    const detailX = listX + listW + 8;
    const detailY = listY;
    const detailW = mw - listW - 24; // 296
    const detailH = listH;

    ctx.fillStyle = '#261b2d';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = '#4f3547';
    ctx.strokeRect(detailX + 0.5, detailY + 0.5, detailW - 1, detailH - 1);

    const curItem = CLOTHING_CODEX_DATA[this.selectedIndex];
    const isCurUnlocked = this.isUnlocked(curItem.id);
    const a11y = AccessibilityManager.getInstance();
    const reduceMotion = a11y.settings.reduceMotion;

    // 4.1 BÊN TRÁI CỘT PHẢI: KHUNG TRƯNG BÀY SPRITE 64x96 TRÊN GIÁ GỖ
    const showcaseX = detailX + 8;
    const showcaseY = detailY + 8;
    const showcaseW = 76;
    const showcaseH = 122;

    // Nền hộp trưng bày cổ vật
    ctx.fillStyle = '#1c1524';
    ctx.fillRect(showcaseX, showcaseY, showcaseW, showcaseH);
    ctx.strokeStyle = '#4f3547';
    ctx.strokeRect(showcaseX + 0.5, showcaseY + 0.5, showcaseW - 1, showcaseH - 1);

    // Vẽ Sprite 64x96 đặt trên giá gỗ có bóng và hào quang
    const garmentCenterX = showcaseX + Math.floor(showcaseW / 2);
    const garmentCenterY = showcaseY + 54;
    drawCodexGarmentSprite(ctx, curItem.id, garmentCenterX, garmentCenterY, isCurUnlocked, tick, reduceMotion);

    // Huy hiệu trạng thái dưới khung trưng bày
    ctx.fillStyle = isCurUnlocked ? 'rgba(64, 191, 163, 0.25)' : 'rgba(186, 94, 27, 0.25)';
    ctx.fillRect(showcaseX + 2, showcaseY + showcaseH + 4, showcaseW - 4, 15);
    ctx.strokeStyle = isCurUnlocked ? '#77e0b5' : '#ba5e1b';
    ctx.strokeRect(showcaseX + 2.5, showcaseY + showcaseH + 4.5, showcaseW - 5, 14);
    drawCrispPixelText(
      ctx,
      isCurUnlocked ? '✓ ĐÃ PHỤC HỒI' : '🔒 CHƯA MỞ',
      showcaseX + Math.floor(showcaseW / 2),
      showcaseY + showcaseH + 7,
      {
        font: 'bold 8px "Pixelify Sans", monospace',
        textColor: isCurUnlocked ? '#77e0b5' : '#ba5e1b',
        align: 'center',
      }
    );

    // Nút xem tranh 32-bit (#00FF00)
    ctx.fillStyle = '#1f3354';
    ctx.fillRect(showcaseX + 2, showcaseY + showcaseH + 24, showcaseW - 4, 16);
    ctx.strokeStyle = '#fedb5b';
    ctx.strokeRect(showcaseX + 2.5, showcaseY + showcaseH + 24.5, showcaseW - 5, 15);
    drawCrispPixelText(
      ctx,
      '🖼️ TRANH 32-BIT (V)',
      showcaseX + Math.floor(showcaseW / 2),
      showcaseY + showcaseH + 28,
      {
        font: 'bold 8px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        align: 'center',
      }
    );

    // 4.2 BÊN PHẢI CỘT PHẢI: VÙNG NỘI DUNG CUỘN ĐƯỢC (SCROLLABLE TEXT VIEWPORT)
    const scrollX = showcaseX + showcaseW + 8;
    const scrollY = detailY + 6;
    const scrollW = detailW - showcaseW - 20; // 204
    const scrollH = detailH - 12; // 192

    ctx.save();
    ctx.beginPath();
    ctx.rect(scrollX, scrollY, scrollW, scrollH);
    ctx.clip();

    ctx.translate(0, -this.scrollOffset);

    let curY = scrollY;
    const textWidth = scrollW - 12; // Khoảng cách chừa lề cuộn

    // A. TÊN TRANG PHỤC (16px)
    drawCrispPixelText(ctx, curItem.name.toUpperCase(), scrollX, curY, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
    });
    curY += 18;

    // B. PHỤ ĐỀ (cắt dòng chống tràn, 8px)
    const subLines = wrapText(ctx, curItem.subtitle, textWidth, 3);
    subLines.forEach((sl) => {
      drawCrispPixelText(ctx, sl, scrollX, curY, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
      });
      curY += 10;
    });
    curY += 2;

    // C. HUY HIỆU THỂ LOẠI & THỜI KỲ (Tự co giãn trong khung)
    ctx.fillStyle = '#3b253b';
    ctx.fillRect(scrollX, curY, 58, 14);
    ctx.strokeStyle = '#77e0b5';
    ctx.strokeRect(scrollX + 0.5, curY + 0.5, 57, 13);
    drawCrispPixelText(ctx, curItem.category, scrollX + 29, curY + 3, {
      font: 'bold 8px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      align: 'center',
    });

    const eraBoxX = scrollX + 62;
    const eraBoxW = textWidth - 62;
    const eraLines = wrapText(ctx, curItem.era, eraBoxW - 8, 1, '8px "Pixelify Sans", monospace');
    ctx.fillStyle = '#3b253b';
    ctx.fillRect(eraBoxX, curY, eraBoxW, 14);
    ctx.strokeStyle = '#f7af34';
    ctx.strokeRect(eraBoxX + 0.5, curY + 0.5, eraBoxW - 1, 13);
    drawCrispPixelText(ctx, eraLines[0] || curItem.era, eraBoxX + 4, curY + 3, {
      font: '8px "Pixelify Sans", monospace',
      textColor: '#f7edd7',
    });
    curY += 18;

    // D. GỢI Ý MỞ KHÓA
    if (!isCurUnlocked) {
      const hintLines = wrapText(ctx, `🔒 Gợi ý: ${curItem.unlockHint}`, textWidth, 2);
      hintLines.forEach((hl) => {
        drawCrispPixelText(ctx, hl, scrollX, curY, {
          font: '8px "Pixelify Sans", monospace',
          textColor: '#ba5e1b',
        });
        curY += 10;
      });
      curY += 2;
    }

    // Đường gạch ngang phân cách khối
    ctx.strokeStyle = '#3b253b';
    ctx.beginPath();
    ctx.moveTo(scrollX, curY + 2);
    ctx.lineTo(scrollX + textWidth, curY + 2);
    ctx.stroke();
    curY += 8;

    // E. KHỐI 1: ĐẶC TRƯNG HÌNH THÁI & KỸ THUẬT MAY
    drawCrispPixelText(ctx, '📖 ĐẶC TRƯNG HÌNH THÁI & KỸ THUẬT MAY:', scrollX, curY, {
      font: 'bold 8px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
    });
    curY += 12;

    const descLines = wrapText(ctx, curItem.description, textWidth, 999);
    descLines.forEach((dl) => {
      drawCrispPixelText(ctx, dl, scrollX, curY, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
      });
      curY += 10;
    });
    curY += 8; // Khoảng cách an toàn giữa 2 khối

    // F. KHỐI 2: Ý NGHĨA VĂN HÓA & ĐẠO LÝ (Tách riêng biệt, KHÔNG đè lên khối trên)
    drawCrispPixelText(ctx, '🏛️ Ý NGHĨA VĂN HÓA & ĐẠO LÝ:', scrollX, curY, {
      font: 'bold 8px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#161426',
    });
    curY += 12;

    const loreLines = wrapText(ctx, curItem.culturalSignificance, textWidth, 999);
    loreLines.forEach((ll) => {
      drawCrispPixelText(ctx, ll, scrollX, curY, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
      });
      curY += 10;
    });
    curY += 8;

    // G. KHỐI 3: BỐI CẢNH SỬ DỤNG & LƯU Ý PHỐI ĐỒ (TỪ KNOWLEDGE.JSON)
    if (curItem.usageContext || curItem.pairingNotes) {
      drawCrispPixelText(ctx, '🏷️ BỐI CẢNH SỬ DỤNG & PHỐI ĐỒ:', scrollX, curY, {
        font: 'bold 8px "Pixelify Sans", monospace',
        textColor: '#f7af34',
        shadowColor: '#161426',
      });
      curY += 12;

      if (curItem.usageContext) {
        const usageLines = wrapText(ctx, `• Bối cảnh: ${curItem.usageContext}`, textWidth, 999);
        usageLines.forEach((ul) => {
          drawCrispPixelText(ctx, ul, scrollX, curY, {
            font: '8px "Pixelify Sans", monospace',
            textColor: '#e8d2b7',
          });
          curY += 10;
        });
      }

      if (curItem.pairingNotes) {
        const pairLines = wrapText(ctx, `• Phối đồ: ${curItem.pairingNotes}`, textWidth, 999);
        pairLines.forEach((pl) => {
          drawCrispPixelText(ctx, pl, scrollX, curY, {
            font: '8px "Pixelify Sans", monospace',
            textColor: '#e8d2b7',
          });
          curY += 10;
        });
      }
      curY += 8;
    }

    // Ghi chú khảo cứu
    drawCrispPixelText(ctx, '📌 Tư liệu: Bảo tàng Cổ vật Cung đình Huế (Đã kiểm chứng)', scrollX, curY, {
      font: '8px "Pixelify Sans", monospace',
      textColor: '#947a6b',
    });
    curY += 14;

    // Tính toán độ cuộn tối đa
    const totalContentH = curY - scrollY + 10;
    this.maxScroll = Math.max(0, totalContentH - scrollH);

    ctx.restore();

    // 4.3 THANH CUỘN (SCROLLBAR TRACK & THUMB) NẰM TRONG KHUNG
    if (this.maxScroll > 0) {
      const scrollbarX = scrollX + scrollW - 3;
      ctx.fillStyle = '#1c1726';
      ctx.fillRect(scrollbarX, scrollY, 3, scrollH);

      const thumbH = Math.max(16, Math.floor((scrollH / totalContentH) * scrollH));
      const thumbY = scrollY + Math.floor((this.scrollOffset / this.maxScroll) * (scrollH - thumbH));
      ctx.fillStyle = '#77e0b5';
      ctx.fillRect(scrollbarX, thumbY, 3, thumbH);

      // Chỉ dẫn cuộn nằm gọn gàng trong khung phải
      drawCrispPixelText(ctx, '[▲/▼ Cuộn]', scrollX + scrollW - 46, scrollY + scrollH - 10, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
      });
    }

    // 5. THANH CHỈ DẪN PHÍM Ở ĐÁY (RÚT GỌN 1 DÒNG DUY NHẤT NẰM HẲN TRONG KHUNG)
    drawCrispPixelText(
      ctx,
      '[▲/▼] Cuộn đọc  •  [◀/▶] Đổi áo  •  [V] Tranh 32-bit  •  [ESC/C] Đóng',
      logicWidth / 2,
      my + mh - 12,
      {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#c7aa8d',
        shadowColor: '#161426',
        align: 'center',
      }
    );

    ctx.restore();
  }

  /**
   * Minh họa trang phục 32-bit Arcade hoàn chỉnh trên nền phẳng #00FF00
   * (Chroma Green isolation, không chữ, không số, không logo)
   */
  public drawPixelArtIllustration(ctx: CanvasRenderingContext2D, logicWidth = 480, logicHeight = 270): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Nền phẳng tuyệt đối #00FF00
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(0, 0, logicWidth, logicHeight);

    const cx = Math.floor(logicWidth / 2);
    const cy = Math.floor(logicHeight / 2) - 4;

    const curItem = CLOTHING_CODEX_DATA[this.selectedIndex];
    // Vẽ sprite 64x96 ở tỉ lệ 2x sắc nét giữa màn hình
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(2, 2);
    drawCodexGarmentSprite(ctx, curItem.id, 0, 0, true, 0, true);
    ctx.restore();

    ctx.restore();
  }
}
