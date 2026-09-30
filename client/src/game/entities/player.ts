/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * THỰC THỂ NHÂN VẬT CHÍNH (PLAYER ENTITY)
 * Máy trạng thái hoàn chỉnh: IDLE, RUN, JUMP, FALL, ATTACK_1, ATTACK_2, ATTACK_3, DODGE, HURT, SPECIAL.
 * Combo 3 đòn (phím J) có cửa sổ nhịp (combo window), Chiêu đặc biệt (phím K) tiêu hao Chỉ,
 * Né tránh (phím L) miễn nhiễm sát thương.
 */

import { InputManager } from '../../engine/input.ts';
import { AudioManager } from '../../engine/audio.ts';
import { ParticleSystem } from '../../engine/particles.ts';
import { GameCamera } from '../../engine/camera.ts';
import { PhysicsEngine, RectAABB } from '../../engine/physics.ts';

export type PlayerState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'attack_1'
  | 'attack_2'
  | 'attack_3'
  | 'special'
  | 'dodge'
  | 'hurt';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  damage: number;
  life: number;
}

export class Player {
  public x = 120;
  public y = PhysicsEngine.GROUND_Y;
  public prevY = PhysicsEngine.GROUND_Y;
  public vx = 0;
  public vy = 0;
  public flipX = false;

  public state: PlayerState = 'idle';
  public stateTime = 0;
  public animFrame = 0;

  // Thuộc tính chiến đấu
  public speed = 2.4;
  public jumpForce = -7.5;
  public isGrounded = true;

  // Chỉ số nhân vật
  public kyUcHearts = 5; // Sinh lực Ký Ức (5 tim)
  public maxHearts = 5;
  public chiEnergy = 80; // Năng lượng Chỉ (0 - 100)
  public maxChi = 100;

  // Hệ thống Combo 3 đòn
  public comboStep = 0; // 0: không đánh, 1: đòn 1, 2: đòn 2, 3: đòn 3
  public comboBuffer = false;
  public comboTimer = 0;

  // Hệ thống Né tránh (Dodge)
  public dodgeCooldown = 0;
  public invincibleTimer = 0;

  // Danh sách phi tiêu kim chỉ đang bay
  public projectiles: Projectile[] = [];

  constructor() {}

  /**
   * Lấy hộp va chạm nhận sát thương (Hurtbox)
   */
  public getHurtbox(): RectAABB {
    return {
      x: this.x - 12,
      y: this.y - 42,
      width: 24,
      height: 42,
    };
  }

  /**
   * Lấy hộp va chạm gây sát thương của đòn đánh hiện tại (Hitbox)
   */
  public getAttackHitbox(): RectAABB | null {
    if (this.state === 'attack_1') {
      const reachX = this.flipX ? this.x - 36 : this.x + 8;
      return { x: reachX, y: this.y - 32, width: 28, height: 20 };
    }
    if (this.state === 'attack_2') {
      const reachX = this.flipX ? this.x - 40 : this.x + 8;
      return { x: reachX, y: this.y - 25, width: 32, height: 22 };
    }
    if (this.state === 'attack_3') {
      const reachX = this.flipX ? this.x - 46 : this.x + 8;
      return { x: reachX, y: this.y - 35, width: 38, height: 30 };
    }
    return null;
  }

  public update(
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem,
    camera: GameCamera,
    physics: PhysicsEngine
  ): void {
    this.prevY = this.y;
    this.stateTime++;

    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;

    // 1. Xử lý Trạng thái Đang Né (Dodge)
    if (this.state === 'dodge') {
      this.vx = (this.flipX ? -1 : 1) * 4.8;
      // Sinh vệt dư ảnh lụa
      if (this.stateTime % 2 === 0) {
        particles.spawnThreadTrail(this.x, this.y - 20, '#f7af34');
      }
      if (this.stateTime > 12) {
        this.state = 'idle';
        this.vx = 0;
      }
    }
    // 2. Xử lý Trạng thái Đòn Đánh Combo (Attack 1, 2, 3)
    else if (this.state === 'attack_1' || this.state === 'attack_2' || this.state === 'attack_3') {
      this.vx *= 0.8; // Giảm tốc khi ra đòn

      // Buffer đòn đánh tiếp theo nếu người chơi nhấn phím J trong cửa sổ combo
      if (input.isPressed('attack')) {
        this.comboBuffer = true;
      }

      const attackDuration = this.state === 'attack_3' ? 18 : 14;
      if (this.stateTime >= attackDuration) {
        if (this.comboBuffer && this.state === 'attack_1') {
          this.triggerAttack(2, audio, camera, particles);
        } else if (this.comboBuffer && this.state === 'attack_2') {
          this.triggerAttack(3, audio, camera, particles);
        } else {
          this.state = 'idle';
          this.comboStep = 0;
          this.comboBuffer = false;
        }
      }
    }
    // 3. Xử lý Chiêu Đặc Biệt "NÉM KIM CHỈ!!"
    else if (this.state === 'special') {
      this.vx = 0;
      if (this.stateTime >= 16) {
        this.state = 'idle';
      }
    }
    // 4. Xử lý Bị Đánh (Hurt / Knockback)
    else if (this.state === 'hurt') {
      this.vx *= 0.88;
      if (this.stateTime > 15) {
        this.state = 'idle';
      }
    }
    // 5. Trạng thái Di Chuyển Bình Thường (Idle, Run, Jump, Fall)
    else {
      // Di chuyển trái / phải
      if (input.isDown('left')) {
        this.vx = -this.speed;
        this.flipX = true;
        if (this.isGrounded) this.state = 'run';
      } else if (input.isDown('right')) {
        this.vx = this.speed;
        this.flipX = false;
        if (this.isGrounded) this.state = 'run';
      } else {
        this.vx = 0;
        if (this.isGrounded) this.state = 'idle';
      }

      // Nhảy (Phím W hoặc Space)
      if (input.isPressed('jump') && this.isGrounded) {
        this.vy = this.jumpForce;
        this.isGrounded = false;
        this.state = 'jump';
        audio.playJump();
        particles.spawnDustPuff(this.x, this.y);
      }

      // Đánh thường (Phím J)
      if (input.isPressed('attack')) {
        this.triggerAttack(1, audio, camera, particles);
      }

      // Chiêu đặc biệt (Phím K) - Tiêu hao 30 Chỉ
      if (input.isPressed('special')) {
        if (this.chiEnergy >= 30) {
          this.chiEnergy -= 30;
          this.state = 'special';
          this.stateTime = 0;
          audio.playSpecialSkill();
          camera.triggerShake(4, 10);
          particles.spawnFloatingText(this.x, this.y - 45, 'NÉM KIM CHỈ!!', '#fedb5b');

          // Phóng tia kim chỉ vàng kim
          const dir = this.flipX ? -1 : 1;
          this.projectiles.push({
            x: this.x + dir * 18,
            y: this.y - 24,
            vx: dir * 7.5,
            width: 22,
            height: 8,
            damage: 35,
            life: 45,
          });
        } else {
          particles.spawnFloatingText(this.x, this.y - 40, 'CHƯA ĐỦ CHỈ!', '#bf363b');
        }
      }

      // Né đòn (Phím L)
      if (input.isPressed('dodge') && this.dodgeCooldown <= 0) {
        this.state = 'dodge';
        this.stateTime = 0;
        this.dodgeCooldown = 40; // Cooldown né
        this.invincibleTimer = 16;
        audio.playDodge();
        particles.spawnDustPuff(this.x, this.y);
      }
    }

    // Áp dụng trọng lực
    this.vy += PhysicsEngine.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Giới hạn biên màn chơi
    this.x = Math.max(16, Math.min(camera.maxX - 16, this.x));

    // Kiểm tra va chạm sàn và bệ
    const groundY = physics.checkGroundCollision(this.x, this.y, this.prevY);
    if (groundY !== null) {
      if (!this.isGrounded && this.vy > 0) {
        particles.spawnDustPuff(this.x, this.y);
      }
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
      if (this.state === 'jump' || this.state === 'fall') {
        this.state = this.vx !== 0 ? 'run' : 'idle';
      }
    } else {
      this.isGrounded = false;
      if (this.state !== 'attack_1' && this.state !== 'attack_2' && this.state !== 'attack_3' && this.state !== 'dodge' && this.state !== 'special') {
        this.state = this.vy < 0 ? 'jump' : 'fall';
      }
    }

    // Cập nhật các đường đạn phi tiêu kim chỉ
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.life--;
      particles.spawnThreadTrail(p.x, p.y, '#f7af34');
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private triggerAttack(
    step: number,
    audio: AudioManager,
    camera: GameCamera,
    particles: ParticleSystem
  ): void {
    this.comboStep = step;
    this.comboBuffer = false;
    this.stateTime = 0;
    audio.playAttackSwing();

    if (step === 1) {
      this.state = 'attack_1';
    } else if (step === 2) {
      this.state = 'attack_2';
      camera.triggerShake(2, 6);
    } else if (step === 3) {
      this.state = 'attack_3';
      camera.triggerShake(4, 10);
      particles.spawnFloatingText(this.x, this.y - 45, 'HOA SEN KHÍ!', '#40bfa3');
    }
  }

  /**
   * Nhân vật nhận sát thương
   */
  public takeDamage(
    amount: number,
    fromX: number,
    audio: AudioManager,
    camera: GameCamera,
    particles: ParticleSystem
  ): void {
    if (this.invincibleTimer > 0 || this.state === 'dodge') return;

    this.kyUcHearts = Math.max(0, this.kyUcHearts - amount);
    this.invincibleTimer = 45; // Nhấp nháy bất tử 45 frame (~0.75s)
    this.state = 'hurt';
    this.stateTime = 0;

    // Đẩy lùi (Knockback) ngược hướng va chạm
    const knockDir = this.x < fromX ? -1 : 1;
    this.vx = knockDir * 3.5;
    this.vy = -3.2;

    audio.playPlayerHurt();
    camera.triggerShake(5, 12);
    particles.spawnHitSparks(this.x, this.y - 20, 6);
    particles.spawnFloatingText(this.x, this.y - 35, `-${amount} KÝ ỨC`, '#bf363b');
  }

  /**
   * Hồi phục Chỉ khi đánh trúng
   */
  public onHitEnemy(particles: ParticleSystem, isFinisher = false): void {
    const gain = isFinisher ? 15 : 8;
    this.chiEnergy = Math.min(this.maxChi, this.chiEnergy + gain);
    particles.spawnFloatingText(this.x, this.y - 35, `+${gain} CHỈ`, '#77e0b5');
  }
}
