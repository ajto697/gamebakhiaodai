/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ĐỘNG CƠ MÀN CHƠI CHƯƠNG 1 (ÁO NGŨ THÂN HUẾ - 4 MÀN CHẠY-ĐÁNH)
 * Tích hợp:
 * - Nạp cấu hình màn từ /data/levels/c1_m*.json
 * - Vật phẩm nhặt rải rác: Thẻ Sự Thật, Tim Ký Ức, Cuộn Chỉ
 * - Mini-Boss có Khiên Hiểu Lầm & Bong bóng nói quan niệm sai lệch
 * - Cơ chế NÉM THẺ SỰ THẬT: Thẻ đúng phá vỡ khiên & cụ nghệ nhân giải thích; thẻ sai quái mạnh nhẹ & gợi ý không mắng
 * - Sau khi hạ boss: Quái tan biến thanh thản, mở khóa Mảnh Ghép vào Nhật Ký & đoạn kể lịch sử
 */

import { InputManager } from '../engine/input.ts';
import { AudioManager } from '../engine/audio.ts';
import { ParticleSystem } from '../engine/particles.ts';
import { GameCamera } from '../engine/camera.ts';
import { PhysicsEngine, RectAABB, checkAABB } from '../engine/physics.ts';
import { GameRenderer } from '../engine/renderer.ts';
import { Player } from './entities/player.ts';
import { Enemy } from './entities/enemy.ts';
import {
  drawBossBar,
  drawPlayerHUD,
  drawTruthCardSlot,
  drawDialogueBox,
  drawCanvasButton,
} from '../art/nineSlice.ts';
import chaptersData from '../../../data/chapters.json';

// Import các file dữ liệu màn chơi
import level1Data from '../../../data/levels/c1_m1.json';
import level2Data from '../../../data/levels/c1_m2.json';
import level3Data from '../../../data/levels/c1_m3.json';
import level4Data from '../../../data/levels/c1_m4.json';

export interface WorldCollectible {
  id: string;
  type: 'card' | 'heart' | 'spool';
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  cardData?: {
    id: string;
    text: string;
    dung: boolean;
    goi_y: string;
  };
}

export class GameWorld {
  public currentLevelId = 'c1_m1';
  public currentLevelName = '';
  public player: Player;
  public enemies: Enemy[] = [];
  public collectibles: WorldCollectible[] = [];
  public camera: GameCamera;
  public physics: PhysicsEngine;
  public particles: ParticleSystem;
  public input: InputManager;
  public audio: AudioManager;
  public renderer: GameRenderer;

  public difficulty: 'de' | 'thuong' = 'thuong';
  public isPaused = false;
  public tick = 0;

  // Khay thẻ Sự Thật của người chơi
  public selectedTruthCardIndex = 0;
  public activeTruthCards: Array<{
    id: string;
    text: string;
    dung: boolean;
    goi_y: string;
  }> = [];

  // Trạng thái hội thoại Nghệ Nhân & Boss
  public artisanMessage: string | null = null;
  public artisanTimer = 0;

  // Trạng thái hoàn thành màn chơi
  public isLevelCompleted = false;
  public unlockedPartName = '';
  public unlockedStoryText = '';

  // Khóa di chuyển camera trong khu vực đấu boss
  public inBossArena = false;

  constructor(canvas: HTMLCanvasElement, levelId = 'c1_m1') {
    this.renderer = new GameRenderer(canvas);
    this.input = InputManager.getInstance();
    this.audio = AudioManager.getInstance();
    this.particles = new ParticleSystem();
    this.physics = new PhysicsEngine();
    this.camera = new GameCamera(GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);

    this.player = new Player();
    this.loadLevel(levelId);
  }

  /**
   * Nạp dữ liệu màn chơi cụ thể
   */
  public loadLevel(levelId: string): void {
    this.currentLevelId = levelId;
    this.isLevelCompleted = false;
    this.storyUnlocked = false;
    this.artisanMessage = null;
    this.artisanTimer = 0;
    this.inBossArena = false;
    this.tick = 0;

    let data = level1Data;
    if (levelId === 'c1_m2') data = level2Data;
    if (levelId === 'c1_m3') data = level3Data;
    if (levelId === 'c1_m4') data = level4Data;

    this.currentLevelName = data.name;
    this.camera.maxX = data.totalLength;
    this.physics.platforms = data.platforms.map((p) => ({ ...p }));

    // Đặt lại nhân vật
    this.player.x = data.spawn.x;
    this.player.y = data.spawn.y;
    this.player.prevY = data.spawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = true;
    this.player.state = 'idle';
    this.player.kyUcHearts = 5;
    this.player.chiEnergy = 80;
    this.player.projectiles = [];
    this.camera.x = 0;
    this.camera.y = 0;

    // Nạp thẻ Sự Thật của màn từ chapters.json
    const chapter1 = chaptersData.find((c) => c.id === 'chuong_1');
    const levelMeta = chapter1?.cac_man.find((m) => m.id === levelId);
    if (levelMeta) {
      this.unlockedPartName = levelMeta.ten_manh;
      this.unlockedStoryText = levelMeta.doan_ke;
      this.activeTruthCards = levelMeta.cac_the.map((t) => ({
        id: t.id,
        text: t.noi_dung,
        dung: t.dung,
        goi_y: t.goi_y,
      }));
    }

    // Nạp vật phẩm rơi rải rác trong màn
    this.collectibles = data.collectibles.map((c: any, idx: number) => ({
      id: `item_${idx}`,
      type: c.type,
      x: c.x,
      y: c.y,
      width: 16,
      height: 16,
      collected: false,
      cardData: c.cardId ? this.activeTruthCards.find((t) => t.id === c.cardId) : undefined,
    }));

    // Nạp quái thường
    this.enemies = data.enemies.map((e: any, idx: number) => {
      return new Enemy(
        `mob_${idx}`,
        e.type,
        e.name,
        e.speech,
        e.x,
        e.y,
        e.hp
      );
    });

    // Thêm Mini-Boss cuối màn
    if (data.miniBoss) {
      const mb = new Enemy(
        'mini_boss',
        data.miniBoss.type as any,
        data.miniBoss.name,
        data.miniBoss.misconception,
        data.miniBoss.x,
        data.miniBoss.y,
        data.miniBoss.hp,
        true // Mini-boss có Khiên Hiểu Lầm
      );
      this.enemies.push(mb);
    }
  }

  public set storyUnlocked(val: boolean) {
    this.isLevelCompleted = val;
  }

  public get storyUnlocked(): boolean {
    return this.isLevelCompleted;
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

    // Xử lý thông điệp Nghệ Nhân đếm ngược
    if (this.artisanTimer > 0) {
      this.artisanTimer--;
      if (this.artisanTimer <= 0) {
        this.artisanMessage = null;
      }
    }

    // Chọn Thẻ bằng phím 1, 2, 3
    if (this.input.isPressed('card1')) this.selectCard(0);
    if (this.input.isPressed('card2')) this.selectCard(1);
    if (this.input.isPressed('card3')) this.selectCard(2);

    // Xử lý ném thẻ bằng nút ném chiêu (hoặc khi chọn thẻ gần boss)
    const miniBoss = this.enemies.find((e) => e.isMiniBoss && !e.isDead);
    if (miniBoss) {
      const distToBoss = Math.abs(this.player.x - miniBoss.x);

      // Khi vào khu vực Boss
      if (distToBoss < 180) {
        this.inBossArena = true;
      }

      // Ném thẻ giải trừ Khiên Hiểu Lầm
      const shouldThrowCard =
        this.inBossArena &&
        (this.input.isPressed('card1') || this.input.isPressed('card2') || this.input.isPressed('card3'));

      if (shouldThrowCard && miniBoss.hasShield) {
        this.throwTruthCardAtBoss(miniBoss);
      }
    }

    // Hit-stop
    if (this.camera.isInHitStop()) {
      this.camera.update(this.player.x, this.player.y);
      this.particles.update();
      return;
    }

    // 1. Cập nhật Player
    this.player.update(this.input, this.audio, this.particles, this.camera, this.physics);

    // 2. Cập nhật nhặt vật phẩm rải rác
    const playerHurtbox = this.player.getHurtbox();
    for (const item of this.collectibles) {
      if (item.collected) continue;

      const itemBox: RectAABB = {
        x: item.x - 8,
        y: item.y - 8,
        width: item.width,
        height: item.height,
      };

      if (checkAABB(playerHurtbox, itemBox)) {
        item.collected = true;
        this.audio.playItemCollect();

        if (item.type === 'heart') {
          this.player.kyUcHearts = Math.min(this.player.maxHearts, this.player.kyUcHearts + 1);
          this.particles.spawnFloatingText(item.x, item.y - 20, '+1 KÝ ỨC', '#bf363b');
        } else if (item.type === 'spool') {
          this.player.chiEnergy = Math.min(this.player.maxChi, this.player.chiEnergy + 25);
          this.particles.spawnFloatingText(item.x, item.y - 20, '+25 CHỈ', '#40bfa3');
        } else if (item.type === 'card') {
          this.particles.spawnFloatingText(item.x, item.y - 20, 'NHẶT ĐƯỢC THẺ SỰ THẬT!', '#fedb5b');
        }
      }
    }

    // 3. Cập nhật Quái vật
    for (const enemy of this.enemies) {
      enemy.update(this.player, this.difficulty, this.particles, this.audio, this.camera);
    }

    // 4. Kiểm tra Mini-Boss đã bị hạ gục chưa -> Hoàn thành màn chơi!
    if (miniBoss && miniBoss.isDead && !this.isLevelCompleted) {
      this.isLevelCompleted = true;
      this.audio.playSpecialSkill();
      this.camera.triggerShake(5, 20);
      this.particles.spawnFloatingText(this.player.x, this.player.y - 60, 'MỞ KHÓA MẢNH GHÉP MỚI!!', '#77e0b5');

      // Lưu tiến độ vào LocalStorage
      try {
        const saved = JSON.parse(localStorage.getItem('tam_phuc_ky_progress') || '{}');
        saved[this.currentLevelId] = true;
        localStorage.setItem('tam_phuc_ky_progress', JSON.stringify(saved));
      } catch (err) {
        console.warn('Could not save progress to localStorage:', err);
      }
    }

    // 5. Cập nhật Camera và Hạt
    this.camera.update(this.player.x, this.player.y);
    this.particles.update();
  }

  /**
   * Chọn Thẻ Sự Thật
   */
  public selectCard(index: number): void {
    if (index >= 0 && index < this.activeTruthCards.length) {
      this.selectedTruthCardIndex = index;
      this.audio.playItemCollect();
      const card = this.activeTruthCards[index];
      this.particles.spawnFloatingText(
        this.player.x,
        this.player.y - 50,
        `CHỌN: ${card.text.substring(0, 18)}...`,
        card.dung ? '#77e0b5' : '#ba5e1b'
      );
    }
  }

  /**
   * Ném Thẻ Sự Thật vào Mini-Boss
   */
  public throwTruthCardAtBoss(miniBoss: Enemy): void {
    const card = this.activeTruthCards[this.selectedTruthCardIndex];
    if (!card) return;

    // Sinh đường đạn bay từ người chơi vào boss
    this.particles.spawnThreadTrail(this.player.x, this.player.y - 20, card.dung ? '#40bfa3' : '#ba5e1b');

    if (card.dung) {
      // THẺ ĐÚNG: Phá vỡ Khiên Hiểu Lầm & Boss mất nhiều HP
      miniBoss.breakShield(this.particles, this.camera);
      miniBoss.hp = Math.max(15, miniBoss.hp - 60);
      this.audio.playSpecialSkill();
      this.particles.spawnHitSparks(miniBoss.x, miniBoss.y - 20, 20);

      // Nghệ nhân xuất hiện khen ngợi và giải thích ngắn
      this.artisanMessage = `Cụ Nghệ Nhân: "Chính xác! ${card.goi_y}"`;
      this.artisanTimer = 240; // Hiển thị trong 4 giây
    } else {
      // THẺ SAI: Quái mạnh lên nhẹ, nghệ nhân gợi ý ngắn, không mắng
      miniBoss.vx *= 1.15;
      this.camera.triggerShake(2, 6);
      this.audio.playHitImpact();
      this.particles.spawnFloatingText(miniBoss.x, miniBoss.y - 45, 'KHIÊN CHƯA NỨT!', '#ba5e1b');

      this.artisanMessage = `Cụ Nghệ Nhân: "${card.goi_y}"`;
      this.artisanTimer = 240;
    }
  }

  /**
   * Render toàn bộ thế giới trò chơi
   */
  public render(): void {
    const ctx = this.renderer.ctx;

    // 1. Nền Parallax Huế
    this.renderer.drawParallaxHue(this.camera.x);

    // 2. Không gian thế giới
    this.camera.applyTransform(ctx);

    // 2.1 Bệ gạch nhảy
    ctx.fillStyle = '#3b253b';
    for (const p of this.physics.platforms) {
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = '#4f3547';
      ctx.fillRect(p.x, p.y, p.width, 2);
      ctx.fillStyle = '#f7af34';
      ctx.fillRect(p.x, p.y + p.height - 1, p.width, 1);
    }

    // 2.2 Vật phẩm rải rác
    for (const item of this.collectibles) {
      if (item.collected) continue;

      const bobY = item.y + Math.sin((this.tick + item.x) / 8) * 3;

      if (item.type === 'heart') {
        // Trái tim Ký Ức
        ctx.fillStyle = '#bf363b';
        ctx.fillRect(item.x - 5, bobY - 5, 10, 10);
        ctx.fillStyle = '#f29ec0';
        ctx.fillRect(item.x - 3, bobY - 3, 3, 3);
      } else if (item.type === 'spool') {
        // Cuộn Chỉ teal
        ctx.fillStyle = '#1c5e59';
        ctx.fillRect(item.x - 6, bobY - 6, 12, 12);
        ctx.fillStyle = '#40bfa3';
        ctx.fillRect(item.x - 4, bobY - 4, 8, 8);
      } else if (item.type === 'card') {
        // Thẻ Sự Thật vàng kim lấp lánh
        ctx.fillStyle = '#f7af34';
        ctx.fillRect(item.x - 6, bobY - 9, 12, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(item.x - 3, bobY - 5, 6, 4);
      }
    }

    // 2.3 Quái vật và Mini-Boss
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const anim4 = Math.floor(this.tick / 8) % 4;
      const spriteId = enemy.type === 'miniboss_vat_ao' ? 'miniboss_vat_ao' : enemy.type;
      this.renderer.drawSprite(spriteId, enemy.x, enemy.y, enemy.flipX, anim4);

      // Bong bóng quan niệm sai
      if (enemy.speechBubble && Math.abs(enemy.x - this.player.x) < 190) {
        this.drawSpeechBubble(ctx, enemy.x, enemy.y - (enemy.isMiniBoss ? 70 : 38), enemy.speechBubble);
      }
    }

    // 2.4 Phi đạn Kim Chỉ
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

    // 3. GIAO DIỆN CỐ ĐỊNH (HUD)
    // 3.0 Nút bấm trong canvas (Yêu cầu 6)
    drawCanvasButton(ctx, 8, 6, 96, 22, 'TẠM DỪNG (P)', false, '⏸');
    drawCanvasButton(ctx, 366, 6, 106, 22, 'HỎI NGHỆ NHÂN (T)', false, '💬');

    // 3.1 Thanh Mini-Boss Lãng Quên
    const miniBoss = this.enemies.find((e) => e.isMiniBoss);
    if (miniBoss && !miniBoss.isDead && this.inBossArena) {
      const bossPercent = Math.max(0, (miniBoss.hp / miniBoss.maxHp) * 100);
      drawBossBar(ctx, 110, 6, 250, 26, bossPercent, `${miniBoss.name.toUpperCase()} (LÃNG QUÊN)`);
    }

    // 3.2 HUD Người Chơi: Ký Ức, Chỉ, Mảnh ghép
    drawPlayerHUD(ctx, 8, 214, this.player.kyUcHearts, this.player.maxHearts, this.player.chiEnergy, 3, 4);

    // 3.3 Khay Thẻ Sự Thật (Yêu cầu 2: mỗi thẻ có khung riêng, clip, tối đa 3 dòng)
    const cardW = 92;
    const cardGap = 8;
    const startX = 176;
    this.activeTruthCards.forEach((card, idx) => {
      const isSelected = idx === this.selectedTruthCardIndex;
      drawTruthCardSlot(ctx, startX + idx * (cardW + cardGap), 214, idx + 1, card.text, isSelected, cardW, 50);
    });

    // 3.4 Hộp thoại Nghệ Nhân giải thích khi phá khiên / gợi ý
    if (this.artisanMessage) {
      drawDialogueBox(ctx, 80, 50, 320, 65, 'Cụ Nghệ Nhân:', this.artisanMessage.replace('Cụ Nghệ Nhân: ', ''));
    }

    // 3.5 Bảng vinh danh chiến thắng màn chơi & Đoạn kể lịch sử
    if (this.isLevelCompleted) {
      this.drawVictoryDialog(ctx);
    }

    // 3.6 Bảng tạm dừng
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(22, 20, 38, 0.75)';
      ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);
      drawDialogueBox(ctx, 140, 100, 200, 70, 'TẠM DỪNG', 'Bấm phím [P] để tiếp tục hành trình Tầm Phục.');
    }

    // 3.7 Debug overlay
    this.renderer.drawDebugInfoOverlay();
  }

  private drawSpeechBubble(
    ctx: CanvasRenderingContext2D,
    worldX: number,
    worldY: number,
    text: string
  ): void {
    ctx.save();
    ctx.font = '8px "Pixelify Sans", monospace';
    const textW = Math.min(130, ctx.measureText(text).width + 12);
    const textH = 20;
    const bx = worldX - textW / 2;
    const by = worldY - textH;

    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(bx, by, textW, textH);
    ctx.strokeStyle = '#161426';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, textW - 1, textH - 1);

    ctx.beginPath();
    ctx.moveTo(worldX - 3, by + textH);
    ctx.lineTo(worldX + 3, by + textH);
    ctx.lineTo(worldX, by + textH + 4);
    ctx.fill();

    ctx.fillStyle = '#541924';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.length > 22 ? text.substring(0, 20) + '...' : text, worldX, by + textH / 2);
    ctx.restore();
  }

  private drawVictoryDialog(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(22, 20, 38, 0.85)';
    ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);

    const vx = 60;
    const vy = 35;
    const vw = 360;
    const vh = 200;

    // Khung 9-slice chiến thắng
    drawDialogueBox(
      ctx,
      vx,
      vy,
      vw,
      vh,
      '🎉 THU THẬP THÀNH CÔNG MẢNH GHÉP!',
      `Ngươi đã hóa giải Bóng Mờ và cứu được [${this.unlockedPartName}]!\n\n${this.unlockedStoryText}\n\n(Bấm nút "Màn Tiếp Theo" bên dưới màn hình để tiếp tục cuộc hành trình!)`
    );

    ctx.restore();
  }
}
