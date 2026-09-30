/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ĐẤU TRƯỜNG PHÒNG BOSS XƯỞNG MAY CỔ & TRẬN CHIẾN "BÓNG LÃNG QUÊN"
 * Nền xưởng may cổ: Thước dây gỗ, kéo may, giỏ kim chỉ, thùng gỗ, đuốc than hồng.
 * HUD chuẩn mực: Thanh Boss Lãng Quên dài ở trên, HUD Ký Ức / Chỉ ở dưới, Khay Thẻ Sự Thật.
 */

import { GameRenderer } from '../engine/renderer.ts';
import { GameCamera } from '../engine/camera.ts';
import { PhysicsEngine } from '../engine/physics.ts';
import { ParticleSystem } from '../engine/particles.ts';
import { AudioManager } from '../engine/audio.ts';
import { InputManager } from '../engine/input.ts';
import { Player } from './entities/player.ts';
import { BossLangQuen } from './entities/bossLangQuen.ts';
import {
  drawBossBar,
  drawPlayerHUD,
  drawTruthCardSlot,
  drawDialogueBox,
  drawActionCallout,
  drawBossSpeechBubbleSafe,
  drawCanvasButton,
} from '../art/nineSlice.ts';

export class BossArenaWorld {
  public renderer: GameRenderer;
  public camera: GameCamera;
  public physics: PhysicsEngine;
  public particles: ParticleSystem;
  public audio: AudioManager;
  public input: InputManager;

  public player: Player;
  public boss: BossLangQuen;

  public difficulty: 'de' | 'thuong' = 'thuong';
  public isPaused = false;
  public tick = 0;

  // Khay thẻ Sự Thật tối thượng của Chương 1
  public selectedTruthCardIndex = 0;
  public truthCards = [
    { id: 1, text: 'Năm thân áo tượng trưng tứ thân phụ mẫu và thân con', isCorrect: true },
    { id: 2, text: 'Năm chiếc khuy nhắc nhở đạo lý Ngũ Thường Nhân Nghĩa Lễ Trí Tín', isCorrect: true },
    { id: 3, text: 'Cổ đứng lập lĩnh giữ phong thái chính trực đĩnh đạc', isCorrect: true },
  ];

  // Trạng thái thắng trận
  public isVictory = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new GameRenderer(canvas);
    this.camera = new GameCamera(GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);
    this.camera.maxX = GameRenderer.LOGIC_WIDTH; // Phòng boss cố định 480px
    this.physics = new PhysicsEngine();
    this.physics.platforms = [
      { x: 60, y: 155, width: 75, height: 10 },
      { x: 345, y: 155, width: 75, height: 10 },
    ];

    this.particles = new ParticleSystem();
    this.audio = AudioManager.getInstance();
    this.input = InputManager.getInstance();

    this.player = new Player();
    this.player.x = 100;
    this.player.y = 200;

    this.boss = new BossLangQuen();
  }

  /**
   * Cập nhật fixed 60Hz
   */
  public update(): void {
    this.input.update();

    if (this.input.isPressed('pause')) {
      this.isPaused = !this.isPaused;
    }

    if (this.isPaused) return;

    this.tick++;

    // Chọn thẻ bằng phím 1, 2, 3
    if (this.input.isPressed('card1')) this.selectCard(0);
    if (this.input.isPressed('card2')) this.selectCard(1);
    if (this.input.isPressed('card3')) this.selectCard(2);

    // Hit-stop
    if (this.camera.isInHitStop()) {
      this.camera.update(this.player.x, this.player.y);
      this.particles.update();
      return;
    }

    // 1. Cập nhật nhân vật
    this.player.update(this.input, this.audio, this.particles, this.camera, this.physics);

    // 2. Cập nhật Boss
    this.boss.update(this.player, this.difficulty, this.particles, this.audio, this.camera);

    // 3. Cập nhật Camera và Hạt
    this.camera.x = 0; // Khóa camera ở phòng boss
    this.camera.update(this.player.x, this.player.y);
    this.particles.update();

    // 4. Kiểm tra boss đã tan biến hoàn toàn chưa
    if (this.boss.isDead && !this.isVictory) {
      this.isVictory = true;
      this.audio.playSpecialSkill();
      this.particles.spawnFloatingText(240, 100, 'HOÀN THÀNH CHƯƠNG 1!!', '#fedb5b');
    }
  }

  public selectCard(idx: number): void {
    if (idx >= 0 && idx < this.truthCards.length) {
      this.selectedTruthCardIndex = idx;
      this.audio.playItemCollect();
      const card = this.truthCards[idx];
      this.particles.spawnFloatingText(
        this.player.x,
        this.player.y - 50,
        `THẺ: ${card.text.substring(0, 18)}...`,
        '#77e0b5'
      );
    }
  }

  /**
   * Ném Thẻ Sự Thật vào Boss
   */
  public throwCardAtBoss(): void {
    const card = this.truthCards[this.selectedTruthCardIndex];
    if (!card || this.boss.isDead) return;

    this.audio.playSpecialSkill();
    this.particles.spawnThreadTrail(this.player.x, this.player.y - 20, '#40bfa3');
    this.boss.hitByTruthCard(card.isCorrect, this.particles, this.camera);
  }

  /**
   * Vẽ Nền Xưởng May Cổ Điển (Atelier Room Background)
   * Nền làm mờ và giảm tương phản để nhân vật và boss nổi bật
   */
  public drawAtelierBackground(): void {
    const ctx = this.renderer.ctx;
    const w = GameRenderer.LOGIC_WIDTH;
    const h = GameRenderer.LOGIC_HEIGHT;

    // 1. Nền phòng màu nâu tím sẫm ấm áp (#261b2d)
    ctx.fillStyle = '#261b2d';
    ctx.fillRect(0, 0, w, 200);

    // Bức tường gạch mộc cũ mờ
    ctx.fillStyle = '#3b253b';
    for (let y = 10; y < 190; y += 18) {
      for (let x = 0; x < w; x += 36) {
        ctx.fillRect(x + ((y / 18) % 2 === 0 ? 0 : 18), y, 34, 16);
      }
    }

    // 2. Thước dây may áo bằng gỗ treo tường
    ctx.fillStyle = '#7a3d13';
    ctx.fillRect(50, 40, 6, 80);
    ctx.fillRect(420, 40, 6, 80);
    ctx.fillStyle = '#c7aa8d';
    for (let y = 45; y < 115; y += 8) {
      ctx.fillRect(51, y, 4, 1);
      ctx.fillRect(421, y, 4, 1);
    }

    // 3. Đuốc than hồng hai bên tường tỏa ánh sáng ấm
    const flicker = Math.sin(this.tick / 5) * 2;
    [30, 450].forEach((tx) => {
      // Giá đỡ đuốc
      ctx.fillStyle = '#161426';
      ctx.fillRect(tx - 3, 70, 6, 25);
      // Ánh lửa cam vàng
      ctx.fillStyle = '#e88827';
      ctx.beginPath();
      ctx.arc(tx, 65 + flicker, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fedb5b';
      ctx.beginPath();
      ctx.arc(tx, 64 + flicker, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Kệ gỗ chứa các cuộn chỉ và lụa ngũ sắc mờ ở hậu cảnh
    ctx.fillStyle = '#4f3547';
    ctx.fillRect(160, 60, 160, 8);
    // Các cuộn lụa
    const silkColors = ['#87232e', '#f7af34', '#268c7e', '#a83b6f', '#e8d2b7'];
    silkColors.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.fillRect(170 + idx * 30, 44, 22, 16);
      ctx.fillStyle = '#161426';
      ctx.strokeRect(170.5 + idx * 30, 44.5, 21, 15);
    });

    // 5. Cây kéo may cổ khổng lồ treo ở tâm bức tường
    ctx.fillStyle = '#63534b';
    ctx.fillRect(238, 25, 4, 24);
    ctx.beginPath();
    ctx.arc(235, 48, 6, 0, Math.PI * 2);
    ctx.arc(245, 48, 6, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Mặt sàn gỗ xưởng may
    ctx.fillStyle = '#161426';
    ctx.fillRect(0, 200, w, h - 200);
    ctx.fillStyle = '#7a3d13';
    ctx.fillRect(0, 200, w, 4);
    ctx.fillStyle = '#4f3547';
    for (let x = 0; x < w; x += 40) {
      ctx.fillRect(x, 204, 1, 66);
    }
  }

  /**
   * Render toàn bộ khung cảnh đấu boss
   */
  public render(): void {
    const ctx = this.renderer.ctx;

    // 1. Vẽ nền Xưởng may
    this.drawAtelierBackground();

    // 2. Không gian thế giới
    this.camera.applyTransform(ctx);

    // 2.1 Bệ gỗ nhảy
    ctx.fillStyle = '#7a3d13';
    for (const p of this.physics.platforms) {
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(p.x, p.y, p.width, 1);
    }

    // 2.2 Vẽ Bẫy tơ chỉ và quái con
    for (const trap of this.boss.threadTraps) {
      ctx.fillStyle = '#a83b6f';
      ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
      ctx.fillStyle = '#f7af34';
      ctx.fillRect(trap.x + 2, trap.y + 2, trap.width - 4, 2);
    }

    for (const minion of this.boss.threadMinions) {
      this.renderer.drawSprite('mob_chi_roi', minion.x, minion.y, minion.vx < 0, Math.floor(this.tick / 6) % 4);
    }

    // 2.3 Vẽ Boss "Bóng Lãng Quên"
    const bossAnim4 = Math.floor(this.tick / 8) % 4;
    this.renderer.drawSprite('boss_idle', this.boss.x, this.boss.y, true, bossAnim4);

    // Mạng nhện bảo vệ nếu đang ở Pha 3
    if (this.boss.webShieldActive) {
      ctx.strokeStyle = '#fff39e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.boss.x - 20, this.boss.y - 60, 58, 0, Math.PI * 2);
      ctx.stroke();

      // Màng mạng nhện
      ctx.fillStyle = 'rgba(255, 243, 158, 0.15)';
      ctx.beginPath();
      ctx.arc(this.boss.x - 20, this.boss.y - 60, 56, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lời thoại Boss (Chỉ 1 bong bóng cùng lúc trên đầu trong vùng an toàn)
    if (this.boss.currentSpeech && !this.boss.isDead) {
      drawBossSpeechBubbleSafe(ctx, this.boss.x - 20, this.boss.y - 100, this.boss.currentSpeech);
    }

    // 2.4 Phi đạn kim chỉ của người chơi
    for (const p of this.player.projectiles) {
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - p.width / 2 + 2, p.y - 1, p.width - 4, 2);
    }

    // 2.5 Nhân vật chính (Chiều cao ~1/5 khung hình 270px)
    // 2.5.1 Bóng dưới chân nhân vật
    ctx.save();
    ctx.fillStyle = 'rgba(15, 13, 27, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.player.x, this.player.y - 1, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let playerSprite = 'hero_idle';
    let frameIdx = 0;

    if (this.player.state === 'run') {
      playerSprite = 'hero_run';
      frameIdx = Math.floor(this.tick / 6) % 4;
    } else if (this.player.state === 'attack_1' || this.player.state === 'attack_2' || this.player.state === 'attack_3') {
      playerSprite = 'hero_attack_1';
      frameIdx = Math.min(2, Math.floor(this.player.stateTime / 4));
    } else if (this.player.state === 'jump') {
      playerSprite = 'hero_idle';
      frameIdx = 1;
    } else if (this.player.state === 'dodge') {
      playerSprite = 'hero_run';
      frameIdx = 2;
    } else {
      playerSprite = 'hero_idle';
      frameIdx = Math.floor(this.tick / 15) % 2;
    }

    const shouldDraw = this.player.invincibleTimer === 0 || Math.floor(this.tick / 3) % 2 === 0;
    if (shouldDraw) {
      this.renderer.drawSprite(playerSprite, this.player.x, this.player.y, this.player.flipX, frameIdx);
    }

    // 2.5.2 Chế độ Debug (Phím F2): Hiện khung va chạm AABB
    if (this.renderer.debugMode) {
      const hurtbox = this.player.getHurtbox();
      ctx.strokeStyle = '#40bfa3';
      ctx.lineWidth = 1;
      ctx.strokeRect(hurtbox.x + 0.5, hurtbox.y + 0.5, hurtbox.width - 1, hurtbox.height - 1);
      const hitbox = this.player.getAttackHitbox();
      if (hitbox) {
        ctx.strokeStyle = '#bf363b';
        ctx.strokeRect(hitbox.x + 0.5, hitbox.y + 0.5, hitbox.width - 1, hitbox.height - 1);
      }
    }

    // 2.6 Hạt VFX
    this.particles.draw(ctx, 0);

    this.camera.restoreTransform(ctx);

    // 3. GIAO DIỆN HUD ARCADE
    // 3.0 Nút bấm trong canvas (Yêu cầu 6)
    drawCanvasButton(ctx, 8, 6, 80, 22, 'TẠM DỪNG (P)', false, '⏸');
    drawCanvasButton(ctx, 396, 6, 76, 22, 'HỎI CỤ (T)', false, '💬');

    // 3.1 Thanh Boss "BÓNG LÃNG QUÊN" dài ở trên
    const bossPercent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
    drawBossBar(ctx, 92, 8, 298, 30, bossPercent, `BÓNG LÃNG QUÊN - PHA ${this.boss.phase}`);

    // 3.2 HUD Người Chơi
    drawPlayerHUD(ctx, 8, 214, this.player.kyUcHearts, this.player.maxHearts, this.player.chiEnergy, 4, 4);

    // 3.3 Khay Thẻ Sự Thật (3 thẻ, khung riêng biệt, clip, không tràn)
    const cardW = 92;
    const cardGap = 8;
    const startX = 176;
    this.truthCards.forEach((card, idx) => {
      const isSelected = idx === this.selectedTruthCardIndex;
      drawTruthCardSlot(ctx, startX + idx * (cardW + cardGap), 214, idx + 1, card.text, isSelected, cardW, 50);
    });

    // 3.4 Bảng chiến thắng Boss cuối
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(22, 20, 38, 0.85)';
      ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);
      drawDialogueBox(
        ctx,
        60,
        40,
        360,
        190,
        '🏆 ĐẠI THẮNG BÓNG LÃNG QUÊN!',
        'Cuộn chỉ rối đã gỡ sạch bụi mờ và hóa thành lụa lành lặn!\n\nToàn bộ 4 mảnh ghép của Áo Ngũ Thân Huế đã sẵn sàng!\n\nHãy tiến vào [MÀN RÁP ÁO] để ghép hoàn chỉnh trang phục và mở khóa câu chuyện di sản!'
      );
    }

    // 3.5 Bảng tạm dừng
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(22, 20, 38, 0.75)';
      ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);
      drawDialogueBox(ctx, 140, 100, 200, 70, 'TẠM DỪNG', 'Bấm phím [P] để tiếp tục trận chiến.');
    }

    // 3.6 Debug overlay
    this.renderer.drawDebugInfoOverlay();
  }
}
