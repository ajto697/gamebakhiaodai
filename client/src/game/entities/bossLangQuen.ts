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
  public x = 350;
  public y = 200;
  public width = 110;
  public height = 110;

  public maxHp = 300;
  public hp = 300;
  public isDead = false;

  // Hiệu ứng nhận đòn & chớp trắng
  public flashTimer = 0;
  public hitCooldown = 0;

  // Khiên Hiểu Lầm (Yêu cầu 3 & 4)
  public shieldActive = true;
  public shieldCrackedTimer = 0;
  public shieldActiveTime = 0;
  public shieldVibrateTimer = 0; // Khiên rung khi thẻ sai
  public shieldRedTimer = 0;     // Khiên đỏ nhẹ khi thẻ sai

  // Máy trạng thái 3 pha (Yêu cầu 6: 66% và 33%)
  public phase: 1 | 2 | 3 = 1;
  public state: 'idle' | 'attack_threads' | 'slam' | 'shield_web' | 'stun' | 'vanish' = 'idle';
  public stateTime = 0;
  public attackCooldown = 60;

  // Bẫy tơ chỉ và quái chỉ con
  public threadTraps: BossThreadTrap[] = [];
  public threadMinions: BossMinion[] = [];

  // Mạng nhện bổ trợ ở Pha 3
  public webShieldActive = false;
  public webShieldHp = 50;

  // Lời thoại của boss
  public currentSpeech = 'Ta là BÓNG LÃNG QUÊN! Thời gian sẽ xóa nhòa tất cả!';
  public speechTimer = 240;

  constructor() {}

  /**
   * Hurtbox của boss: chạm mặt đất (y = 200) hoặc tầm nhảy đánh
   */
  public getHurtbox(): RectAABB {
    return {
      x: this.x - 55,
      y: this.y - 110,
      width: 110,
      height: 110,
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
    if (this.hitCooldown > 0) this.hitCooldown--;
    if (this.flashTimer > 0) this.flashTimer--;
    if (this.speechTimer > 0) this.speechTimer--;
    if (this.shieldVibrateTimer > 0) this.shieldVibrateTimer--;
    if (this.shieldRedTimer > 0) this.shieldRedTimer--;

    // Đếm thời gian nứt khiên (3 giây = 180 frame) hoặc tích lũy thời gian khiên bật
    if (this.shieldCrackedTimer > 0) {
      this.shieldCrackedTimer--;
      if (this.shieldCrackedTimer <= 0) {
        this.shieldActive = true;
        this.shieldActiveTime = 0;
        particles.spawnFloatingText(this.x, this.y - 80, 'KHIÊN TÁI TẠO!', '#e88827');
      }
    } else if (this.shieldActive) {
      this.shieldActiveTime++;
    }

    const hpPercent = (this.hp / this.maxHp) * 100;

    // Chuyển pha dựa trên % Lãng Quên (Yêu cầu 5: boss gầm nhẹ, rung 10 khung, sợi chỉ bung ra)
    if (hpPercent <= 33 && this.phase < 3) {
      this.phase = 3;
      this.webShieldActive = true;
      this.webShieldHp = difficulty === 'de' ? 40 : 60;
      this.currentSpeech = 'KÉN NHỆN LÃNG QUÊN SẼ VÂY HÃM KÝ ỨC NGƯƠI!';
      this.speechTimer = 220;
      audio.playSpecialSkill();
      camera.triggerShake(3.2, 10); // Rung 10 khung
      particles.spawnThreadBurst(this.x, this.y - 45, 24); // Sợi chỉ bung ra
      particles.spawnFloatingText(this.x, this.y - 120, 'PHA 3', '#bf363b');
    } else if (hpPercent <= 66 && hpPercent > 33 && this.phase < 2) {
      this.phase = 2;
      this.currentSpeech = 'MỘT KHI ĐỨT CHỈ, ÁO SẼ RỜI TỪNG MẢNH!';
      this.speechTimer = 220;
      audio.playSpecialSkill();
      camera.triggerShake(3.2, 10); // Rung 10 khung
      particles.spawnThreadBurst(this.x, this.y - 45, 20); // Sợi chỉ bung ra
      particles.spawnFloatingText(this.x, this.y - 120, 'PHA 2', '#e88827');
    }

    // 1. Máy trạng thái hành động
    if (this.state === 'vanish') {
      if (this.stateTime === 1) {
        audio.playBossDissolve();
        // Yêu cầu 5: Chậm hình 0.5 giây, sợi chỉ bay tung tóe và tan thành hạt vàng, màn sáng dần
        camera.triggerSlowMotion(30);
        particles.spawnGoldenThreadDissolve(this.x, this.y - 45, 35);
        particles.spawnThreadBurst(this.x, this.y - 45, 20);
        camera.triggerImpactFlash(0.24);
      }
      if (this.stateTime % 2 === 0) {
        particles.spawnHitSparks(
          this.x + (Math.random() - 0.5) * 80,
          this.y - 50 + (Math.random() - 0.5) * 60,
          6
        );
        particles.spawnThreadTrail(
          this.x + (Math.random() - 0.5) * 40,
          this.y - 40,
          '#fedb5b'
        );
      }
      // Yêu cầu 7: Tan biến đúng 4 khung hình
      if (this.stateTime >= 4) {
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
          vx: difficulty === 'de' ? -2.8 : -3.8,
          hp: 1,
          life: 90,
        });
        particles.spawnDustPuff(this.x - 50, this.y - 20, 6);
      }
      if (this.stateTime > 40) {
        this.state = 'idle';
        this.attackCooldown = difficulty === 'de' ? 70 : 50;
      }
    } else if (this.state === 'slam') {
      // Pha 2 & 3: Dậm đất tạo sóng xung kích và bẫy tơ chỉ
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
          life: difficulty === 'de' ? 90 : 140,
        });
      }
      if (this.stateTime > 45) {
        this.state = 'idle';
        this.attackCooldown = difficulty === 'de' ? 65 : 45;
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
    const trapDamageTick = difficulty === 'de' ? 45 : 25;
    for (let i = this.threadTraps.length - 1; i >= 0; i--) {
      const trap = this.threadTraps[i];
      trap.life--;
      const trapBox: RectAABB = { x: trap.x, y: trap.y, width: trap.width, height: trap.height };
      if (checkAABB(trapBox, player.getHurtbox())) {
        player.vx *= 0.4;
        if (this.stateTime % trapDamageTick === 0) {
          player.takeDamage(1, trap.x, audio, camera, particles);
        }
      }
      if (trap.life <= 0) {
        this.threadTraps.splice(i, 1);
      }
    }

    // 4. Yêu cầu 1: Đòn J (combo 3) gây sát thương lên boss khi trúng hitbox (mỗi đòn chỉ tính 1 lần)
    const playerAttack = player.getAttackHitbox();
    if (playerAttack && !player.hasHitEnemyThisAttack && this.hitCooldown <= 0 && checkAABB(this.getHurtbox(), playerAttack)) {
      player.hasHitEnemyThisAttack = true;
      const isFinisher = player.state === 'attack_3';
      const comboStep = player.comboStep || (isFinisher ? 3 : (player.state === 'attack_2' ? 2 : 1));
      const baseDmg = isFinisher ? 45 : (comboStep === 2 ? 30 : 20);
      this.hitCooldown = 12; // Khóa nhịp nhận đòn
      this.takeDamage(baseDmg, player.x, particles, audio, camera, player, isFinisher, comboStep);
    }

    // 5. Yêu cầu 1: Chiêu K (ném kim chỉ) gây sát thương lên boss
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const p = player.projectiles[i];
      const pBox: RectAABB = { x: p.x - p.width / 2, y: p.y - p.height / 2, width: p.width, height: p.height };
      if (checkAABB(this.getHurtbox(), pBox)) {
        if (this.webShieldActive) {
          this.webShieldHp -= p.damage;
          if (this.webShieldHp <= 0) {
            this.webShieldActive = false;
            particles.spawnFloatingText(this.x, this.y - 80, 'KÉN NHỆN ĐÃ ĐỨT!', '#40bfa3');
            camera.triggerHitStop(5);
            camera.triggerShake(6, 16);
            camera.triggerImpactFlash(0.35);
            particles.spawnSlashHitVisual(this.x - 20, this.y - 60, true, 3, false);
            this.currentSpeech = 'A! Mũi kim chỉ xé toạc kén nhện của ta rồi!';
            this.speechTimer = 180;
          }
        }
        this.takeDamage(p.damage, p.x, particles, audio, camera, player, true, 3);
        player.projectiles.splice(i, 1);
      }
    }
  }

  private decideNextAttack(player: Player, difficulty: string): void {
    this.stateTime = 0;
    const isEasy = difficulty === 'de';
    if (this.phase === 1) {
      this.state = 'attack_threads';
    } else if (this.phase === 2) {
      this.state = Math.random() > 0.5 ? 'slam' : 'attack_threads';
    } else {
      this.state = Math.random() > (isEasy ? 0.6 : 0.4) ? 'slam' : 'attack_threads';
    }
  }

  public takeDamage(
    dmg: number,
    fromX: number,
    particles: ParticleSystem,
    audio: AudioManager,
    camera: GameCamera,
    player: Player,
    isFinisher: boolean,
    comboStep = 1
  ): void {
    if (this.state === 'vanish') return;

    // Yêu cầu 2 & 3: Phản hồi khi trúng & Khiên Hiểu Lầm
    // Khi khiên bật: chỉ nhận 1 sát thương tượng trưng và hiện "KHIÊN!"
    // Khi khiên nứt (trong 3 giây): nhận sát thương cực lớn
    const hasShield = this.shieldActive;
    let finalDmg = 1;

    if (hasShield) {
      finalDmg = 1;
      this.flashTimer = 2; // Chớp trắng boss 2 khung (Yêu cầu 1)
      camera.triggerHitStop(3); // Hit-stop 3 khung
      camera.triggerDirectionalShake(fromX < this.x ? 1 : -1, 0, 1.8, 5);
      audio.playHitImpact();
      particles.spawnHitSparks(this.x - 10, this.y - 45, 6);
      particles.spawnFloatingText(this.x - 10, this.y - 75, 'KHIÊN! -1', '#e88827');
    } else {
      // Khiên đang nứt: sát thương lớn
      const multiplier = this.shieldCrackedTimer > 0 ? 1.5 : 1.0;
      finalDmg = Math.round(dmg * multiplier);
      this.flashTimer = 2; // Chớp trắng boss 2 khung (Yêu cầu 1)
      camera.triggerHitStop(isFinisher ? 5 : (comboStep === 2 ? 4 : 3)); // Hit-stop 3-5 khung (Yêu cầu 1)
      audio.playHitImpact();

      // Đẩy lùi boss có giảm tốc
      const knockDir = fromX < this.x ? 1 : -1;
      this.x = Math.max(220, Math.min(420, this.x + knockDir * (isFinisher ? 8 : 4)));

      // Hạt tia sáng (6-10 hạt) và vệt chém (3 khung)
      particles.spawnHitSparks(this.x - 20, this.y - 50, isFinisher ? 10 : 8, knockDir);
      particles.spawnSlashHitVisual(this.x - 20, this.y - 50, isFinisher, comboStep, player.flipX);
      camera.triggerDirectionalShake(knockDir, 0, isFinisher ? 3.5 : 2.5, isFinisher ? 8 : 6);
      camera.triggerImpactFlash(isFinisher ? 0.22 : 0.12);

      // Số sát thương nhỏ nổi lên
      particles.spawnFloatingText(this.x - 10, this.y - 85, `-${finalDmg}`, '#fedb5b');
    }

    this.hp = Math.max(0, this.hp - finalDmg);

    // Cập nhật câu thoại khi bị đánh trúng
    if (Math.random() < 0.45 && this.speechTimer <= 80) {
      const hitQuotes = [
        'Ugh... Đòn đánh này sao chứa chan ký ức xưa?!',
        'Ngươi dám xé rách bụi mờ thời gian sao?!',
        'Chỉ may của ta... không thể đứt dễ dàng thế này!',
        'Đừng hòng nhắc ta nhớ lại tà áo cũ!',
      ];
      this.currentSpeech = hitQuotes[Math.floor(Math.random() * hitQuotes.length)];
      this.speechTimer = 160;
    }

    player.onHitEnemy(particles, isFinisher);

    // Khi Lãng Quên về 0 -> Tỉnh ngộ và tan biến trong 4 khung hình
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'vanish';
      this.stateTime = 0;
      this.currentSpeech = 'A... Ta nhớ ra rồi! Tà áo xưa... đẹp đẽ biết bao...';
      this.speechTimer = 240;
      camera.triggerHitStop(5);
      camera.triggerShake(3.5, 12);
      camera.triggerImpactFlash(0.24);
      particles.spawnFloatingText(this.x, this.y - 100, 'BÓNG LÃNG QUÊN ĐÃ TỈNH NGỘ!', '#77e0b5');
    }
  }

  /**
   * Ném Thẻ Sự Thật vào Boss Bóng Lãng Quên (Yêu cầu 4)
   * - Thẻ đúng: khiên nứt vỡ thành mảnh, phát sáng teal, kèm sóng xung kích, phát hợp âm sáng & vỡ khiên
   * - Thẻ sai: khiên rung và đỏ nhẹ, nốt trầm ngắn dịu dàng, không âm thanh gây khó chịu
   */
  public hitByTruthCard(
    isCorrect: boolean,
    particles: ParticleSystem,
    camera: GameCamera,
    audio?: AudioManager
  ): void {
    if (this.state === 'vanish') return;

    if (isCorrect) {
      // THẺ ĐÚNG: Hợp âm sáng + Khiên nứt vỡ thành mảnh
      if (audio) {
        audio.playTruthCardCorrect();
        audio.playShieldBreak();
      }
      this.shieldActive = false;
      this.shieldCrackedTimer = 180; // 3 giây (180 frame) chịu sát thương lớn
      this.webShieldActive = false;
      this.hp = Math.max(0, this.hp - 60);
      this.state = 'stun';
      this.stateTime = 0;
      this.flashTimer = 2; // Chớp trắng 2 khung
      camera.triggerHitStop(4); // Hit-stop 4 khung
      camera.triggerDirectionalShake(0, -1, 3.5, 8);
      camera.triggerImpactFlash(0.24);
      particles.spawnShieldShards(this.x, this.y - 50, 16, '#77e0b5');
      particles.spawnImpactShockwave(this.x, this.y - 50, '#77e0b5', 42);
      particles.spawnFloatingText(this.x - 20, this.y - 90, 'KHIÊN NỨT! -60 LÃNG QUÊN', '#77e0b5');
      this.currentSpeech = 'Đạo lý tà áo... khiên hiểu lầm của ta đã vỡ tan!';
      this.speechTimer = 200;

      if (this.hp <= 0) {
        this.hp = 0;
        this.state = 'vanish';
        this.stateTime = 0;
        if (audio) audio.playBossDissolve();
        this.currentSpeech = 'A... Ta nhớ ra rồi! Tà áo xưa... đẹp đẽ biết bao...';
        this.speechTimer = 240;
        camera.triggerHitStop(5);
        camera.triggerShake(3.5, 12);
        camera.triggerImpactFlash(0.24);
      }
    } else {
      // THẺ SAI: Nốt trầm ngắn, không âm thanh gây khó chịu (Yêu cầu 1 & 4)
      if (audio) audio.playTruthCardWrong();
      this.shieldVibrateTimer = 14;
      this.shieldRedTimer = 14;
      this.attackCooldown = Math.max(15, this.attackCooldown - 15);
      camera.triggerShake(1.5, 5); // Rung nhẹ
      particles.spawnFloatingText(this.x - 20, this.y - 90, 'NGỘ NHẬN! KHIÊN RUNG', '#bf363b');
      this.currentSpeech = 'Ha ha! Đó chỉ là ngộ nhận của người đời mà thôi!';
      this.speechTimer = 180;
    }
  }
}
