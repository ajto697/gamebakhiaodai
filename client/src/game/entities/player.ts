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
  | 'crouch'
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

  // Thời gian đệm nhảy (Jump Buffer & Coyote Time)
  public coyoteTimer = 0;
  public jumpBufferTimer = 0;
  public dropTimer = 0;

  // Chỉ số nhân vật
  public kyUcHearts = 5; // Sinh lực Ký Ức (5 tim)
  public maxHearts = 5;
  public chiEnergy = 80; // Năng lượng Chỉ (0 - 100)
  public maxChi = 100;

  // Hệ thống Combo 3 đòn
  public comboStep = 0; // 0: không đánh, 1: đòn 1, 2: đòn 2, 3: đòn 3
  public comboBuffer = false;
  public comboTimer = 0;
  public currentAttackId = 0;
  public hasHitEnemyThisAttack = false; // Mỗi đòn trong cùng một cú đánh chỉ tính một lần

  // Hệ thống Né tránh (Dodge) & Dư ảnh (Afterimage)
  public dodgeCooldown = 0;
  public invincibleTimer = 0;
  public flashTimer = 0; // Chớp trắng 2 khung khi bị trúng đòn
  public afterimages: Array<{ x: number; y: number; alpha: number; flipX: boolean }> = [];

  // Co giãn nhân vật khi nhảy / hạ cánh (Squash and Stretch 2-3 khung)
  public squashStretchX = 1.0;
  public squashStretchY = 1.0;

  // Danh sách phi tiêu kim chỉ đang bay
  public projectiles: Projectile[] = [];

  constructor() {}

  /**
   * Lấy hộp va chạm nhận sát thương (Hurtbox)
   * Khi cúi người (crouch): Hộp va chạm giảm một nửa chiều cao để né đòn
   */
  public getHurtbox(): RectAABB {
    if (this.state === 'crouch') {
      return {
        x: this.x - 12,
        y: this.y - 24,
        width: 24,
        height: 24,
      };
    }
    return {
      x: this.x - 12,
      y: this.y - 42,
      width: 24,
      height: 42,
    };
  }

  /**
   * Lấy hộp va chạm gây sát thương của đòn đánh hiện tại (Hitbox)
   * Tầm vươn thoải mái, bao phủ cả tầm đứng đánh và nhảy đánh
   */
  public getAttackHitbox(): RectAABB | null {
    if (this.state === 'attack_1') {
      const reachX = this.flipX ? this.x - 44 : this.x + 4;
      return { x: reachX, y: this.y - 36, width: 44, height: 36 };
    }
    if (this.state === 'attack_2') {
      const reachX = this.flipX ? this.x - 48 : this.x + 4;
      return { x: reachX, y: this.y - 34, width: 48, height: 36 };
    }
    if (this.state === 'attack_3') {
      const reachX = this.flipX ? this.x - 56 : this.x + 4;
      return { x: reachX, y: this.y - 42, width: 56, height: 42 };
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
    if (this.flashTimer > 0) this.flashTimer--;
    if (this.coyoteTimer > 0) this.coyoteTimer--;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;
    if (this.dropTimer > 0) this.dropTimer--;

    // Suy giảm dần độ co giãn nhân vật (Squash and Stretch về 1.0)
    this.squashStretchX += (1.0 - this.squashStretchX) * 0.35;
    this.squashStretchY += (1.0 - this.squashStretchY) * 0.35;

    // Suy giảm ảnh mờ (Afterimages) khi né
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha *= 0.74;
      if (this.afterimages[i].alpha < 0.04) {
        this.afterimages.splice(i, 1);
      }
    }

    // Nhận diện lệnh Nhảy (Phím W, Space, Mũi tên Lên, hoặc Nút Nhảy cảm ứng)
    const wantsJump = input.isPressed('jump') || input.isPressed('up');
    // Nhận diện lệnh Cúi (Phím S, Mũi tên Xuống, hoặc Nút Cúi cảm ứng)
    const wantsCrouch = input.isDown('crouch') || input.isDown('down');

    // Nạp đệm lệnh nhảy (Jump buffer 8 frames)
    if (wantsJump) {
      this.jumpBufferTimer = 8;
    }

    // 1. Xử lý Trạng thái Đang Né (Dodge)
    if (this.state === 'dodge') {
      this.vx = (this.flipX ? -1 : 1) * 4.8;
      // Sinh ảnh mờ (Afterimage) và vệt chỉ lụa
      if (this.stateTime % 2 === 0) {
        this.afterimages.push({
          x: this.x,
          y: this.y,
          alpha: 0.45,
          flipX: this.flipX,
        });
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
          this.hasHitEnemyThisAttack = false;
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
    // 4. Xử lý Bị Đánh (Hurt / Knockback có giảm tốc)
    else if (this.state === 'hurt') {
      this.vx *= 0.88;
      if (this.stateTime > 15) {
        this.state = 'idle';
      }
    }
    // 5. Trạng thái Di Chuyển Bình Thường (Idle, Run, Crouch, Jump, Fall)
    else {
      // 5.1 XỬ LÝ CÚI NGƯỜI (CROUCH: Phím S hoặc Mũi tên Xuống)
      if (wantsCrouch && this.isGrounded) {
        this.state = 'crouch';
        this.vx = 0;

        // Nếu đang cúi trên bệ nhảy và bấm phím Nhảy -> Tụt xuống bệ phía dưới (Drop through platform)
        if (this.jumpBufferTimer > 0) {
          if (this.y < PhysicsEngine.GROUND_Y - 4) {
            this.dropTimer = 14;
            this.jumpBufferTimer = 0;
            this.vy = 2;
            this.isGrounded = false;
            this.state = 'fall';
          } else {
            // Đang ở mặt đất: Nhảy vút lên từ tư thế cúi (Kèm giãn nhân vật Y)
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            this.state = 'jump';
            this.squashStretchX = 0.85; // Stretch Y
            this.squashStretchY = 1.25;
            audio.playJump();
            particles.spawnDustPuff(this.x, this.y, 5);
          }
        }
      } else {
        if (this.state === 'crouch') {
          this.state = 'idle';
        }

        // Di chuyển trái / phải
        if (input.isDown('left')) {
          this.vx = -this.speed;
          this.flipX = true;
          if (this.isGrounded) {
            this.state = 'run';
            if (this.stateTime % 7 === 0) {
              particles.spawnDustPuff(this.x + 8, this.y, 2);
            }
            if (this.stateTime % 14 === 0) {
              audio.playFootstep();
            }
          }
        } else if (input.isDown('right')) {
          this.vx = this.speed;
          this.flipX = false;
          if (this.isGrounded) {
            this.state = 'run';
            if (this.stateTime % 7 === 0) {
              particles.spawnDustPuff(this.x - 8, this.y, 2);
            }
            if (this.stateTime % 14 === 0) {
              audio.playFootstep();
            }
          }
        } else {
          this.vx = 0;
          if (this.isGrounded) this.state = 'idle';
        }

        // 5.2 XỬ LÝ NHẢY (Phím W, Mũi tên Lên, Space, hoặc Nút Nhảy cảm ứng)
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.vy = this.jumpForce;
          this.isGrounded = false;
          this.coyoteTimer = 0;
          this.jumpBufferTimer = 0;
          this.state = 'jump';
          this.squashStretchX = 0.85; // Stretch Y khi nhảy (2-3 khung)
          this.squashStretchY = 1.25;
          audio.playJump();
          particles.spawnDustPuff(this.x, this.y, 5);
        }
      }

      // Đánh thường (Phím J)
      if (input.isPressed('attack')) {
        this.triggerAttack(1, audio, camera, particles);
      }

      // Chiêu đặc biệt (Phím K) - Tiêu hao 30 Chỉ (Yêu cầu 2: chữ nổi "NÉM KIM CHỈ!!" phóng to rồi nhỏ dần, tối nền 10 khung)
      if (input.isPressed('special')) {
        if (this.chiEnergy >= 30) {
          this.chiEnergy -= 30;
          this.state = 'special';
          this.stateTime = 0;
          audio.playSkillK();
          camera.triggerDirectionalShake(this.flipX ? -1 : 1, 0, 3.2, 8);
          camera.triggerSpecialFocus(this.x, this.y - 20); // Tối nền 10 khung, tập trung nhân vật
          particles.spawnSkillCallout(this.x, this.y - 15, 'NÉM KIM CHỈ!!');

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
        particles.spawnDustPuff(this.x, this.y, 5);
      }
    }

    // Áp dụng trọng lực
    this.vy += PhysicsEngine.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Giới hạn biên màn chơi
    this.x = Math.max(16, Math.min(camera.maxX - 16, this.x));

    // Kiểm tra va chạm sàn và bệ (có hỗ trợ dropTimer để tụt qua bệ nhảy)
    const groundY = physics.checkGroundCollision(this.x, this.y, this.prevY, this.dropTimer > 0);
    if (groundY !== null) {
      if (!this.isGrounded && this.vy > 0) {
        // Tiếp đất: sinh bụi 4-6 hạt và co giãn nhân vật (Squash Y)
        particles.spawnDustPuff(this.x, this.y, 5);
        this.squashStretchX = 1.25;
        this.squashStretchY = 0.8;
        audio.playLand();
      }
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
      this.coyoteTimer = 6;
      if (this.state === 'jump' || this.state === 'fall') {
        this.state = wantsCrouch ? 'crouch' : (this.vx !== 0 ? 'run' : 'idle');
      }
    } else {
      this.isGrounded = false;
      if (
        this.state !== 'attack_1' &&
        this.state !== 'attack_2' &&
        this.state !== 'attack_3' &&
        this.state !== 'dodge' &&
        this.state !== 'special'
      ) {
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

  public triggerAttack(
    step: number,
    audio?: AudioManager,
    camera?: GameCamera,
    particles?: ParticleSystem
  ): void {
    this.comboStep = step;
    this.comboBuffer = false;
    this.stateTime = 0;
    this.currentAttackId++;
    this.hasHitEnemyThisAttack = false;
    if (audio) audio.playAttackSwing(step);

    if (step === 1) {
      this.state = 'attack_1';
    } else if (step === 2) {
      this.state = 'attack_2';
      if (camera) camera.triggerDirectionalShake(this.flipX ? -1 : 1, 0, 2.2, 5);
    } else if (step === 3) {
      this.state = 'attack_3';
      if (camera) camera.triggerDirectionalShake(this.flipX ? -1 : 1, 0, 3.5, 8);
      if (particles) particles.spawnFloatingText(this.x, this.y - 45, 'HOA SEN KHÍ!', '#40bfa3');
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
    this.flashTimer = 2; // Chớp trắng 2 khung ở đối tượng bị trúng
    this.state = 'hurt';
    this.stateTime = 0;

    // Đẩy lùi (Knockback) ngược hướng va chạm có giảm tốc
    const knockDir = this.x < fromX ? -1 : 1;
    this.vx = knockDir * 3.5;
    this.vy = -3.0;

    audio.playPlayerHurt();
    camera.triggerDirectionalShake(knockDir, 0, 3.2, 8);
    camera.triggerHitStop(4);
    particles.spawnHeartShards(this.x, this.y - 24, 6); // Tim Ký Ức vỡ thành mảnh khi mất
    particles.spawnHitSparks(this.x, this.y - 20, 8, knockDir);
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
