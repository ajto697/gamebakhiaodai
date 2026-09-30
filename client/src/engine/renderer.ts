/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ RENDER ĐỒ HỌA CHUẨN 480x270 & CHẾ ĐỘ DEBUG
 * Kích thước logic: 480x270 (16:9).
 * Phóng đại số nguyên, pixelated, imageSmoothingEnabled = false.
 * Chế độ debug (phím D): hiện khung va chạm, điểm neo, tên tài sản, cảnh báo thiếu.
 */

import { AssetManager } from '../assets/loader.ts';
import {
  FALLBACK_SPRITE_REGISTRY,
  createHeroIdleFallback,
} from '../art/fallbackSprites.ts';
import {
  drawBossBar,
  drawPlayerHUD,
  drawTruthCardSlot,
  drawDialogueBox,
  drawActionCallout,
} from '../art/nineSlice.ts';

export class GameRenderer {
  public static LOGIC_WIDTH = 480;
  public static LOGIC_HEIGHT = 270;
  public static isDebugMode = false;

  public static get debugMode(): boolean {
    return GameRenderer.isDebugMode;
  }

  public static set debugMode(val: boolean) {
    GameRenderer.isDebugMode = val;
  }

  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public assetManager: AssetManager;

  public get debugMode(): boolean {
    return GameRenderer.isDebugMode;
  }

  public set debugMode(val: boolean) {
    GameRenderer.isDebugMode = val;
  }

  // Animation ticks
  public tick = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = GameRenderer.LOGIC_WIDTH;
    this.canvas.height = GameRenderer.LOGIC_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.assetManager = AssetManager.getInstance();

    // Lắng nghe phím 'F2' để bật/tắt Debug (bỏ hoàn toàn phím D)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        GameRenderer.isDebugMode = !GameRenderer.isDebugMode;
        console.log(`[Debug Mode]: ${GameRenderer.isDebugMode ? 'BẬT' : 'TẮT'}`);
      }
    });
  }

  /**
   * Cập nhật kích thước hiển thị theo tỉ lệ số nguyên (Integer Scaling)
   */
  public resizeToContainer(containerWidth: number, containerHeight: number): number {
    const scaleX = Math.floor(containerWidth / GameRenderer.LOGIC_WIDTH);
    const scaleY = Math.floor(containerHeight / GameRenderer.LOGIC_HEIGHT);
    const scale = Math.max(1, Math.min(scaleX, scaleY));

    this.canvas.style.width = `${GameRenderer.LOGIC_WIDTH * scale}px`;
    this.canvas.style.height = `${GameRenderer.LOGIC_HEIGHT * scale}px`;
    this.canvas.style.imageRendering = 'pixelated';

    return scale;
  }

  /**
   * Vẽ Nền Parallax Hoàng Hôn Xứ Huế (4 lớp chiều sâu)
   */
  public drawParallaxHue(scrollX = 0): void {
    const ctx = this.ctx;
    const w = GameRenderer.LOGIC_WIDTH;
    const h = GameRenderer.LOGIC_HEIGHT;

    // 1. Lớp Trời Hoàng Hôn (Tím than -> Cam đất nung -> Vàng lưu ly)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
    skyGrad.addColorStop(0, '#15213b'); // Lam đêm
    skyGrad.addColorStop(0.4, '#541924'); // Đỏ tím rượu
    skyGrad.addColorStop(0.7, '#ba5e1b'); // Cam đất
    skyGrad.addColorStop(1, '#f7af34'); // Vàng lưu ly
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 160);

    // Vầng trăng khuyết mờ ảo
    ctx.fillStyle = '#fff39e';
    ctx.beginPath();
    ctx.arc(380, 45, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15213b';
    ctx.beginPath();
    ctx.arc(385, 42, 12, 0, Math.PI * 2);
    ctx.fill();

    // 2. Lớp Dãy Mái Ngói & Tháp Phước Duyên Xa (Tốc độ 0.2x)
    const farX = -(scrollX * 0.2) % 180;
    ctx.fillStyle = '#261b2d'; // Silhouette tím trầm
    for (let x = farX - 180; x < w + 180; x += 140) {
      // Mái ngói cong cung đình
      ctx.beginPath();
      ctx.moveTo(x, 150);
      ctx.lineTo(x + 20, 130);
      ctx.lineTo(x + 60, 130);
      ctx.lineTo(x + 80, 150);
      ctx.fill();
      // Đỉnh tháp Chùa Thiên Mụ xa xa
      ctx.fillRect(x + 100, 105, 14, 45);
      ctx.fillRect(x + 103, 90, 8, 15);
      ctx.fillRect(x + 106, 80, 2, 10);
    }

    // 3. Lớp Sông Hương Sóng Nước & Rặng Liễu (Tốc độ 0.4x)
    const riverY = 150;
    const riverGrad = ctx.createLinearGradient(0, riverY, 0, 200);
    riverGrad.addColorStop(0, '#1f3354');
    riverGrad.addColorStop(1, '#15213b');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, riverY, w, 50);

    // Gợn sóng lấp lánh phản chiếu hoàng hôn
    ctx.fillStyle = '#f7af34';
    const waveShift = Math.floor(this.tick / 8) % 4;
    for (let i = 0; i < 20; i++) {
      const wx = (i * 28 + waveShift * 4) % w;
      const wy = riverY + 8 + (i % 5) * 7;
      ctx.fillRect(wx, wy, 8, 1);
    }

    // 4. Lớp Mặt Đất Đá Cổ Thành & Bệ Nhảy (Tốc độ 1.0x)
    const groundY = 200;
    ctx.fillStyle = '#161426'; // Nền đất sâu
    ctx.fillRect(0, groundY, w, h - groundY);

    // Mặt gạch lát hoa cương cổ
    ctx.fillStyle = '#3b253b';
    ctx.fillRect(0, groundY, w, 6);
    ctx.fillStyle = '#4f3547';
    ctx.fillRect(0, groundY + 1, w, 2);

    // Mạch đá hoa văn
    ctx.fillStyle = '#261b2d';
    for (let x = 0; x < w; x += 32) {
      ctx.fillRect(x, groundY + 6, 1, 14);
      ctx.fillRect(x + 16, groundY + 20, 1, 14);
    }

    // Bụi cỏ xanh non triền đê
    ctx.fillStyle = '#1c5e59';
    for (let x = 12; x < w; x += 48) {
      ctx.fillRect(x, groundY - 3, 3, 3);
      ctx.fillRect(x + 2, groundY - 5, 2, 2);
    }
  }

  /**
   * Vẽ Sprite kèm frame animation, lật mặt (flip), và điểm neo (anchor)
   */
  public drawSprite(
    spriteId: string,
    worldX: number,
    worldY: number,
    flipX = false,
    frameIndex = 0
  ): void {
    let sprite = this.assetManager.getSprite(spriteId);
    if (!sprite || !sprite.frames || sprite.frames.length === 0) {
      const fallbackCreator = FALLBACK_SPRITE_REGISTRY[spriteId];
      sprite = fallbackCreator ? fallbackCreator() : createHeroIdleFallback();
    }
    if (!sprite || !sprite.frames || sprite.frames.length === 0) return;

    const frame = sprite.frames[frameIndex % sprite.frames.length];
    const anchor = this.assetManager.getAnchor(spriteId);

    // Điểm đặt chân
    const renderX = Math.round(worldX - anchor.foot.x);
    const renderY = Math.round(worldY - anchor.foot.y);

    this.ctx.save();
    if (flipX) {
      this.ctx.translate(Math.round(worldX), 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(frame, -anchor.foot.x, renderY);
    } else {
      this.ctx.drawImage(frame, renderX, renderY);
    }
    this.ctx.restore();

    // Render thông tin Debug nếu bật phím D
    if (this.debugMode) {
      this.drawSpriteDebugOverlay(spriteId, renderX, renderY, sprite.frameWidth, sprite.frameHeight, anchor, sprite.isFallback);
    }
  }

  /**
   * Vẽ lớp phủ kiểm tra Debug:
   * - Khung va chạm AABB (xanh lá nếu chuẩn, đỏ nếu va chạm)
   * - Điểm neo Chân (xanh dương), Đầu (vàng), Tay (đỏ)
   * - Tên tài sản ID & nhãn [FALLBACK] nếu đang dùng sprite code
   */
  private drawSpriteDebugOverlay(
    spriteId: string,
    x: number,
    y: number,
    w: number,
    h: number,
    anchor: any,
    isFallback: boolean
  ): void {
    const ctx = this.ctx;

    // 1. Khung AABB
    ctx.strokeStyle = '#40bfa3'; // Xanh ngọc AABB
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // 2. Điểm neo Chân (Foot)
    const footX = x + anchor.foot.x;
    const footY = y + anchor.foot.y;
    ctx.fillStyle = '#3b6b99'; // Xanh dương
    ctx.fillRect(footX - 2, footY - 2, 5, 5);

    // Điểm neo Đầu (Head)
    if (anchor.head) {
      const headX = x + anchor.head.x;
      const headY = y + anchor.head.y;
      ctx.fillStyle = '#fedb5b'; // Vàng
      ctx.fillRect(headX - 2, headY - 2, 5, 5);
    }

    // Điểm neo Tay (Hand)
    if (anchor.hand) {
      const handX = x + anchor.hand.x;
      const handY = y + anchor.hand.y;
      ctx.fillStyle = '#bf363b'; // Đỏ
      ctx.fillRect(handX - 2, handY - 2, 5, 5);
    }

    // 3. Tên tài sản & cảnh báo Fallback
    ctx.font = '8px monospace';
    ctx.fillStyle = isFallback ? '#f7af34' : '#ffffff';
    ctx.fillText(`${spriteId} ${isFallback ? '[FALLBACK]' : '[PNG]'}`, x, y - 4);
  }

  /**
   * Vẽ bảng cảnh báo Debug góc trên màn hình khi phím D được kích hoạt
   */
  public drawDebugInfoOverlay(): void {
    if (!this.debugMode) return;

    const ctx = this.ctx;
    ctx.save();

    // Bảng đen mờ góc trên phải
    ctx.fillStyle = 'rgba(22, 20, 38, 0.85)';
    ctx.fillRect(290, 4, 186, 75);
    ctx.strokeStyle = '#f7af34';
    ctx.strokeRect(290.5, 4.5, 185, 74);

    ctx.font = 'bold 9px "Pixelify Sans", monospace';
    ctx.fillStyle = '#fedb5b';
    ctx.fillText('--- CHẾ ĐỘ DEBUG (PHÍM F2) ---'.normalize('NFC'), 296, 16);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#f7edd7';
    ctx.fillText(`Độ phân giải: 480x270 (16:9)`, 296, 28);
    ctx.fillText(`Tài sản đã nạp: ${this.assetManager.sprites.size}`, 296, 38);
    ctx.fillText(`Dùng Sprite Code: ${this.assetManager.missingAssetIds.length}`, 296, 48);

    ctx.fillStyle = '#e88827';
    ctx.fillText(`Neo: Lam=Chân, Vàng=Đầu, Đỏ=Tay`, 296, 58);
    ctx.fillStyle = '#40bfa3';
    ctx.fillText(`Viền AABB: Xanh ngọc 1px`, 296, 68);

    ctx.restore();
  }

  /**
   * Render toàn bộ khung cảnh mẫu cho Giai đoạn 2 để kiểm thử:
   * - Nền Parallax Huế
   * - Hero Idle & Run
   * - Quái thường, Mini-boss và Boss Bóng Lãng Quên
   * - Thanh Boss Lãng Quên ("BÓNG LÃNG QUÊN")
   * - Chữ chiêu thức ("NÉM KIM CHỈ!!")
   * - Khung 9-slice HUD Ký Ức, Chỉ, Thẻ Sự Thật
   * - Hộp thoại Nghệ Nhân
   */
  public renderStage2Showcase(): void {
    this.tick++;
    const animFrame4 = Math.floor(this.tick / 10) % 4;
    const animFrame2 = Math.floor(this.tick / 15) % 2;

    // 1. Vẽ nền Parallax
    this.drawParallaxHue(this.tick * 0.5);

    // 2. Vẽ Hero (Chạy & Tấn công)
    this.drawSprite('hero_idle', 120, 200, false, animFrame2);
    this.drawSprite('hero_run', 180, 200, false, animFrame4);
    this.drawSprite('hero_attack_1', 250, 200, false, animFrame4 % 3);

    // 3. Vẽ Quái thường
    this.drawSprite('mob_chi_roi', 70, 200, false, animFrame4);
    this.drawSprite('mob_bui_mo', 40, 160, false, animFrame4);

    // 4. Vẽ Mini-Boss với Khiên Hiểu Lầm
    this.drawSprite('miniboss_vat_ao', 330, 200, true, animFrame4);

    // 5. Vẽ Boss "Bóng Lãng Quên" xa xa mờ ảo
    this.drawSprite('boss_idle', 420, 185, true, animFrame4);

    // 6. Vẽ Thanh Boss ở trên
    drawBossBar(this.ctx, 100, 8, 280, 32, 65, 'BÓNG LÃNG QUÊN');

    // 7. Vẽ HUD Người Chơi ở góc dưới trái
    drawPlayerHUD(this.ctx, 8, 212, 4, 5, 80, 3, 4);

    // 8. Vẽ Khay Thẻ Sự Thật ở giữa dưới
    drawTruthCardSlot(this.ctx, 175, 212, 1, 'Ngũ thân tượng trưng tứ thân phụ mẫu', true);
    drawTruthCardSlot(this.ctx, 248, 212, 2, 'May 5 mùa tránh nóng', false);
    drawTruthCardSlot(this.ctx, 321, 212, 3, 'Là áo bà ba Nam Bộ', false);

    // 9. Vẽ Chữ Chiêu Thức nổi (Kiểm thử bắt buộc)
    const bounceScale = 1.0 + Math.sin(this.tick / 6) * 0.08;
    drawActionCallout(this.ctx, 240, 80, 'NÉM KIM CHỈ!!', bounceScale, '#f7af34');

    // 10. Vẽ Bong bóng đối thoại nghệ nhân góc phải trên
    drawDialogueBox(
      this.ctx,
      280,
      110,
      192,
      60,
      'Cụ Nghệ Nhân:',
      'Năm hạt khuy nhắc nhở đạo lý Ngũ Thường: Nhân, Nghĩa, Lễ, Trí, Tín đó con!'
    );

    // 11. Bảng Debug info nếu bấm D
    this.drawDebugInfoOverlay();
  }
}
