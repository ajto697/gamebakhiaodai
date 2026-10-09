/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * THỰC THỂ QUÁI VẬT & TRÍ TUỆ NHÂN TẠO (ENEMY ENTITY & AI)
 * AI theo máy trạng thái:
 * - PATROL: Đi tuần tra qua lại quanh vị trí ban đầu.
 * - CHASE: Phát hiện người chơi trong tầm nhìn và đuổi theo.
 * - ATTACK: Nhảy bổ / áp sát ra đòn khi cự ly gần.
 * - STUN: Choáng giật lùi (knockback + hit-stop) khi trúng đòn.
 * - DISSOLVE: Tỉnh ngộ và tan biến trong mây bụi ánh sáng.
 */

import { RectAABB, checkAABB } from '../../engine/physics.ts';
import { ParticleSystem } from '../../engine/particles.ts';
import { AudioManager } from '../../engine/audio.ts';
import { GameCamera } from '../../engine/camera.ts';
import { Player } from './player.ts';

export type EnemyType = 'mob_chi_roi' | 'mob_bui_mo' | 'mob_khuy_meo' | 'miniboss_vat_ao';
export type EnemyAIState = 'patrol' | 'chase' | 'attack' | 'stun' | 'dissolve';

export class Enemy {
  public id: string;
  public type: EnemyType;
  public name: string;
  public speechBubble: string;

  public x: number;
  public y: number;
  public vx = 0;
  public vy = 0;
  public startX: number;
  public flipX = false;

  public hp: number;
  public maxHp: number;
  public damage = 1;
  public isDead = false;

  public aiState: EnemyAIState = 'patrol';
  public stateTime = 0;
  public patrolRange = 75;
  public chaseDistance = 150;
  public attackDistance = 35;

  // Mini-boss có Khiên Hiểu Lầm
  public isMiniBoss = false;
  public hasShield = false;

  // Hiệu ứng nhận đòn (Hit-Stop & Flash)
  public flashTimer = 0;
  public hitCooldown = 0;

  constructor(
    id: string,
    type: EnemyType,
    name: string,
    speechBubble: string,
    x: number,
    y: number,
    hp = 30,
    isMiniBoss = false
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.speechBubble = speechBubble;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.hp = hp;
    this.maxHp = hp;
    this.isMiniBoss = isMiniBoss;
    this.hasShield = isMiniBoss;
  }

  public getHurtbox(): RectAABB {
    const size = this.isMiniBoss ? 56 : 28;
    return {
      x: this.x - size / 2,
      y: this.y - size,
      width: size,
      height: size,
    };
  }

  public update(
    player: Player,
    difficulty: 'de' | 'thuong',
    particles: ParticleSystem,
    audio: AudioManager,
    camera: GameCamera
  ): void {
    if (this.isDead) return;

    this.stateTime++;
    if (this.flashTimer > 0) this.flashTimer--;
    if (this.hitCooldown > 0) this.hitCooldown--;

    const speedMult = difficulty === 'de' ? 0.75 : 1.0;
    const baseSpeed = (this.isMiniBoss ? 1.0 : 1.4) * speedMult;

    // Khoảng cách tới nhân vật chính
    const distToPlayer = Math.abs(this.x - player.x);
    const dirToPlayer = player.x < this.x ? -1 : 1;

    // 1. Máy Trạng Thái AI
    switch (this.aiState) {
      case 'patrol': {
        // Đi tuần qua lại quanh điểm xuất phát
        if (this.x < this.startX - this.patrolRange) {
          this.vx = baseSpeed;
          this.flipX = false;
        } else if (this.x > this.startX + this.patrolRange) {
          this.vx = -baseSpeed;
          this.flipX = true;
        } else if (this.vx === 0) {
          this.vx = baseSpeed;
        }

        // Phát hiện nhân vật -> Chuyển sang rượt đuổi (CHASE)
        if (distToPlayer <= this.chaseDistance) {
          this.aiState = 'chase';
          this.stateTime = 0;
        }
        break;
      }

      case 'chase': {
        this.vx = dirToPlayer * baseSpeed * 1.35;
        this.flipX = dirToPlayer < 0;

        if (distToPlayer <= this.attackDistance) {
          this.aiState = 'attack';
          this.stateTime = 0;
        } else if (distToPlayer > this.chaseDistance * 1.4) {
          // Người chơi chạy xa -> Quay lại đi tuần
          this.aiState = 'patrol';
          this.stateTime = 0;
        }
        break;
      }

      case 'attack': {
        // Chuẩn bị đòn đánh trong 20 frame rồi nhảy xốc tới
        if (this.stateTime < 18) {
          this.vx = 0;
        } else if (this.stateTime === 19) {
          this.vx = dirToPlayer * 3.2;
          this.vy = -2.0;
        } else if (this.stateTime > 35) {
          this.aiState = 'chase';
          this.stateTime = 0;
        }
        break;
      }

      case 'stun': {
        this.vx *= 0.88;
        if (this.stateTime > 18) {
          this.aiState = 'chase';
          this.stateTime = 0;
        }
        break;
      }

      case 'dissolve': {
        this.vx = 0;
        // Bắn bụi sáng tan biến
        if (this.stateTime % 3 === 0) {
          particles.spawnHitSparks(this.x, this.y - 15, 3);
        }
        if (this.stateTime > 25) {
          this.isDead = true;
        }
        return;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // Trọng lực nếu nhảy
    if (this.y < 200) {
      this.vy += 0.45;
    } else {
      this.y = 200;
      this.vy = 0;
    }

    // 2. Va chạm với đòn đánh thường của nhân vật (Đòn J Combo 1, 2, 3)
    const playerAttackBox = player.getAttackHitbox();
    if (playerAttackBox && this.hitCooldown <= 0 && checkAABB(this.getHurtbox(), playerAttackBox)) {
      const isFinisher = player.state === 'attack_3';
      const comboStep = player.comboStep || (isFinisher ? 3 : (player.state === 'attack_2' ? 2 : 1));
      const dmg = isFinisher ? 28 : (comboStep === 2 ? 18 : 12);
      this.hitCooldown = isFinisher ? 16 : 10;
      this.takeHit(dmg, player.x, particles, audio, camera, player, isFinisher, comboStep);
    }

    // 3. Va chạm với phi đạn kim chỉ (Projectiles)
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const p = player.projectiles[i];
      const projBox: RectAABB = { x: p.x - p.width / 2, y: p.y - p.height / 2, width: p.width, height: p.height };
      if (checkAABB(this.getHurtbox(), projBox)) {
        this.takeHit(p.damage, p.x, particles, audio, camera, player, true, 3);
        player.projectiles.splice(i, 1);
      }
    }

    // 4. Va chạm gây sát thương lên nhân vật
    if (!this.isDead && this.aiState !== 'stun') {
      if (checkAABB(this.getHurtbox(), player.getHurtbox())) {
        const dmg = difficulty === 'de' ? 1 : 1;
        player.takeDamage(dmg, this.x, audio, camera, particles);
      }
    }
  }

  private takeHit(
    dmg: number,
    fromX: number,
    particles: ParticleSystem,
    audio: AudioManager,
    camera: GameCamera,
    player: Player,
    isFinisher: boolean,
    comboStep = 1
  ): void {
    // Nếu là mini-boss có khiên hiểu lầm, giảm sát thương vật lý trực tiếp
    const actualDmg = this.hasShield ? Math.max(2, Math.floor(dmg * 0.2)) : dmg;

    this.hp -= actualDmg;
    this.aiState = 'stun';
    this.stateTime = 0;
    this.flashTimer = 2; // Chớp trắng 2 khung ở đối tượng bị trúng (Yêu cầu 1)

    // Đẩy lùi (Knockback có giảm tốc)
    const knockDir = this.x < fromX ? -1 : 1;
    this.vx = knockDir * (isFinisher ? 4.2 : (comboStep === 2 ? 3.0 : 2.2));

    // Kích hoạt Hit-Stop 3-5 khung hình (Yêu cầu 1)
    const hitStopFrames = isFinisher ? 5 : (comboStep === 2 ? 4 : 3);
    camera.triggerHitStop(hitStopFrames);

    // Kích hoạt Rung màn hình theo hướng đánh (biên độ nhỏ, tắt dần)
    const shakeIntensity = isFinisher ? 3.5 : (comboStep === 2 ? 2.8 : 2.2);
    const shakeDuration = isFinisher ? 8 : (comboStep === 2 ? 6 : 5);
    camera.triggerDirectionalShake(knockDir, 0, shakeIntensity, shakeDuration);

    // Chớp sáng màn hình dịu nhẹ
    camera.triggerImpactFlash(isFinisher ? 0.22 : 0.12);

    audio.playHitImpact();

    // Sinh bộ hiệu ứng va chạm (Slash Arc 3 khung, sparks 6-10 hạt, sóng xung kích)
    particles.spawnSlashHitVisual(this.x, this.y - 18, isFinisher, comboStep, player.flipX);

    particles.spawnFloatingText(
      this.x,
      this.y - 30,
      this.hasShield ? 'KHIÊN CHẶN!' : `-${actualDmg}`,
      this.hasShield ? '#a83b6f' : '#fedb5b'
    );

    // Hồi năng lượng Chỉ cho người chơi
    player.onHitEnemy(particles, isFinisher);

    // Nếu hết máu -> Tỉnh ngộ và tan biến (Dissolve)
    if (this.hp <= 0) {
      this.aiState = 'dissolve';
      this.stateTime = 0;
      camera.triggerHitStop(4);
      camera.triggerDirectionalShake(knockDir, 0, 3.2, 8);
      particles.spawnFloatingText(this.x, this.y - 45, 'TỈNH NGỘ!', '#77e0b5');
    }
  }

  /**
   * Phá vỡ Khiên Hiểu Lầm khi bị ném đúng Thẻ Sự Thật (Yêu cầu 4)
   */
  public breakShield(particles: ParticleSystem, camera: GameCamera, audio?: AudioManager): void {
    if (this.hasShield) {
      this.hasShield = false;
      if (audio) audio.playShieldBreak();
      camera.triggerHitStop(4); // 4 khung hit-stop
      camera.triggerDirectionalShake(0, -1, 3.0, 8);
      particles.spawnShieldShards(this.x, this.y - 25, 14, '#77e0b5');
      particles.spawnImpactShockwave(this.x, this.y - 25, '#77e0b5', 36);
      particles.spawnFloatingText(this.x, this.y - 50, 'PHÁ KHIÊN HIỂU LẦM!', '#77e0b5');
    }
  }
}
