/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ RENDER ĐỒ HỌA CHUẨN 480x270 & CHẾ ĐỘ DEBUG
 * Kích thước logic: 480x270 (16:9).
 * Phóng đại số nguyên, pixelated, imageSmoothingEnabled = false.
 * Chế độ debug (phím D): hiện khung va chạm, điểm neo, tên tài sản, cảnh báo thiếu.
 */

import { AssetManager } from '../assets/loader.ts';
import { AccessibilityManager } from './accessibility.ts';
import { ParticleSystem } from './particles.ts';
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
  public static currentFps = 60;
  public static currentFrameTime = 16.6;
  public static isBloomActive = true;

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

  private cachedSkyGrad: CanvasGradient | null = null;
  private cachedRiverGrad: CanvasGradient | null = null;

  /**
   * Vẽ Nền Parallax Hoàng Hôn Xứ Huế Tuyệt Đẹp (6 lớp chiều sâu chi tiết)
   */
  public drawParallaxHue(scrollX = 0): void {
    const ctx = this.ctx;
    const w = GameRenderer.LOGIC_WIDTH;
    const h = GameRenderer.LOGIC_HEIGHT;

    // 1. LỚP 1: BẦU TRỜI HOÀNG HÔN CỐ ĐÔ PROMAX (Dạ Lam Huyền Diệu -> Tím Cung Đình -> Đỏ Rượu Điều -> Cam Hổ Phách -> Vàng Lưu Ly)
    if (!this.cachedSkyGrad) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 165);
      skyGrad.addColorStop(0, '#090c1a'); // Dạ lam huyền bí
      skyGrad.addColorStop(0.24, '#200f2e'); // Tím cung đình sâu lắng
      skyGrad.addColorStop(0.48, '#4f1429'); // Đỏ tím ngọc bích
      skyGrad.addColorStop(0.72, '#9c3f1a'); // Cam đất nung Hoàng thành
      skyGrad.addColorStop(0.92, '#e88827'); // Hổ phách rực rỡ
      skyGrad.addColorStop(1, '#fedb5b'); // Vàng hoàng kim chân trời
      this.cachedSkyGrad = skyGrad;
    }
    ctx.fillStyle = this.cachedSkyGrad;
    ctx.fillRect(0, 0, w, 165);

    // Những vì sao đêm Cố Đô lấp lánh đa tầng trên vòm trời dạ lam
    const starCoords = [
      [22, 12], [58, 20], [92, 10], [145, 26], [198, 14], [240, 24],
      [285, 8], [330, 28], [375, 12], [420, 22], [455, 16], [115, 34],
      [265, 38], [18, 38], [175, 42], [310, 40], [470, 36],
    ];
    starCoords.forEach(([sx, sy], idx) => {
      const twinkle = Math.sin((this.tick + idx * 11) / 5);
      if (twinkle > -0.2) {
        ctx.fillStyle = twinkle > 0.6 ? '#ffffff' : 'rgba(254, 219, 91, 0.85)';
        ctx.fillRect(sx, sy, 1, 1);
        if (twinkle > 0.82) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(sx - 1, sy, 3, 1);
          ctx.fillRect(sx, sy - 1, 1, 3);
        }
      }
    });

    // Sao băng hoàng hôn lướt qua bầu trời Huế (chu kỳ ~240 tick)
    const meteorCycle = this.tick % 240;
    if (meteorCycle < 36) {
      const mx = w - meteorCycle * 7.5;
      const my = 8 + meteorCycle * 2.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx + 22, my - 7);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(mx - 1, my - 1, 2, 2);
    }

    // Vầng trăng rằm Cố Đô PROMAX với 4 tầng quầng hào quang lung linh
    const moonX = 392;
    const moonY = 44;
    // Tầng hào quang xa rộng
    ctx.fillStyle = 'rgba(254, 219, 91, 0.05)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46, 0, Math.PI * 2);
    ctx.fill();
    // Tầng hào quang trung
    ctx.fillStyle = 'rgba(254, 219, 91, 0.12)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
    ctx.fill();
    // Tầng hào quang cận
    ctx.fillStyle = 'rgba(255, 243, 158, 0.22)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fill();
    // Thân trăng vàng ngọc
    ctx.fillStyle = '#fff4a3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 13.5, 0, Math.PI * 2);
    ctx.fill();
    // Vết lồi lõm mặt trăng pixel cổ kính
    ctx.fillStyle = '#eed77e';
    ctx.fillRect(moonX - 5, moonY - 4, 4, 3);
    ctx.fillRect(moonX + 1, moonY + 2, 3, 3);
    ctx.fillRect(moonX - 2, moonY + 5, 2, 2);

    // Luồng ráng sáng hoàng hôn (Twilight God Rays) chiếu xiên nhẹ từ chân trời
    ctx.save();
    for (let r = 0; r < 4; r++) {
      const rayX = 80 + r * 110 + Math.sin((this.tick + r * 20) / 40) * 8;
      const rayGrad = ctx.createLinearGradient(rayX, 50, rayX - 40, 165);
      rayGrad.addColorStop(0, 'rgba(254, 219, 91, 0)');
      rayGrad.addColorStop(0.5, 'rgba(254, 219, 91, 0.04)');
      rayGrad.addColorStop(1, 'rgba(232, 136, 39, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rayX - 15, 60);
      ctx.lineTo(rayX + 25, 60);
      ctx.lineTo(rayX + 45, 165);
      ctx.lineTo(rayX - 35, 165);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Đàn chim hạc trắng bay lượn ngang bầu trời hoàng hôn
    const craneOffset = (this.tick * 0.42) % (w + 140) - 70;
    const craneBaseY = 32;
    ctx.fillStyle = '#ffffff';
    [
      { dx: 0, dy: 0 },
      { dx: 14, dy: -6 },
      { dx: 26, dy: -2 },
      { dx: 38, dy: -8 },
      { dx: 52, dy: -4 },
    ].forEach((c, idx) => {
      const cx = (w - craneOffset + c.dx) % (w + 140) - 40;
      const cy = craneBaseY + c.dy;
      const wing = Math.sin((this.tick + idx * 7) / 3.5) > 0 ? 1 : -1;
      // Thân chim
      ctx.fillRect(cx, cy, 3, 1);
      // Cánh vỗ
      ctx.fillRect(cx + 1, cy - wing, 2, 1);
    });

    // 2. LỚP 2: MÂY CUỘN HOÀNG CUNG THỜI NGUYỄN (Tốc độ 0.08x)
    const cloudSpeed = (this.tick * 0.16 + scrollX * 0.08) % (w + 180);
    const drawRoyalCloud = (cx: number, cy: number, scale = 1) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = 'rgba(84, 25, 36, 0.48)';
      // Cụm mây uốn lượn phong thủy
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.arc(16, -2, 11, 0, Math.PI * 2);
      ctx.arc(-14, 2, 10, 0, Math.PI * 2);
      ctx.arc(28, 4, 8, 0, Math.PI * 2);
      ctx.arc(-26, 4, 7, 0, Math.PI * 2);
      ctx.fill();
      // Viền mây vàng cam ánh hoàng hôn
      ctx.fillStyle = 'rgba(247, 175, 52, 0.42)';
      ctx.fillRect(-14, -14, 26, 2);
      ctx.fillRect(4, -12, 18, 2);
      ctx.restore();
    };
    drawRoyalCloud(w - cloudSpeed, 65, 1.25);
    drawRoyalCloud((w * 1.5 - cloudSpeed) % (w + 220) - 50, 48, 0.9);

    // 3. LỚP 3: DÃY NÚI NGỰ BÌNH XA MỜ ẢO ĐA TẦNG (Tốc độ 0.12x)
    const mountainX = -(scrollX * 0.12) % 240;
    // Dãy núi viễn cảnh
    ctx.fillStyle = '#1c1126';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    for (let x = mountainX - 240; x < w + 240; x += 120) {
      ctx.lineTo(x, 155);
      ctx.lineTo(x + 45, 126);
      ctx.lineTo(x + 75, 134);
      ctx.lineTo(x + 120, 155);
    }
    ctx.lineTo(w, 160);
    ctx.closePath();
    ctx.fill();

    // 4. LỚP 4: QUẦN THỂ DI TÍCH HOÀNG THÀNH HUẾ (Ngọ Môn, Tháp Phước Duyên, Kỳ Đài) (Tốc độ 0.22x)
    const farX = -(scrollX * 0.22) % 280;
    ctx.fillStyle = '#2a1630'; // Silhouette tím sẫm có chi tiết
    for (let x = farX - 280; x < w + 280; x += 220) {
      // 4.1 Cổng Ngọ Môn & Lầu Ngũ Phụng
      // Tường thành đá chân cổng
      ctx.fillRect(x, 138, 70, 18);
      // Vòm 3 cửa vào Ngọ Môn
      ctx.fillStyle = '#130d1c';
      ctx.fillRect(x + 12, 146, 8, 10);
      ctx.fillRect(x + 30, 144, 10, 12);
      ctx.fillRect(x + 48, 146, 8, 10);

      // Lầu Ngũ Phụng 2 tầng mái ngói cong
      ctx.fillStyle = '#3a1b3d';
      // Tầng 1
      ctx.fillRect(x + 6, 132, 58, 6);
      ctx.beginPath();
      ctx.moveTo(x + 2, 134);
      ctx.lineTo(x + 68, 134);
      ctx.lineTo(x + 64, 130);
      ctx.lineTo(x + 6, 130);
      ctx.closePath();
      ctx.fill();
      // Tầng 2 mái vút đầu đao
      ctx.fillRect(x + 16, 124, 38, 6);
      ctx.beginPath();
      ctx.moveTo(x + 12, 125);
      ctx.lineTo(x + 58, 125);
      ctx.lineTo(x + 52, 120);
      ctx.lineTo(x + 18, 120);
      ctx.closePath();
      ctx.fill();
      // Đỉnh bờ nóc chạm rồng chầu ngọc
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(x + 33, 118, 4, 3);
      ctx.fillStyle = '#f7af34';
      ctx.fillRect(x + 31, 119, 8, 1);

      // Cột cờ Kỳ Đài với lá cờ ngũ sắc bay phấp phới
      ctx.fillStyle = '#4f3547';
      ctx.fillRect(x + 78, 110, 3, 46);
      // Cờ ngũ sắc hoàng gia
      const flagWave = Math.sin((this.tick + x) / 5) * 1.6;
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(x + 81, 112 + flagWave, 10, 6);
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(x + 83, 114 + flagWave, 6, 2);
      ctx.fillStyle = '#40bfa3';
      ctx.fillRect(x + 91, 113 + flagWave, 2, 4);

      // 4.2 Tháp Phước Duyên (Chùa Thiên Mụ) 7 tầng cao vút
      const towerX = x + 130;
      ctx.fillStyle = '#2d1833';
      for (let t = 0; t < 7; t++) {
        const tw = 20 - t * 2;
        const ty = 145 - t * 7;
        ctx.fillRect(towerX + t, ty, tw, 6);
        // Mái nhô ra của từng tầng
        ctx.fillStyle = '#452247';
        ctx.fillRect(towerX + t - 2, ty, tw + 4, 2);
        ctx.fillStyle = '#2d1833';
        // Ánh đèn lồng vàng ấm lung linh nơi ô cửa tháp
        if (t < 5) {
          const towerLightFlicker = Math.sin((this.tick + t * 9) / 4) > 0 ? '#fedb5b' : '#f7af34';
          ctx.fillStyle = towerLightFlicker;
          ctx.fillRect(towerX + t + Math.floor(tw / 2) - 1, ty + 2, 2, 2);
          ctx.fillStyle = '#2d1833';
        }
      }
      // Đỉnh hồ lô tháp
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(towerX + 7, 92, 2, 4);

      // Rặng cây phong & ngô đồng cổ thụ quanh bờ thành
      ctx.fillStyle = '#181022';
      ctx.beginPath();
      ctx.arc(x + 180, 142, 14, 0, Math.PI * 2);
      ctx.arc(x + 195, 140, 11, 0, Math.PI * 2);
      ctx.arc(x + 208, 145, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. LỚP 5: SÔNG HƯƠNG NƯỚC LỮNG LỜ & HOA ĐĂNG LẬP LÒE PROMAX (Tốc độ 0.45x)
    const riverY = 152;
    if (!this.cachedRiverGrad) {
      const riverGrad = ctx.createLinearGradient(0, riverY, 0, 202);
      riverGrad.addColorStop(0, '#192542'); // Nước xanh lam thẫm
      riverGrad.addColorStop(0.35, '#131b30');
      riverGrad.addColorStop(1, '#0a0d18'); // Đáy sâu
      this.cachedRiverGrad = riverGrad;
    }
    ctx.fillStyle = this.cachedRiverGrad;
    ctx.fillRect(0, riverY, w, 50);

    // Dải ánh trăng dát vàng lấp lánh phản chiếu trên mặt sông Hương
    const moonReflectX = moonX - (scrollX * 0.15) % w;
    for (let my = riverY + 2; my < riverY + 48; my += 2.5) {
      const mSpread = (my - riverY) * 0.58;
      const mShimmer = Math.sin((this.tick + my * 4) / 4.5) * 3.5;
      ctx.fillStyle = 'rgba(254, 219, 91, 0.32)';
      ctx.fillRect(moonReflectX - mSpread + mShimmer, my, mSpread * 2, 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(moonReflectX - 2 + mShimmer, my, 4, 1);
    }

    // Gợn sóng lấp lánh phản chiếu ráng chiều hoàng kim
    const waveShift = Math.floor(this.tick / 5) % 4;
    for (let i = 0; i < 32; i++) {
      const wx = (i * 22 + waveShift * 4) % w;
      const wy = riverY + 5 + (i % 7) * 6;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(247, 175, 52, 0.75)' : 'rgba(254, 219, 91, 0.45)';
      ctx.fillRect(wx, wy, 8 + (i % 3) * 3, 1);
    }

    // Làn sương khói mờ ảo lững lờ trên mặt sông Hương (River Mist)
    const mistOffset = (this.tick * 0.2) % w;
    ctx.fillStyle = 'rgba(180, 220, 245, 0.09)';
    ctx.fillRect((w - mistOffset) % w, riverY + 12, 130, 8);
    ctx.fillRect((w * 1.5 - mistOffset) % w, riverY + 24, 150, 7);

    // Thuyền rồng Cố Đô Huế & Đèn Hoa Đăng thả trôi trên sông Hương
    const boatX = (-(scrollX * 0.45) + 240) % (w + 100) - 50;
    // Thuyền rồng cổ
    ctx.fillStyle = '#4f241a';
    ctx.beginPath();
    ctx.moveTo(boatX, riverY + 22);
    ctx.lineTo(boatX + 44, riverY + 22);
    ctx.lineTo(boatX + 38, riverY + 30);
    ctx.lineTo(boatX + 6, riverY + 30);
    ctx.closePath();
    ctx.fill();
    // Mui thuyền & lồng đèn đuôi thuyền
    ctx.fillStyle = '#f7af34';
    ctx.fillRect(boatX + 12, riverY + 14, 18, 8);
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(boatX + 40, riverY + 17, 3, 4);

    // Hoa đăng sen lập lòe ánh nến trôi lững lờ PROMAX
    for (let l = 0; l < 5; l++) {
      const lx = (w - ((this.tick * 0.32 + l * 95 + scrollX * 0.45) % (w + 40)));
      const ly = riverY + 14 + l * 6.5;
      // Cánh hoa sen hồng Cố Đô
      ctx.fillStyle = '#d96499';
      ctx.fillRect(lx - 3, ly, 6, 2);
      ctx.fillStyle = '#f29ec0';
      ctx.fillRect(lx - 2, ly - 1, 4, 1);
      // Ngọn nến vàng lung linh
      const candleFlicker = Math.sin((this.tick + l * 5) / 2.5) > 0 ? 1 : 0;
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(lx - 1, ly - 3 - candleFlicker, 2, 2);
    }

    // 6. LỚP 6: MẶT ĐẤT CỐ THÀNH, LAN CAN ĐÁ & ĐÈN LỒNG CUNG ĐÌNH (Tốc độ 1.0x)
    const groundY = 202;
    // Nền gạch đá sâu
    ctx.fillStyle = '#120f1e';
    ctx.fillRect(0, groundY, w, h - groundY);

    // Mặt kè đá hoa cương xanh xám cổ (Đá Thanh Cố Đô)
    ctx.fillStyle = '#3a2e47';
    ctx.fillRect(0, groundY, w, 8);
    ctx.fillStyle = '#5a496b';
    ctx.fillRect(0, groundY, w, 2); // Viền phản quang mặt đá

    // Trụ lan can búp sen đá cổ dọc bờ thành (Balustrades)
    for (let bx = 10; bx < w; bx += 40) {
      ctx.fillStyle = '#4a3c5a';
      ctx.fillRect(bx, groundY - 8, 4, 8);
      // Búp sen đá trên đỉnh trụ
      ctx.fillStyle = '#6b587f';
      ctx.fillRect(bx, groundY - 11, 4, 3);
      ctx.fillStyle = '#9c81b8';
      ctx.fillRect(bx + 1, groundY - 13, 2, 2);
      // Gờ ngang lan can
      ctx.fillStyle = '#32263f';
      ctx.fillRect(bx + 4, groundY - 6, 36, 2);
    }

    // Mạch vữa đá hoa cương so le
    ctx.fillStyle = '#211a2d';
    for (let x = 0; x < w; x += 28) {
      ctx.fillRect(x, groundY + 2, 1, 6);
      ctx.fillRect(x + 14, groundY + 8, 1, 14);
      ctx.fillRect(x, groundY + 22, 1, 14);
    }

    // Hoa văn mảng rêu phong bám trên đá cổ
    ctx.fillStyle = '#268c7e';
    for (let x = 20; x < w; x += 56) {
      ctx.fillRect(x, groundY - 1, 4, 2);
      ctx.fillRect(x + 2, groundY + 1, 3, 2);
    }

    // Cột đèn lồng gỗ son Huế treo dọc bờ thành với quầng sáng đung đưa
    for (let lx = 30; lx < w; lx += 140) {
      // Cột gỗ son đỏ thẫm
      ctx.fillStyle = '#7a2222';
      ctx.fillRect(lx, groundY - 32, 3, 32);
      // Tay đòn treo đèn
      ctx.fillRect(lx - 6, groundY - 32, 9, 2);

      // Đèn lồng đung đưa nhẹ nhàng như con lắc
      const swayAngle = Math.sin((this.tick + lx) / 14) * 0.08;
      ctx.save();
      ctx.translate(lx - 5, groundY - 32);
      ctx.rotate(swayAngle);

      // Quầng sáng lồng đèn tỏa rộng ấm áp
      ctx.fillStyle = 'rgba(232, 136, 39, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 8, 18, 0, Math.PI * 2);
      ctx.fill();

      // Thân lồng đèn đỏ cung đình
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(-4, 4, 8, 9);
      // Lõi vàng
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(-2, 6, 4, 5);
      // Tua rua vàng buông rủ
      ctx.fillStyle = '#f7af34';
      ctx.fillRect(-1.5, 13, 3, 4);

      ctx.restore();
    }
  }

  // Canvas phụ cho hiệu ứng Bloom nhẹ (Yêu cầu 10)
  private bloomCanvas: HTMLCanvasElement | null = null;
  private bloomCtx: CanvasRenderingContext2D | null = null;

  /**
   * Áp dụng Hậu kỳ nhẹ: Bloom vùng sáng & Vignette nhẹ (Yêu cầu 10)
   * Tự động tắt khi "Giảm hiệu ứng" hoặc FPS thấp (< 45 FPS)
   */
  public applyPostProcessing(fps = GameRenderer.currentFps, isFpsDowngraded = false): void {
    const a11y = AccessibilityManager.getInstance();
    const reduceMotion = a11y.settings.reduceMotion;
    const postProcessingBloom = a11y.settings.postProcessingBloom;

    // Tắt hoàn toàn khi "Giảm hiệu ứng" hoặc FPS thấp (< 45 FPS) hoặc người dùng tắt trong Cài đặt
    if (reduceMotion || !postProcessingBloom || isFpsDowngraded || fps < 45) {
      GameRenderer.isBloomActive = false;
      return;
    }
    GameRenderer.isBloomActive = true;

    const ctx = this.ctx;
    const w = GameRenderer.LOGIC_WIDTH;
    const h = GameRenderer.LOGIC_HEIGHT;

    // 1. Bloom nhẹ cho vùng sáng bằng cách vẽ lại lớp sáng thu nhỏ với độ mờ thấp
    if (!this.bloomCanvas) {
      this.bloomCanvas = document.createElement('canvas');
      this.bloomCanvas.width = 120;
      this.bloomCanvas.height = 68;
      this.bloomCtx = this.bloomCanvas.getContext('2d');
    }

    if (this.bloomCtx) {
      this.bloomCtx.imageSmoothingEnabled = true;
      this.bloomCtx.clearRect(0, 0, 120, 68);
      // Thu nhỏ khung hình hiện tại sang canvas 1/4
      this.bloomCtx.drawImage(this.canvas, 0, 0, 120, 68);

      // Phủ ngược lại màn hình chính với blend mode 'screen' độ mờ dịu
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(this.bloomCanvas, 0, 0, w, h);
      ctx.restore();
    }

    // 2. Vignette nhẹ (Bo góc tối mềm mại quanh viền màn hình)
    ctx.save();
    const vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, 160, w / 2, h / 2, 275);
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(1, 'rgba(12, 10, 22, 0.42)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
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
   * Vẽ bảng cảnh báo Debug góc trên màn hình khi phím F2 được kích hoạt (Yêu cầu 11)
   */
  public drawDebugInfoOverlay(): void {
    if (!this.debugMode) return;
    try {
      const sm = (window as any).__sceneManager;
      if (sm && sm.hideDebugHud) return;
    } catch {}

    const ctx = this.ctx;
    ctx.save();

    // Bảng đen mờ góc trên phải
    ctx.fillStyle = 'rgba(22, 20, 38, 0.88)';
    ctx.fillRect(270, 4, 206, 92);
    ctx.strokeStyle = '#f7af34';
    ctx.lineWidth = 1;
    ctx.strokeRect(270.5, 4.5, 205, 91);

    ctx.font = 'bold 9px "Pixelify Sans", monospace';
    ctx.fillStyle = '#fedb5b';
    ctx.fillText('--- CHẾ ĐỘ DEBUG (PHÍM F2) ---'.normalize('NFC'), 276, 16);

    const particleSys = ParticleSystem.getInstance();
    const activeParticles = particleSys.activeParticleCount;
    const fps = GameRenderer.currentFps;
    const frameTime = GameRenderer.currentFrameTime;
    const fpsColor = fps >= 45 ? '#77e0b5' : '#bf363b';

    ctx.font = '8px monospace';
    ctx.fillStyle = fpsColor;
    ctx.fillText(`FPS: ${fps} | Frame: ${frameTime.toFixed(1)}ms`, 276, 28);

    ctx.fillStyle = '#f7edd7';
    ctx.fillText(`Hạt Particle: ${activeParticles} / 300 (Pool)`, 276, 38);
    ctx.fillText(`Hậu kỳ Bloom: ${GameRenderer.isBloomActive ? 'BẬT' : 'TẮT (<45 FPS / A11y)'}`, 276, 48);
    ctx.fillText(`Độ phân giải: 480x270 (16:9 Retro)`, 276, 58);
    ctx.fillText(`Tài sản đã nạp: ${this.assetManager.sprites.size}`, 276, 68);

    ctx.fillStyle = '#e88827';
    ctx.fillText(`Hitbox: Đỏ | Hurtbox: Ngọc`, 276, 78);
    ctx.fillStyle = '#40bfa3';
    ctx.fillText(`Neo: Lam=Chân, Vàng=Đầu, Đỏ=Tay`, 276, 88);

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

    // 2. Vẽ Hero duy nhất (tránh nhân vật thứ 2 chìm chân dưới HUD)
    this.drawSprite('hero_run', 190, 200, false, animFrame4);

    // 3. Vẽ Quái thường
    this.drawSprite('mob_chi_roi', 290, 200, false, animFrame4);
    this.drawSprite('mob_bui_mo', 140, 160, false, animFrame4);

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
      'Nghệ Nhân May Đo:',
      'Năm hạt khuy nhắc nhở đạo lý Ngũ Thường: Nhân, Nghĩa, Lễ, Trí, Tín đó con!'
    );

    // 11. Bảng Debug info nếu bấm D
    this.drawDebugInfoOverlay();
  }
}
