/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TRÙM CUỐI CHƯƠNG: "BÓNG LÃNG QUÊN" (FINAL BOSS - MULTI-PHASE BATTLE)
 * Hình tượng: Cuộn chỉ rối khổng lồ bám bụi và mạng nhện, mắt là 2 khuy áo cổ bằng đồng, miệng đường may ngộ nghĩnh.
 * 3 Pha tấn công (Patterns):
 * - Pha 1: Bắn cuộn chỉ nhỏ & bụi mờ cản bước.
 * - Pha 2: Giăng bẫy tơ chỉ trên sàn & dập cuộn chỉ tạo sóng chấn động.
 * - Pha 3: Cuồng nộ bọc kén mạng nhện - Người chơi phải dùng chiêu "NÉM KIM CHỈ!!" cắt mạng nhện và ném Thẻ Sự Thật để dứt điểm!
 */

import { RectAABB, checkAABB } from '../../engine/physics.ts';
import { ParticleSystem } from '../../engine/particles.ts';
import { AudioManager } from '../../engine/audio.ts';
import { GameCamera } from '../../engine/camera.ts';
import { Player } from './player.ts';

export interface BossThreadTrap {
  x: number;
  y: number;
  width: number;
  height: number;
  life: number;
}

export interface BossMinion {
  x: number;
  y: number;
  vx: number;
  hp: number;
  life: number;
}

export class BossLangQuen {
  public x = 380;
  public y = 185;
  public width = 110;
  public height = 110;

  public maxHp = 300;
  public hp = 300;
  public isDead = false;

  // Máy trạng thái 3 pha
  public phase: 1 | 2 | 3 = 1;
  public state: 'idle' | 'attack_threads' | 'slam' | 'shield_web' | 'stun' | 'vanish' = 'idle';
  public stateTime = 0;
  public attackCooldown = 60;

  // Bẫy tơ chỉ và quái chỉ con
  public threadTraps: BossThreadTrap[] = [];
  public threadMinions: BossMinion[] = [];

  // Mạng nhện tối thượng ở Pha 3
  public webShieldActive = false;
  public webShieldHp = 50;

  // Lời thoại của boss
  public currentSpeech = 'Ta là BÓNG LÃNG QUÊN! Thời gian sẽ xóa nhòa tất cả!';

  constructor() {}

  public getHurtbox(): RectAABB {
    return {
      x: this.x - 50,
      y: this.y - 100,
      width: 100,
      height: 100,
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
    const hpPercent = (this.hp / this.maxHp) * 100;

    // Chuyển pha dựa trên % Lãng Quên
    if (hpPercent <= 35 && this.phase < 3) {
      this.phase = 3;
      this.webShieldActive = true;
      this.webShieldHp = 60;
      this.currentSpeech = 'TƠ NHỆN LÃNG QUÊN SẼ VÂY HÃM KÝ ỨC NGƯƠI!';
      camera.triggerShake(6, 18);
      particles.spawnFloatingText(this.x, this.y - 120, 'PHA 3: CUỒNG NỘ KÉN CHỈ!', '#bf363b');
    } else if (hpPercent <= 70 && hpPercent > 35 && this.phase < 2) {
      this.phase = 2;
      this.currentSpeech = 'MỘT KHI ĐỨT CHỈ, ÁO SẼ RỜI TỪNG MẢNH!';
      camera.triggerShake(4, 14);
      particles.spawnFloatingText(this.x, this.y - 120, 'PHA 2: GIĂNG BẪY TƠ RỐI!', '#e88827');
    }

    // 1. Máy trạng thái hành động
    if (this.state === 'vanish') {
      if (this.stateTime % 2 === 0) {
        particles.spawnHitSparks(
          this.x + (Math.random() - 0.5) * 80,
          this.y - 50 + (Math.random() - 0.5) * 60,
          4
        );
      }
      if (this.stateTime > 80) {
        this.isDead = true;
      }
      return;
    }

    if (this.state === 'stun') {
      if (this.stateTime > 25) {
        this.state = 'idle';
        this.stateTime = 0;
      }
    } else if (this.state === 'idle') {
      // Đứng thở và nhấp nhô
      this.attackCooldown--;
      if (this.attackCooldown <= 0) {
        this.decideNextAttack(player, difficulty);
      }
    } else if (this.state === 'attack_threads') {
      // Pha 1: Bắn cuộn chỉ nhỏ bay ngang
      if (this.stateTime === 20) {
        audio.playAttackSwing();
        this.threadMinions.push({
          x: this.x - 50,
          y: this.y - 30,
          vx: -3.6,
          hp: 1,
          life: 90,
        });
        particles.spawnDustPuff(this.x - 50, this.y - 20, 6);
      }
      if (this.stateTime > 40) {
        this.state = 'idle';
        this.attackCooldown = 50;
      }
    } else if (this.state === 'slam') {
      // Pha 2: Dậm đất tạo sóng xung kích và bẫy tơ chỉ
      if (this.stateTime === 15) {
        camera.triggerShake(6, 15);
        audio.playHitImpact();
        particles.spawnHitSparks(this.x, this.y - 10, 16);
        particles.spawnDustPuff(this.x - 40, this.y, 8);
        particles.spawnDustPuff(this.x + 40, this.y, 8);

        // Đặt bẫy tơ chỉ trên mặt đất
        this.threadTraps.push({
          x: player.x - 20,
          y: 195,
          width: 40,
          height: 10,
          life: 140,
        });
      }
      if (this.stateTime > 45) {
        this.state = 'idle';
        this.attackCooldown = 45;
      }
    }

    // 2. Cập nhật các cuộn chỉ con bắn ra
    for (let i = this.threadMinions.length - 1; i >= 0; i--) {
      const m = this.threadMinions[i];
      m.x += m.vx;
      m.life--;

      const minionBox: RectAABB = { x: m.x - 8, y: m.y - 8, width: 16, height: 16 };
      if (checkAABB(minionBox, player.getHurtbox())) {
        player.takeDamage(1, m.x, audio, camera, particles);
        m.life = 0;
      }

      if (m.life <= 0) {
        this.threadMinions.splice(i, 1);
      }
    }

    // 3. Cập nhật bẫy tơ chỉ trên sàn (làm chậm và rút Ký Ức nếu dẫm phải)
    for (let i = this.threadTraps.length - 1; i >= 0; i--) {
      const trap = this.threadTraps[i];
      trap.life--;
      const trapBox: RectAABB = { x: trap.x, y: trap.y, width: trap.width, height: trap.height };
      if (checkAABB(trapBox, player.getHurtbox())) {
        player.vx *= 0.4; // Làm dính chân
        if (this.stateTime % 30 === 0) {
          player.takeDamage(1, trap.x, audio, camera, particles);
        }
      }
      if (trap.life <= 0) {
        this.threadTraps.splice(i, 1);
      }
    }

    // 4. Nhận sát thương từ đòn đánh của người chơi
    const playerAttack = player.getAttackHitbox();
    if (playerAttack && checkAABB(this.getHurtbox(), playerAttack)) {
      const isFinisher = player.state === 'attack_3';
      const dmg = isFinisher ? 25 : 12;
      this.takeDamage(dmg, player.x, particles, audio, camera, player, isFinisher);
    }

    // 5. Nhận sát thương từ phi đạn kim chỉ ("NÉM KIM CHỈ!!")
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const p = player.projectiles[i];
      const pBox: RectAABB = { x: p.x - p.width / 2, y: p.y - p.height / 2, width: p.width, height: p.height };
      if (checkAABB(this.getHurtbox(), pBox)) {
        // Chiêu Kim Chỉ phá tan kén nhện ở Pha 3!
        if (this.webShieldActive) {
          this.webShieldHp -= p.damage;
          if (this.webShieldHp <= 0) {
            this.webShieldActive = false;
            particles.spawnFloatingText(this.x, this.y - 80, 'KÉN NHỆN ĐÃ ĐỨT!', '#40bfa3');
            camera.triggerShake(5, 12);
          }
        }
        this.takeDamage(p.damage, p.x, particles, audio, camera, player, true);
        player.projectiles.splice(i, 1);
      }
    }
  }

  private decideNextAttack(player: Player, _difficulty: string): void {
    this.stateTime = 0;
    if (this.phase === 1) {
      this.state = 'attack_threads';
    } else if (this.phase === 2) {
      this.state = Math.random() > 0.5 ? 'slam' : 'attack_threads';
    } else {
      // Pha 3: xen kẽ bão tơ chỉ và dậm đất
      this.state = Math.random() > 0.4 ? 'slam' : 'attack_threads';
    }
  }

  public takeDamage(
    dmg: number,
    fromX: number,
    particles: ParticleSystem,
    audio: AudioManager,
    camera: GameCamera,
    player: Player,
    isFinisher: boolean
  ): void {
    // Nếu kén nhện đang bọc ở Pha 3 -> Giảm 75% sát thương thường
    const finalDmg = this.webShieldActive ? Math.max(3, Math.floor(dmg * 0.25)) : dmg;

    this.hp -= finalDmg;
    audio.playHitImpact();
    camera.triggerHitStop(isFinisher ? 5 : 3);
    camera.triggerShake(isFinisher ? 5 : 2, 8);

    particles.spawnHitSparks(this.x - 20, this.y - 60, isFinisher ? 14 : 7);
    particles.spawnFloatingText(
      this.x - 20,
      this.y - 80,
      this.webShieldActive ? 'KÉN GIẢM SÁT THƯƠNG!' : `-${finalDmg}`,
      this.webShieldActive ? '#ba5e1b' : '#fedb5b'
    );

    player.onHitEnemy(particles, isFinisher);

    // Khi Lãng Quên về 0 -> Tỉnh ngộ và tan biến trong hào quang
    if (this.hp <= 0 && this.state !== 'vanish') {
      this.hp = 0;
      this.state = 'vanish';
      this.stateTime = 0;
      this.currentSpeech = 'A... Ta nhớ ra rồi! Tà áo xưa... đẹp đẽ biết bao...';
      camera.triggerShake(6, 25);
      particles.spawnFloatingText(this.x, this.y - 100, 'BÓNG LÃNG QUÊN ĐÃ TỈNH NGỘ!', '#77e0b5');
    }
  }

  /**
   * Ném Thẻ Sự Thật vào Boss Bóng Lãng Quên để hóa giải bùa lãng quên
   */
  public hitByTruthCard(isCorrect: boolean, particles: ParticleSystem, camera: GameCamera): void {
    if (this.state === 'vanish') return;

    if (isCorrect) {
      // Trừ 50 Lãng Quên và phá kén nhện
      this.hp = Math.max(0, this.hp - 50);
      this.webShieldActive = false;
      this.state = 'stun';
      this.stateTime = 0;
      camera.triggerShake(6, 16);
      particles.spawnHitSparks(this.x, this.y - 60, 20);
      particles.spawnFloatingText(this.x, this.y - 90, 'THẺ SỰ THẬT TỎA SÁNG!', '#77e0b5');
    } else {
      particles.spawnFloatingText(this.x, this.y - 90, 'LÃNG QUÊN CHƯA DỨT!', '#ba5e1b');
    }
  }
}
