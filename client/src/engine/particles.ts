/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG HẠT ĐỒ HỌA & HIỆU ỨNG ARCADE CAO CẤP (OBJECT POOLED PARTICLE SYSTEM & VFX)
 * - Tối ưu hóa bộ nhớ: Dùng Object Pool cố định tối đa 300 hạt (0 cấp phát rác trong game loop).
 * - Đầy đủ hiệu ứng Game Feel:
 *   1. Hit sparks (6-10 hạt), slash arc (3 khung hình), chữ số sát thương nổi.
 *   2. Bụi di chuyển (dust puff) khi chạy & tiếp đất.
 *   3. Mảnh vỡ khiên trong suốt (crystal/glass shards) & sóng xung kích mở rộng khi vỡ khiên.
 *   4. Tim Ký Ức vỡ vụn thành mảnh khi mất máu.
 *   5. Vệt chỉ phát sáng & hạt lấp lánh (sparkle stars).
 *   6. Chữ nổi chiêu thức "NÉM KIM CHỈ!!" phóng to rồi thu nhỏ kèm vệt sáng.
 *   7. Chùm chỉ bung ra ở các pha Boss & sợi chỉ tan biến thành hạt vàng khi Boss bại trận.
 *   8. Mảnh ghép bay theo đường cong về ô HUD.
 * - An toàn tiếp cận: Tắt hoặc làm dịu toàn bộ tia tốc độ & chớp giật khi bật "Giảm hiệu ứng".
 */

import { AccessibilityManager } from './accessibility.ts';

export type ParticleType =
  | 'spark'
  | 'dust'
  | 'thread'
  | 'star'
  | 'shockwave'
  | 'cross_flash'
  | 'slash_arc'
  | 'shard'
  | 'sparkle'
  | 'flying_item'
  | 'flying_card';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  secondaryColor?: string;
  size: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  radius?: number;
  maxRadius?: number;
  angle?: number;
  arcSpan?: number;
  rot?: number;
  vRot?: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  controlY?: number;
  progress?: number;
  onArrive?: () => void;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
  targetScale?: number;
  isCallout?: boolean;
}

export class ParticleSystem {
  private static instance: ParticleSystem | null = null;
  public static readonly MAX_PARTICLES = 300;
  public static readonly MAX_TEXTS = 30;

  // Pre-allocated Object Pool
  private particlePool: Particle[] = [];
  private textPool: FloatingText[] = [];

  public speedLineIntensity = 0; // 0 - 1.0 khi đánh trúng mạnh

  constructor() {
    this.initPools();
    ParticleSystem.instance = this;
  }

  public static getInstance(): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem();
    }
    return ParticleSystem.instance;
  }

  private initPools(): void {
    for (let i = 0; i < ParticleSystem.MAX_PARTICLES; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        size: 2,
        life: 0,
        maxLife: 1,
        type: 'spark',
      });
    }

    for (let i = 0; i < ParticleSystem.MAX_TEXTS; i++) {
      this.textPool.push({
        active: false,
        x: 0,
        y: 0,
        text: '',
        color: '#fedb5b',
        life: 0,
        maxLife: 30,
        scale: 1,
      });
    }
  }

  /**
   * Lấy một hạt chưa hoạt động từ pool
   */
  private acquireParticle(): Particle | null {
    for (let i = 0; i < ParticleSystem.MAX_PARTICLES; i++) {
      if (!this.particlePool[i].active) {
        this.particlePool[i].active = true;
        return this.particlePool[i];
      }
    }
    return null;
  }

  /**
   * Lấy một text chưa hoạt động từ pool
   */
  private acquireText(): FloatingText | null {
    for (let i = 0; i < ParticleSystem.MAX_TEXTS; i++) {
      if (!this.textPool[i].active) {
        this.textPool[i].active = true;
        return this.textPool[i];
      }
    }
    return null;
  }

  public get activeParticleCount(): number {
    let count = 0;
    for (let i = 0; i < ParticleSystem.MAX_PARTICLES; i++) {
      if (this.particlePool[i].active) count++;
    }
    return count;
  }

  // ============================================================================
  // CÁC HÀM SPAWN HIỆU ỨNG CHI TIẾT
  // ============================================================================

  /**
   * 1. Sinh cụm tia lửa khi đánh trúng (6-10 hạt, tắt dần)
   */
  public spawnHitSparks(x: number, y: number, count = 8, dir = 1): void {
    const a11y = AccessibilityManager.getInstance();
    const actualCount = a11y.settings.reduceMotion ? Math.min(4, count) : count;
    const colors = ['#fedb5b', '#f7af34', '#ffffff', '#e88827'];

    for (let i = 0; i < actualCount; i++) {
      const p = this.acquireParticle();
      if (!p) break;

      const baseAngle = dir > 0 ? 0 : Math.PI;
      const angle = baseAngle + (Math.random() - 0.5) * 1.5;
      const speed = (a11y.settings.reduceMotion ? 1.4 : 2.2) + Math.random() * 2.6;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.6;
      p.color = colors[i % colors.length];
      p.size = 2 + Math.floor(Math.random() * 2);
      p.life = 12 + Math.floor(Math.random() * 8);
      p.maxLife = p.life;
      p.type = 'spark';
    }

    if (!a11y.settings.reduceMotion) {
      this.speedLineIntensity = Math.max(this.speedLineIntensity, 0.45);
    }
  }

  /**
   * Vệt cung đòn đánh (Slash Arc) kéo dài 3 khung hình
   */
  public spawnSlashTrail(
    x: number,
    y: number,
    comboStep = 1,
    isFinisher = false,
    flipX = false
  ): void {
    const p = this.acquireParticle();
    if (!p) return;

    const shockwaveColor = isFinisher ? '#fedb5b' : (comboStep === 2 ? '#77e0b5' : '#ffffff');
    const arcAngle = isFinisher
      ? (flipX ? Math.PI * 0.72 : -Math.PI * 0.28)
      : comboStep === 2
      ? (flipX ? Math.PI * 0.95 : -Math.PI * 0.05)
      : (flipX ? Math.PI * 0.58 : -Math.PI * 0.42);

    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.color = shockwaveColor;
    p.secondaryColor = isFinisher ? '#bf363b' : '#ffffff';
    p.size = isFinisher ? 3.5 : 2.5;
    p.radius = isFinisher ? 32 : (comboStep === 2 ? 26 : 20);
    p.angle = arcAngle;
    p.arcSpan = isFinisher ? Math.PI * 0.88 : Math.PI * 0.72;
    p.life = 3; // Đúng chuẩn 3 khung hình
    p.maxLife = 3;
    p.type = 'slash_arc';
  }

  /**
   * Sinh sóng xung kích lan tỏa (Impact Shockwave Ring)
   */
  public spawnImpactShockwave(x: number, y: number, color = '#fedb5b', maxRadius = 32): void {
    const p = this.acquireParticle();
    if (p) {
      p.x = x;
      p.y = y;
      p.vx = 0;
      p.vy = 0;
      p.color = color;
      p.size = 2.5;
      p.radius = 4;
      p.maxRadius = maxRadius;
      p.life = 10;
      p.maxLife = 10;
      p.type = 'shockwave';
    }

    const cf = this.acquireParticle();
    if (cf) {
      cf.x = x;
      cf.y = y;
      cf.vx = 0;
      cf.vy = 0;
      cf.color = '#ffffff';
      cf.size = maxRadius * 0.85;
      cf.life = 6;
      cf.maxLife = 6;
      cf.type = 'cross_flash';
    }
  }

  /**
   * Hiệu ứng va chạm toàn diện cho đòn đánh (Slash visual)
   */
  public spawnSlashHitVisual(
    x: number,
    y: number,
    isFinisher = false,
    comboStep = 1,
    flipX = false
  ): void {
    this.spawnSlashTrail(x, y, comboStep, isFinisher, flipX);
    this.spawnHitSparks(x, y, isFinisher ? 10 : (comboStep === 2 ? 8 : 6), flipX ? -1 : 1);
    this.spawnImpactShockwave(
      x,
      y,
      isFinisher ? '#fedb5b' : (comboStep === 2 ? '#77e0b5' : '#ffffff'),
      isFinisher ? 36 : 24
    );
  }

  /**
   * 2. Bụi khi chạy và hạ cánh (Dust Puff 4-6 hạt)
   */
  public spawnDustPuff(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle();
      if (!p) break;

      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 1.2;
      p.vy = -0.3 - Math.random() * 0.6;
      p.color = Math.random() > 0.5 ? '#947a6b' : '#c2a591';
      p.size = 2;
      p.life = 10 + Math.floor(Math.random() * 4);
      p.maxLife = p.life;
      p.type = 'dust';
    }
  }

  /**
   * 3. Mảnh vỡ khiên trong suốt (Shield Glass Shards) khi phá khiên
   */
  public spawnShieldShards(x: number, y: number, count = 14, color = '#77e0b5'): void {
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle();
      if (!p) break;

      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.8 + Math.random() * 3.4;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.2;
      p.color = i % 2 === 0 ? color : '#ffffff';
      p.size = 3 + Math.floor(Math.random() * 3);
      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 0.3;
      p.life = 18 + Math.floor(Math.random() * 12);
      p.maxLife = p.life;
      p.type = 'shard';
    }
  }

  /**
   * 4. Mảnh vỡ tim Ký Ức khi bị trúng đòn
   */
  public spawnHeartShards(x: number, y: number, count = 6): void {
    const heartColors = ['#bf363b', '#f4a7b9', '#fedb5b'];
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle();
      if (!p) break;

      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.6;
      const speed = 1.4 + Math.random() * 2.2;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.0;
      p.color = heartColors[i % heartColors.length];
      p.size = 2.5;
      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 0.25;
      p.life = 16 + Math.floor(Math.random() * 8);
      p.maxLife = p.life;
      p.type = 'shard';
    }
  }

  /**
   * 5. Hạt lấp lánh ngôi sao (Sparkle Stars) cho đường kim chỉ & đồ nhặt
   */
  public spawnSparkle(x: number, y: number, color = '#fedb5b'): void {
    const p = this.acquireParticle();
    if (!p) return;

    p.x = x + (Math.random() - 0.5) * 6;
    p.y = y + (Math.random() - 0.5) * 6;
    p.vx = (Math.random() - 0.5) * 0.4;
    p.vy = (Math.random() - 0.5) * 0.4;
    p.color = color;
    p.size = 2;
    p.life = 12;
    p.maxLife = 12;
    p.type = 'sparkle';
  }

  /**
   * 6. Vệt lụa kim chỉ khi tung chiêu (Thread Trail)
   */
  public spawnThreadTrail(x: number, y: number, color = '#40bfa3'): void {
    const p = this.acquireParticle();
    if (!p) return;

    p.x = x;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 0.4;
    p.vy = (Math.random() - 0.5) * 0.4;
    p.color = color;
    p.size = 2;
    p.life = 10;
    p.maxLife = 10;
    p.type = 'thread';

    // Kèm 1 hạt sao lấp lánh nhẹ
    if (Math.random() < 0.4) {
      this.spawnSparkle(x, y, '#fedb5b');
    }
  }

  /**
   * 7. Chùm sợi chỉ bung ra khi Boss đổi pha (Thread Burst)
   */
  public spawnThreadBurst(x: number, y: number, count = 24): void {
    const threadColors = ['#bf363b', '#e88827', '#fedb5b', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle();
      if (!p) break;

      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2.4 + Math.random() * 3.6;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.color = threadColors[i % threadColors.length];
      p.size = 2.5;
      p.life = 24 + Math.floor(Math.random() * 12);
      p.maxLife = p.life;
      p.type = 'thread';
    }
  }

  /**
   * 8. Sợi chỉ tan thành hạt vàng khi Boss hạ màn (Golden Thread Dissolve)
   */
  public spawnGoldenThreadDissolve(x: number, y: number, count = 35): void {
    for (let i = 0; i < count; i++) {
      const p = this.acquireParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.8;

      p.x = x + (Math.random() - 0.5) * 60;
      p.y = y + (Math.random() - 0.5) * 60;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.5;
      p.color = Math.random() > 0.3 ? '#fedb5b' : '#ffffff';
      p.size = 2 + Math.floor(Math.random() * 2);
      p.life = 35 + Math.floor(Math.random() * 20);
      p.maxLife = p.life;
      p.type = 'sparkle';
    }
  }

  /**
   * 9. Mảnh ghép bay theo đường cong về ô HUD
   */
  public spawnFlyingItem(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    color = '#fedb5b',
    onArrive?: () => void
  ): void {
    const p = this.acquireParticle();
    if (!p) return;

    p.x = startX;
    p.y = startY;
    p.startX = startX;
    p.startY = startY;
    p.targetX = targetX;
    p.targetY = targetY;
    p.controlY = Math.min(startY, targetY) - 40;
    p.progress = 0;
    p.color = color;
    p.size = 4;
    p.life = 28;
    p.maxLife = 28;
    p.type = 'flying_item';
    p.onArrive = onArrive;
  }

  /**
   * 9.5 Thẻ Sự Thật bay theo đường cong vào Khiên Hiểu Lầm (Yêu cầu 4)
   */
  public spawnCurvedCard(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    isCorrect: boolean,
    onArrive?: () => void
  ): void {
    const p = this.acquireParticle();
    if (!p) return;

    p.x = startX;
    p.y = startY;
    p.startX = startX;
    p.startY = startY;
    p.targetX = targetX;
    p.targetY = targetY;
    p.controlY = Math.min(startY, targetY) - 52;
    p.progress = 0;
    p.color = isCorrect ? '#77e0b5' : '#ba5e1b';
    p.secondaryColor = isCorrect ? '#fedb5b' : '#f7af34';
    p.size = 12;
    p.life = 20; // 20 frames = 0.33s bay theo đường cong
    p.maxLife = 20;
    p.type = 'flying_card';
    p.onArrive = onArrive;
  }

  /**
   * 10. Chữ nổi chiến đấu bình thường (Floating Text)
   * Thông báo "-1 KÝ ỨC" tự biến mất sau 1,2 giây (72 frame)
   */
  public spawnFloatingText(x: number, y: number, text: string, color = '#fedb5b', customLife?: number): void {
    const ft = this.acquireText();
    if (!ft) return;

    ft.x = x;
    ft.y = y;
    ft.text = text;
    ft.color = color;
    const duration = customLife ?? (text.includes('KÝ ỨC') ? 72 : 36);
    ft.life = duration;
    ft.maxLife = duration;
    ft.scale = 1.0;
    ft.targetScale = 1.0;
    ft.isCallout = false;
  }

  /**
   * 11. Chữ nổi chiêu thức phóng to rồi nhỏ dần kèm vệt sáng ("NÉM KIM CHỈ!!")
   */
  public spawnSkillCallout(x: number, y: number, text = 'NÉM KIM CHỈ!!'): void {
    const ft = this.acquireText();
    if (!ft) return;

    ft.x = x;
    ft.y = y - 30;
    ft.text = text;
    ft.color = '#77e0b5';
    ft.life = 36;
    ft.maxLife = 36;
    ft.scale = 1.8; // Bắt đầu cực lớn
    ft.targetScale = 1.0;
    ft.isCallout = true;
  }

  // ============================================================================
  // CẬP NHẬT VÀ DỰNG HÌNH (UPDATE & DRAW)
  // ============================================================================

  public update(inHitStop = false): void {
    // 1. Cập nhật Particles trong pool
    for (let i = 0; i < ParticleSystem.MAX_PARTICLES; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      p.life--;
      if (p.life <= 0) {
        if (p.type === 'flying_item' && p.onArrive) {
          p.onArrive();
        }
        p.active = false;
        continue;
      }

      if (p.type === 'flying_item' || p.type === 'flying_card') {
        p.progress = 1 - (p.life / p.maxLife);
        const t = p.progress;
        const invT = 1 - t;
        // Quadratic Bezier curve
        p.x = invT * invT * (p.startX || 0) + 2 * invT * t * ((p.startX || 0) + (p.targetX || 0)) / 2 + t * t * (p.targetX || 0);
        p.y = invT * invT * (p.startY || 0) + 2 * invT * t * (p.controlY || 0) + t * t * (p.targetY || 0);
        if (p.type === 'flying_card' && Math.random() < 0.35) {
          this.spawnSparkle(p.x, p.y, p.color);
        }
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'spark') {
        p.vx *= 0.92;
        p.vy += 0.08;
      } else if (p.type === 'shard') {
        p.vx *= 0.94;
        p.vy += 0.12; // Rơi theo trọng lực
        if (p.rot !== undefined && p.vRot !== undefined) {
          p.rot += p.vRot;
        }
      } else if (p.type === 'dust') {
        p.vy += 0.04;
      } else if (p.type === 'shockwave' && p.radius !== undefined && p.maxRadius !== undefined) {
        p.radius += (p.maxRadius - p.radius) * 0.38 + 1.6;
      } else if (p.type === 'slash_arc' && p.radius !== undefined) {
        p.radius += 0.8;
      }
    }

    // 2. Cập nhật Floating Texts
    for (let i = 0; i < ParticleSystem.MAX_TEXTS; i++) {
      const ft = this.textPool[i];
      if (!ft.active) continue;

      if (!inHitStop) {
        ft.y -= ft.isCallout ? 0.35 : 0.65;
        ft.life--;
        if (ft.isCallout && ft.scale > 1.0) {
          ft.scale += (1.0 - ft.scale) * 0.15; // Thu nhỏ dần về 1.0
        }
      }

      if (ft.life <= 0) {
        ft.active = false;
      }
    }

    // 3. Giảm dần tia tốc độ rìa màn hình
    if (this.speedLineIntensity > 0) {
      this.speedLineIntensity = Math.max(0, this.speedLineIntensity - (inHitStop ? 0.03 : 0.08));
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX = 0): void {
    // 1. Vẽ các hạt đang active trong pool
    for (let i = 0; i < ParticleSystem.MAX_PARTICLES; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      const rx = Math.round(p.x - cameraX);
      const ry = Math.round(p.y);

      if (p.type === 'shockwave' && p.radius !== undefined) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 3.2 * alpha);
        ctx.beginPath();
        ctx.arc(rx, ry, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx, ry, Math.max(1, p.radius * 0.72), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'slash_arc' && p.radius !== undefined && p.angle !== undefined && p.arcSpan !== undefined) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha * 1.2);
        ctx.translate(rx, ry);
        ctx.rotate(p.angle);

        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.5, p.size * alpha);
        ctx.lineCap = 'round';
        ctx.beginPath();
        const r = p.radius * (0.88 + 0.2 * (1 - alpha));
        ctx.arc(0, 0, r, -p.arcSpan / 2, p.arcSpan / 2);
        ctx.stroke();

        if (p.secondaryColor) {
          ctx.strokeStyle = p.secondaryColor;
          ctx.lineWidth = Math.max(1, (p.size - 1) * alpha);
          ctx.beginPath();
          ctx.arc(0, 0, r, -p.arcSpan * 0.35, p.arcSpan * 0.35);
          ctx.stroke();
        }
        ctx.restore();
      } else if (p.type === 'cross_flash') {
        ctx.save();
        ctx.globalAlpha = alpha;
        const arm = p.size * (p.life / p.maxLife);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(rx - arm), Math.round(ry - 1), Math.round(arm * 2), 2);
        ctx.fillRect(Math.round(rx - 1), Math.round(ry - arm), 2, Math.round(arm * 2));
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(Math.round(rx - 2), Math.round(ry - 2), 4, 4);
        ctx.restore();
      } else if (p.type === 'shard') {
        // Mảnh kính/ngọc vỡ hình tam giác trong suốt xoay tròn
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.translate(rx, ry);
        if (p.rot !== undefined) ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.8, p.size * 0.7);
        ctx.lineTo(-p.size * 0.8, p.size * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'sparkle') {
        // Hạt lấp lánh hình ngôi sao 4 cánh
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(rx - 1, ry - 3, 2, 6);
        ctx.fillRect(rx - 3, ry - 1, 6, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
        ctx.restore();
      } else if (p.type === 'flying_item') {
        // Mảnh ghép ngọc bay
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.fillRect(rx - 2, ry - 2, 5, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
        ctx.restore();
      } else if (p.type === 'flying_card') {
        // Thẻ Sự Thật đang bay xoay nhẹ theo đường cong
        ctx.save();
        const cardAlpha = Math.min(1, (p.life / p.maxLife) * 1.6);
        ctx.globalAlpha = cardAlpha;
        ctx.translate(rx, ry);
        const tilt = p.progress ? (p.progress - 0.5) * 0.8 : 0;
        ctx.rotate(tilt);
        // Viền thẻ vàng/cam
        ctx.fillStyle = p.secondaryColor || '#fedb5b';
        ctx.fillRect(-6, -9, 12, 18);
        // Lõi thẻ ngọc teal/đỏ
        ctx.fillStyle = p.color;
        ctx.fillRect(-5, -8, 10, 16);
        // Hoa văn chữ pixel trắng
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -4, 4, 8);
        ctx.fillRect(-3, -2, 6, 2);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(rx, ry, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1.0;

    // 2. Vẽ chữ bay nổi (Floating Combat Text & Skill Callout)
    for (let i = 0; i < ParticleSystem.MAX_TEXTS; i++) {
      const ft = this.textPool[i];
      if (!ft.active) continue;

      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      const rx = Math.round(ft.x - cameraX);
      const ry = Math.round(ft.y);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (ft.isCallout) {
        // Chữ chiêu thức lớn rực sáng
        ctx.font = `bold ${Math.round(13 * ft.scale)}px "Pixelify Sans", monospace`;
        // Viền bóng tím đậm dày
        ctx.fillStyle = '#161426';
        for (let ox = -2; ox <= 2; ox++) {
          for (let oy = -2; oy <= 2; oy++) {
            if (ox !== 0 || oy !== 0) ctx.fillText(ft.text, rx + ox, ry + oy);
          }
        }
        // Vệt hào quang lụa
        ctx.fillStyle = '#fedb5b';
        ctx.fillText(ft.text, rx, ry + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ft.text, rx, ry);
      } else {
        ctx.font = 'bold 11px "Pixelify Sans", monospace';
        ctx.fillStyle = '#161426';
        ctx.fillText(ft.text, rx - 1, ry);
        ctx.fillText(ft.text, rx + 1, ry);
        ctx.fillText(ft.text, rx, ry - 1);
        ctx.fillText(ft.text, rx, ry + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, rx, ry);
      }

      ctx.restore();
    }
  }

  /**
   * Vẽ lớp phủ toàn màn hình (Speed Lines) an toàn cho người nhạy cảm ánh sáng
   */
  public drawScreenOverlays(ctx: CanvasRenderingContext2D): void {
    const a11y = AccessibilityManager.getInstance();
    if (a11y.settings.reduceMotion) return;

    if (this.speedLineIntensity > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.speedLineIntensity * 0.32;
      ctx.strokeStyle = '#fff39e';
      ctx.lineWidth = 1;

      for (let i = 0; i < 7; i++) {
        const y = 20 + i * 35;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(40 + (i % 2) * 20, y + (i % 2 === 0 ? -5 : 5));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(480, y);
        ctx.lineTo(440 - (i % 2) * 20, y + (i % 2 === 0 ? 5 : -5));
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(254, 219, 91, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, 478, 268);
      ctx.restore();
    }
  }

  public clear(): void {
    for (let i = 0; i < ParticleSystem.MAX_PARTICLES; i++) {
      this.particlePool[i].active = false;
    }
    for (let i = 0; i < ParticleSystem.MAX_TEXTS; i++) {
      this.textPool[i].active = false;
    }
    this.speedLineIntensity = 0;
  }
}
