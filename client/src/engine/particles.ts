/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG HẠT ĐỒ HỌA & HIỆU ỨNG ARCADE (PARTICLE SYSTEM & VFX)
 * Quản lý tia lửa sao trúng đòn (hit sparks), bụi đất (dust puff), vệt kim chỉ (thread trail),
 * tia tốc độ viền màn hình (speed lines), và chữ bay chiến đấu (floating combat text).
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'dust' | 'thread' | 'star';
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public speedLineIntensity = 0; // 0 - 1.0 khi đánh trúng mạnh

  /**
   * Sinh cụm tia lửa sao vàng khi đánh trúng quái (Hit Sparks)
   */
  public spawnHitSparks(x: number, y: number, count = 8): void {
    const colors = ['#fedb5b', '#f7af34', '#ffffff', '#e88827'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: 2 + Math.floor(Math.random() * 2),
        life: 15 + Math.floor(Math.random() * 10),
        maxLife: 25,
        type: 'spark',
      });
    }
    // Kích hoạt tia tốc độ rìa màn hình
    this.speedLineIntensity = 1.0;
  }

  /**
   * Sinh bụi đất khi tiếp đất hoặc đổi hướng (Dust Puff)
   */
  public spawnDustPuff(x: number, y: number, count = 4): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.3 - Math.random() * 0.8,
        color: '#947a6b',
        size: 2,
        life: 12,
        maxLife: 12,
        type: 'dust',
      });
    }
  }

  /**
   * Sinh vệt lụa kim chỉ khi nhân vật tung chiêu (Thread Trail)
   */
  public spawnThreadTrail(x: number, y: number, color = '#40bfa3'): void {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color,
      size: 2,
      life: 10,
      maxLife: 10,
      type: 'thread',
    });
  }

  /**
   * Thêm chữ bay nổi trên màn hình (Floating Text)
   */
  public spawnFloatingText(x: number, y: number, text: string, color = '#fedb5b'): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 30,
      maxLife: 30,
      scale: 1.2,
    });
  }

  public update(): void {
    // 1. Cập nhật particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.type === 'spark') {
        p.vx *= 0.92;
        p.vy += 0.08; // Trọng lực nhẹ
      } else if (p.type === 'dust') {
        p.vy += 0.04;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Cập nhật floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.6; // Bay từ từ lên trên
      ft.life--;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 3. Giảm dần tia tốc độ rìa màn hình
    if (this.speedLineIntensity > 0) {
      this.speedLineIntensity = Math.max(0, this.speedLineIntensity - 0.1);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX = 0): void {
    // 1. Vẽ các hạt
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillRect(Math.round(p.x - cameraX), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // 2. Vẽ chữ bay nổi (Floating Combat Text)
    ctx.font = 'bold 11px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ft of this.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      const rx = Math.round(ft.x - cameraX);
      const ry = Math.round(ft.y);

      // Viền tím than 1px
      ctx.fillStyle = '#161426';
      ctx.fillText(ft.text, rx - 1, ry);
      ctx.fillText(ft.text, rx + 1, ry);
      ctx.fillText(ft.text, rx, ry - 1);
      ctx.fillText(ft.text, rx, ry + 1);

      // Lõi chữ sáng
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, rx, ry);
      ctx.restore();
    }

    // 3. Vẽ tia tốc độ ở rìa khi đánh trúng mạnh (Speed lines)
    if (this.speedLineIntensity > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.speedLineIntensity * 0.4;
      ctx.strokeStyle = '#fff39e';
      ctx.lineWidth = 1;

      // Tia tốc độ góc trái và phải
      for (let i = 0; i < 6; i++) {
        const y = 30 + i * 40;
        // Góc trái
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(35 + (i % 2) * 20, y + (i % 2 === 0 ? -5 : 5));
        ctx.stroke();

        // Góc phải
        ctx.beginPath();
        ctx.moveTo(480, y);
        ctx.lineTo(445 - (i % 2) * 20, y + (i % 2 === 0 ? 5 : -5));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  public clear(): void {
    this.particles = [];
    this.floatingTexts = [];
    this.speedLineIntensity = 0;
  }
}
