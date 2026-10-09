/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG HIỆU ỨNG THỜI TIẾT TOÀN CỤC (GLOBAL WEATHER EFFECT SYSTEM)
 * Phủ lớp hạt pixel chuyển động nhẹ nhàng (cánh hoa rơi Cố Đô / mưa bụi xứ Huế)
 * trên các màn chơi cụ thể, hỗ trợ bật/tắt trong Cài đặt (Settings).
 */

export type WeatherType = 'petals' | 'rain' | 'fireflies' | 'none';

interface FireflyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  phase: number;
  speed: number;
}

interface PetalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  swayAngle: number;
  swaySpeed: number;
  swayRadius: number;
  flipSpeed: number;
  flipState: number;
}

interface RainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  color: string;
  alpha: number;
}

interface RainSplash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
}

export class WeatherManager {
  private static instance: WeatherManager;

  private petals: PetalParticle[] = [];
  private rainDrops: RainParticle[] = [];
  private fireflies: FireflyParticle[] = [];
  private splashes: RainSplash[] = [];

  // Yêu cầu 6: Giới hạn tối đa 120 hạt thời tiết toàn hệ thống
  public static readonly MAX_WEATHER_PARTICLES = 120;
  private readonly MAX_PETALS = 50;
  private readonly MAX_RAIN = 75;
  private readonly MAX_FIREFLIES = 35;

  private petalColors = [
    '#f4a7b9', // Sen hồng Cố đô
    '#fbb7c0', // Tường vi đào
    '#fedb5b', // Hoàng yến cung đình Huế
    '#f7edd7', // Bạch huệ nhạt
    '#e88827', // Lụa vàng cam
  ];

  private rainColors = [
    'rgba(180, 220, 245, 0.55)', // Xanh lam nhạt trong suốt
    'rgba(215, 238, 255, 0.45)', // Trắng mưa bụi
    'rgba(150, 205, 240, 0.65)', // Hạt mưa sâu
  ];

  private constructor() {
    this.initPetals(480, 270);
    this.initRain(480, 270);
    this.initFireflies(480, 270);
  }

  public static getInstance(): WeatherManager {
    if (!WeatherManager.instance) {
      WeatherManager.instance = new WeatherManager();
    }
    return WeatherManager.instance;
  }

  /**
   * Xác định loại thời tiết tương ứng với từng màn chơi (Scene / Level)
   * - c1_m1 (Ngọ Môn): Cánh hoa ngô đồng & hoàng yến rơi trước cổng hoàng cung
   * - c1_m2 (Sông Hương): Mưa bụi Cố đô Huế lãng đãng trên mặt sông
   * - c1_m3 (Điện Thái Hòa): Cánh hoa đại nội bay lượn
   * - c1_m4 (Lăng Tự Đức): Đom đóm đêm hồ Lưu Khiêm
   * - CHAPTER_MAP: Cánh hoa rơi nhẹ nhàng trên bản đồ Cố đô
   * - TITLE: Cánh hoa đêm rơi nhẹ dưới trăng
   * - BOSS: Đom đóm & bụi tơ lụa phát sáng
   */
  public getWeatherForScene(scene: string, levelId?: string): WeatherType {
    if (scene === 'LEVEL') {
      if (levelId === 'c1_m1') return 'petals';
      if (levelId === 'c1_m2') return 'rain';
      if (levelId === 'c1_m3') return 'petals';
      if (levelId === 'c1_m4') return 'fireflies';
      return 'petals';
    }
    if (scene === 'CHAPTER_MAP') return 'petals';
    if (scene === 'TITLE') return 'petals';
    if (scene === 'BOSS') return 'fireflies';
    return 'none';
  }

  private initPetals(width: number, height: number): void {
    this.petals = [];
    for (let i = 0; i < this.MAX_PETALS; i++) {
      this.petals.push(this.createPetal(Math.random() * width, Math.random() * height));
    }
  }

  private initFireflies(width: number, height: number): void {
    this.fireflies = [];
    for (let i = 0; i < this.MAX_FIREFLIES; i++) {
      this.fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.35,
        baseAlpha: 0.5 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.03 + Math.random() * 0.04,
      });
    }
  }

  private createPetal(startX: number, startY: number): PetalParticle {
    return {
      x: startX,
      y: startY,
      vx: 0.2 + Math.random() * 0.4,
      vy: 0.45 + Math.random() * 0.55,
      size: Math.random() > 0.4 ? 2 : 3,
      color: this.petalColors[Math.floor(Math.random() * this.petalColors.length)],
      alpha: 0.4 + Math.random() * 0.45,
      swayAngle: Math.random() * Math.PI * 2,
      swaySpeed: 0.025 + Math.random() * 0.03,
      swayRadius: 0.6 + Math.random() * 0.9,
      flipSpeed: 0.03 + Math.random() * 0.04,
      flipState: Math.random() * Math.PI,
    };
  }

  private initRain(width: number, height: number): void {
    this.rainDrops = [];
    for (let i = 0; i < this.MAX_RAIN; i++) {
      this.rainDrops.push(this.createRainDrop(Math.random() * (width + 60) - 30, Math.random() * height));
    }
  }

  private createRainDrop(startX: number, startY: number): RainParticle {
    return {
      x: startX,
      y: startY,
      vx: 0.8 + Math.random() * 0.6, // Gió tạt nhẹ sang phải
      vy: 4.8 + Math.random() * 2.2, // Rơi nhanh
      length: 4 + Math.floor(Math.random() * 4),
      color: this.rainColors[Math.floor(Math.random() * this.rainColors.length)],
      alpha: 0.35 + Math.random() * 0.4,
    };
  }

  /**
   * Cập nhật vị trí hạt thời tiết theo từng frame (60Hz)
   */
  public update(weatherType: WeatherType, width: number, height: number): void {
    if (weatherType === 'none') return;

    if (weatherType === 'petals') {
      for (const p of this.petals) {
        p.swayAngle += p.swaySpeed;
        p.flipState += p.flipSpeed;

        p.x += p.vx + Math.sin(p.swayAngle) * p.swayRadius;
        p.y += p.vy;

        // Vòng lặp khi rơi khỏi màn hình
        if (p.y > height + 6 || p.x > width + 15) {
          p.y = -6;
          p.x = Math.random() * (width + 20) - 20;
          p.swayAngle = Math.random() * Math.PI * 2;
        }
      }
    } else if (weatherType === 'rain') {
      // Cập nhật giọt mưa
      for (const r of this.rainDrops) {
        r.x += r.vx;
        r.y += r.vy;

        // Chạm đất sàn (khoảng y: 200..265) tạo tia nước bắn li ti
        if (r.y >= 210 && Math.random() < 0.08) {
          if (this.splashes.length < 18) {
            this.splashes.push({
              x: Math.floor(r.x),
              y: Math.min(height - 4, Math.floor(r.y)),
              life: 4,
              maxLife: 4,
              color: r.color,
            });
          }
        }

        // Tái tạo giọt mưa rơi lại từ mép trên
        if (r.y > height + 10 || r.x > width + 20) {
          r.y = -r.length - Math.random() * 20;
          r.x = Math.random() * (width + 80) - 50;
        }
      }

      // Cập nhật tia nước bắn chạm đất (splash)
      for (let i = this.splashes.length - 1; i >= 0; i--) {
        const s = this.splashes[i];
        s.life--;
        if (s.life <= 0) {
          this.splashes.splice(i, 1);
        }
      }
    } else if (weatherType === 'fireflies') {
      for (const f of this.fireflies) {
        f.phase += f.speed;
        f.x += f.vx + Math.sin(f.phase) * 0.45;
        f.y += f.vy + Math.cos(f.phase * 0.8) * 0.35;

        // Vòng lặp khi trôi ra ngoài màn hình
        if (f.x < -10) f.x = width + 5;
        if (f.x > width + 10) f.x = -5;
        if (f.y < -10) f.y = height + 5;
        if (f.y > height + 10) f.y = -5;
      }
    }
  }

  /**
   * Vẽ lớp phủ hạt thời tiết lên canvas chuẩn pixel-art
   */
  public draw(ctx: CanvasRenderingContext2D, weatherType: WeatherType): void {
    if (weatherType === 'none') return;

    ctx.save();

    if (weatherType === 'petals') {
      for (const p of this.petals) {
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        const flip = Math.sin(p.flipState);
        const w = Math.max(1, Math.round(p.size * Math.abs(flip)));
        const h = p.size;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Vẽ cánh hoa pixel 2x2 hoặc 3x2 với góc bo pixel
        ctx.fillRect(px, py, w, h);
        if (w >= 2 && h >= 2) {
          // Điểm nhấn viền màu nhẹ
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(px, py, 1, 1);
        }
      }
    } else if (weatherType === 'rain') {
      // 1. Vẽ các vệt mưa rơi nghiêng
      for (const r of this.rainDrops) {
        const rx = Math.floor(r.x);
        const ry = Math.floor(r.y);

        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.floor(r.vx * 1.5), ry + r.length);
        ctx.stroke();
      }

      // 2. Vẽ gợn nước li ti chạm đất
      for (const s of this.splashes) {
        ctx.globalAlpha = (s.life / s.maxLife) * 0.45;
        ctx.fillStyle = s.color;
        const progress = 1 - s.life / s.maxLife;
        const spread = Math.floor(progress * 2);
        ctx.fillRect(s.x - spread, s.y, 1 + spread * 2, 1);
      }
    } else if (weatherType === 'fireflies') {
      // Đom đóm đêm lập lòe êm dịu (chu kỳ chậm an toàn cho mắt)
      for (const f of this.fireflies) {
        const glow = Math.sin(f.phase) * 0.45 + 0.55;
        const alpha = Math.max(0.12, Math.min(0.9, f.baseAlpha * glow));
        const fx = Math.floor(f.x);
        const fy = Math.floor(f.y);

        // Hạt đom đóm trung tâm
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#b4f078';
        ctx.fillRect(fx, fy, 2, 2);

        // Hào quang vàng chanh mờ ảo
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(fx - 1, fy - 1, 4, 4);
      }
    }

    ctx.restore();
  }
}
