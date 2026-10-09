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
  get9SliceCanvas,
  draw9Slice,
  drawPixelTextWithShadow,
  drawHexagonShield,
  BubbleRequest,
  layoutSpeechBubbles,
  drawLaidOutBubble,
} from '../art/nineSlice.ts';
import { SceneManager } from './sceneManager.ts';
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
  public levelIntroTimer = 120; // Tiêu đề địa điểm trượt từ trên xuống (Yêu cầu 9)
  public hudBounceTimer = 0;    // Ô HUD nảy và sáng khi nhặt mảnh ghép (Yêu cầu 7)

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
    this.levelIntroTimer = 120; // Khởi tạo tiêu đề địa điểm trượt từ trên xuống (Yêu cầu 9)
    this.hudBounceTimer = 0;

    let data = level1Data;
    if (levelId === 'c1_m2') data = level2Data;
    if (levelId === 'c1_m3') data = level3Data;
    if (levelId === 'c1_m4') data = level4Data;

    this.currentLevelName = data.name;
    this.camera.maxX = data.totalLength;
    this.physics.platforms = data.platforms.map((p) => ({ ...p }));

    // Đặt lại nhân vật (xuất phát ở tọa độ thoáng, không chìm dưới HUD)
    this.player.x = Math.max(180, data.spawn.x);
    this.player.y = data.spawn.y;
    this.player.prevY = data.spawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = true;
    this.player.state = 'idle';
    this.player.kyUcHearts = 5;
    this.player.chiEnergy = 80;
    this.player.projectiles = [];
    this.camera.x = Math.max(0, this.player.x - 200);
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
      this.camera.update(this.player.x, this.player.y, true);
      this.particles.update(true);
      return;
    }

    // Cập nhật đếm lùi tiêu đề địa điểm & nảy HUD
    if (this.levelIntroTimer > 0) this.levelIntroTimer--;
    if (this.hudBounceTimer > 0) this.hudBounceTimer--;

    // 1. Cập nhật Player
    this.player.update(this.input, this.audio, this.particles, this.camera, this.physics);

    // 2. Cập nhật nhặt vật phẩm rải rác (Yêu cầu 7: mảnh ghép bay về ô HUD theo đường cong và ô sáng nảy)
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

        // Mảnh ghép bay về ô HUD theo đường cong (Yêu cầu 7)
        const hudWorldX = this.camera.x + 35;
        const hudWorldY = 225;
        const itemColor = item.type === 'heart' ? '#bf363b' : (item.type === 'spool' ? '#40bfa3' : '#fedb5b');
        this.particles.spawnFlyingItem(item.x, item.y, hudWorldX, hudWorldY, itemColor, () => {
          this.hudBounceTimer = 16; // Ô HUD nảy lên và flash
        });

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
      this.audio.playFragmentUnlock();
      this.audio.playVictoryFanfare();
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
    if (this.inBossArena && miniBoss) {
      // ẢNH A: Khóa camera lại để nhân vật, mini-boss, bong bóng quan niệm sai và khay Thẻ Sự Thật cùng nằm trong một khung 480x270, không bị HUD che
      this.camera.x = miniBoss.x - 390;
      this.camera.y = 0;
      this.player.x = Math.max(miniBoss.x - 240, Math.min(miniBoss.x - 50, this.player.x));
    }
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
   * Ném Thẻ Sự Thật vào Mini-Boss (Yêu cầu 4)
   */
  public throwTruthCardAtBoss(miniBoss: Enemy): void {
    const card = this.activeTruthCards[this.selectedTruthCardIndex];
    if (!card) return;

    // Thẻ bay theo đường cong vào khiên mini-boss
    this.particles.spawnCurvedCard(
      this.player.x,
      this.player.y - 20,
      miniBoss.x,
      miniBoss.y - 20,
      card.dung
    );

    if (card.dung) {
      // THẺ ĐÚNG: Phá vỡ Khiên Hiểu Lầm & Boss mất nhiều HP
      miniBoss.breakShield(this.particles, this.camera, this.audio);
      miniBoss.hp = Math.max(15, miniBoss.hp - 60);
      this.audio.playTruthCardCorrect();
      this.particles.spawnHitSparks(miniBoss.x, miniBoss.y - 20, 14);

      // Nghệ nhân xuất hiện khen ngợi và giải thích ngắn
      this.artisanMessage = `Nghệ Nhân May Đo: "Chính xác! ${card.goi_y}"`;
      this.artisanTimer = 240; // Hiển thị trong 4 giây
    } else {
      // THẺ SAI: Quái mạnh lên nhẹ, không rung chớp mạnh, nốt trầm ngắn dịu dàng
      miniBoss.vx *= 1.15;
      this.camera.triggerShake(1.5, 5);
      this.audio.playTruthCardWrong();
      this.particles.spawnFloatingText(miniBoss.x, miniBoss.y - 45, 'KHIÊN CHƯA NỨT!', '#ba5e1b');

      this.artisanMessage = `Nghệ Nhân May Đo: "${card.goi_y}"`;
      this.artisanTimer = 240;
    }
  }

  /**
   * Render toàn bộ thế giới trò chơi
   */
  public render(): void {
    const ctx = this.renderer.ctx;

    // 1. Nền Parallax Huế (rung nhẹ đồng điệu theo camera shake để tạo độ đầm thị giác)
    ctx.save();
    if (this.camera.shakeOffsetX !== 0 || this.camera.shakeOffsetY !== 0) {
      ctx.translate(Math.round(this.camera.shakeOffsetX * 0.4), Math.round(this.camera.shakeOffsetY * 0.4));
    }
    this.renderer.drawParallaxHue(this.camera.x);
    ctx.restore();

    // 2. Không gian thế giới
    this.camera.applyTransform(ctx);

    // 2.1 Bệ gạch nhảy Hoàng Cung Cố Đô (Đá Thanh, viền ngói lưu ly & hoa văn hoa sen)
    for (const p of this.physics.platforms) {
      // Bóng đổ dưới bệ nhảy
      ctx.fillStyle = 'rgba(12, 10, 20, 0.45)';
      ctx.fillRect(p.x + 2, p.y + p.height, p.width, 3);

      // Thân bệ đá cổ tím trầm
      ctx.fillStyle = '#2d1f36';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Mặt gạch đá hoa cương phía trên (Đá Thanh bóng)
      ctx.fillStyle = '#4c3559';
      ctx.fillRect(p.x, p.y, p.width, 3);
      // Gờ sáng phản quang mặt trên
      ctx.fillStyle = '#7a5a8c';
      ctx.fillRect(p.x, p.y, p.width, 1);

      // Mạch ghép đá cổ
      ctx.fillStyle = '#1c1324';
      for (let bx = p.x + 16; bx < p.x + p.width; bx += 24) {
        ctx.fillRect(bx, p.y + 3, 1, p.height - 4);
      }

      // Viền ngói hoàng lưu ly vàng kim ở bờ dưới
      ctx.fillStyle = '#ba5e1b';
      ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2);
      ctx.fillStyle = '#fedb5b';
      for (let nx = p.x; nx < p.x + p.width; nx += 6) {
        ctx.fillRect(nx + 1, p.y + p.height - 1, 3, 1);
      }

      // Đấu củng chạm mây thời Nguyễn đỡ dưới bệ
      ctx.fillStyle = '#1c1324';
      ctx.fillRect(p.x + 2, p.y + p.height, 4, 3);
      ctx.fillRect(p.x + p.width - 6, p.y + p.height, 4, 3);
      ctx.fillStyle = '#3a2745';
      ctx.fillRect(p.x + 3, p.y + p.height + 1, 2, 2);
      ctx.fillRect(p.x + p.width - 5, p.y + p.height + 1, 2, 2);

      // Đố hoa sen chạm khắc giữa bệ nhảy nếu bệ đủ rộng
      if (p.width >= 48) {
        const midX = Math.floor(p.x + p.width / 2);
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(midX - 3, p.y + 4, 6, 3);
        ctx.fillStyle = '#f4a7b9';
        ctx.fillRect(midX - 1, p.y + 5, 2, 2);
      }

      // Rêu phong rủ nhẹ ở 2 bên mép bệ
      ctx.fillStyle = '#268c7e';
      ctx.fillRect(p.x, p.y + p.height, 3, 2);
      ctx.fillRect(p.x + p.width - 3, p.y + p.height, 3, 2);

      // Đèn lồng đỏ mini lung linh đung đưa dưới bệ rộng
      if (p.width >= 70) {
        const lanternX = p.x + 14;
        const sway = Math.sin((this.tick + p.x) / 7) * 1.5;
        // Dây treo
        ctx.fillStyle = '#7a2222';
        ctx.fillRect(lanternX, p.y + p.height, 1, 4);

        // Hào quang đèn lồng tỏa sáng ấm áp
        ctx.fillStyle = 'rgba(254, 219, 91, 0.12)';
        ctx.beginPath();
        ctx.arc(lanternX + sway, p.y + p.height + 7, 10, 0, Math.PI * 2);
        ctx.fill();

        // Thân lồng đèn đỏ cung đình
        ctx.fillStyle = '#bf363b';
        ctx.fillRect(lanternX - 3 + sway, p.y + p.height + 4, 7, 7);
        // Lõi vàng
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(lanternX - 1 + sway, p.y + p.height + 5, 3, 5);
        // Tua rua vàng buông rủ
        ctx.fillStyle = '#f7af34';
        ctx.fillRect(lanternX - 1 + sway, p.y + p.height + 11, 3, 3);
      }
    }

    // 2.1.2 Đom đóm đêm Cố Đô lấp lánh trong không gian (Ambient Fireflies)
    for (let i = 0; i < 6; i++) {
      const flyX = ((this.camera.x + i * 90 + Math.sin((this.tick + i * 30) / 25) * 40) % 600) + this.camera.x - 50;
      const flyY = 70 + (i * 24) + Math.cos((this.tick + i * 20) / 18) * 15;
      const pulse = Math.sin((this.tick + i * 15) / 8);
      if (pulse > -0.2) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 219, 91, 0.65)' : 'rgba(119, 224, 181, 0.65)';
        ctx.beginPath();
        ctx.arc(flyX, flyY, 1.5 + (pulse > 0.5 ? 0.8 : 0), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2.2 Vật phẩm thu thập sắc nét, lấp lánh (Collectibles)
    for (const item of this.collectibles) {
      if (item.collected) continue;

      const bobY = item.y + Math.sin((this.tick + item.x) / 7) * 3;
      const sparkle = (this.tick + item.x) % 30;

      if (item.type === 'heart') {
        // TRÁI TIM KÝ ỨC (Ngọc Bội Sen Hồng Tỏa Sáng)
        // Hào quang hồng ngọc
        ctx.fillStyle = 'rgba(242, 158, 192, 0.2)';
        ctx.beginPath();
        ctx.arc(item.x, bobY, 11, 0, Math.PI * 2);
        ctx.fill();

        // Viền vàng hoàng kim bọc ngoài
        ctx.fillStyle = '#fedb5b';
        ctx.beginPath();
        ctx.arc(item.x - 3.5, bobY - 2.5, 4.5, 0, Math.PI * 2);
        ctx.arc(item.x + 3.5, bobY - 2.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(item.x - 8, bobY - 1);
        ctx.lineTo(item.x + 8, bobY - 1);
        ctx.lineTo(item.x, bobY + 7);
        ctx.closePath();
        ctx.fill();

        // Thân trái tim ruby hồng thắm
        ctx.fillStyle = '#bf363b';
        ctx.beginPath();
        ctx.arc(item.x - 3, bobY - 2, 3.5, 0, Math.PI * 2);
        ctx.arc(item.x + 3, bobY - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(item.x - 6.5, bobY);
        ctx.lineTo(item.x + 6.5, bobY);
        ctx.lineTo(item.x, bobY + 6);
        ctx.closePath();
        ctx.fill();

        // Điểm sáng pha lê trắng lấp lánh
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(item.x - 4, bobY - 3, 2, 2);
        if (sparkle < 8) {
          ctx.fillRect(item.x + 4, bobY - 4, 2, 2);
        }
      } else if (item.type === 'spool') {
        // CUỘN CHỈ LỤA THẦN (Ống chỉ tơ ngọc bích & kim bạc)
        // Hào quang xanh ngọc
        ctx.fillStyle = 'rgba(64, 191, 163, 0.22)';
        ctx.beginPath();
        ctx.arc(item.x, bobY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hai đầu lõi ống gỗ quý
        ctx.fillStyle = '#7a3d13';
        ctx.fillRect(item.x - 7, bobY - 6, 14, 2);
        ctx.fillRect(item.x - 7, bobY + 4, 14, 2);
        ctx.fillStyle = '#ba5e1b';
        ctx.fillRect(item.x - 6, bobY - 5, 12, 1);
        ctx.fillRect(item.x - 6, bobY + 3, 12, 1);

        // Cuộn sợi tơ lụa màu lục biếc óng ả
        ctx.fillStyle = '#268c7e';
        ctx.fillRect(item.x - 5, bobY - 4, 10, 7);
        ctx.fillStyle = '#40bfa3';
        ctx.fillRect(item.x - 4, bobY - 3, 8, 5);
        ctx.fillStyle = '#77e0b5';
        ctx.fillRect(item.x - 3, bobY - 2, 6, 3);

        // Mũi kim may bạc xuyên chéo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(item.x - 6, bobY - 6, 2, 2);
        ctx.fillRect(item.x + 4, bobY + 4, 2, 2);

        // Sợi chỉ buông lơi uốn lượn dưới đáy
        const threadWave = Math.sin((this.tick + item.x) / 5) * 2;
        ctx.strokeStyle = '#77e0b5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(item.x, bobY + 6);
        ctx.quadraticCurveTo(item.x + 3 + threadWave, bobY + 10, item.x + threadWave, bobY + 13);
        ctx.stroke();
      } else if (item.type === 'card') {
        // MẢNH CỔ PHỤC / THẺ SỰ THẬT (Gấm lụa thêu chỉ vàng hoàng gia)
        // Hào quang vàng hoàng kim
        ctx.fillStyle = 'rgba(254, 219, 91, 0.25)';
        ctx.beginPath();
        ctx.arc(item.x, bobY, 14, 0, Math.PI * 2);
        ctx.fill();

        // Viền gấm vàng hổ phách
        ctx.fillStyle = '#ba5e1b';
        ctx.fillRect(item.x - 7, bobY - 10, 14, 20);
        ctx.fillStyle = '#f7af34';
        ctx.fillRect(item.x - 6, bobY - 9, 12, 18);
        ctx.fillStyle = '#fff4a3';
        ctx.fillRect(item.x - 5, bobY - 8, 10, 16);

        // Dấu ấn triện đỏ hoàng gia ở giữa
        ctx.fillStyle = '#bf363b';
        ctx.fillRect(item.x - 3, bobY - 4, 6, 6);
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(item.x - 1, bobY - 2, 2, 2);

        // Hạt sao lấp lánh xoay quanh
        const starAngle = (this.tick + item.x) * 0.08;
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(item.x + Math.cos(starAngle) * 11, bobY + Math.sin(starAngle) * 8, 2, 2);
      }
    }

    // 2.3 Quái vật và Mini-Boss
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      // Bóng dưới chân quái vật (Yêu cầu 3)
      ctx.save();
      ctx.fillStyle = 'rgba(15, 13, 27, 0.4)';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 1, enemy.isMiniBoss ? 24 : 12, enemy.isMiniBoss ? 6 : 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const anim4 = Math.floor(this.tick / 8) % 4;
      const spriteId = enemy.type === 'miniboss_vat_ao' ? 'miniboss_vat_ao' : enemy.type;

      // Hiệu ứng chớp sáng trắng/vàng khi quái bị trúng đòn 2 khung (Yêu cầu 1)
      ctx.save();
      if (enemy.flashTimer > 0) {
        ctx.filter = 'brightness(5) contrast(1.5)';
      }
      this.renderer.drawSprite(spriteId, enemy.x, enemy.y, enemy.flipX, anim4);
      ctx.restore();

      // ẢNH A: Khiên Hiểu Lầm vẽ rõ quanh mini-boss (lục giác nhấp nháy) kèm nhãn "KHIÊN HIỂU LẦM"
      if (enemy.isMiniBoss && enemy.hasShield) {
        drawHexagonShield(ctx, enemy.x, enemy.y - 32, 40, this.tick, 'KHIÊN HIỂU LẦM', false);
      }
    }

    // 2.3.5 Thu thập và bố trí bong bóng thoại qua bộ xếp chỗ chung (layoutSpeechBubbles)
    const bubbleRequests: BubbleRequest[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.speechBubble || enemy.isDead) continue;
      // Ở khu vực Mini-boss (c1_m3), chỉ ưu tiên hiển thị bong bóng quan niệm sai của mini-boss
      if (this.inBossArena) {
        if (enemy.isMiniBoss) {
          bubbleRequests.push({
            id: `bubble_${enemy.id}`,
            speakerScreenX: enemy.x - this.camera.x,
            speakerScreenY: enemy.y - 75,
            text: enemy.speechBubble,
            isBossOrMiniBoss: true,
            priority: 10,
          });
        }
      } else if (Math.abs(enemy.x - this.player.x) < 200) {
        bubbleRequests.push({
          id: `bubble_${enemy.id}`,
          speakerScreenX: enemy.x - this.camera.x,
          speakerScreenY: enemy.y - 36,
          text: enemy.speechBubble,
          isBossOrMiniBoss: enemy.isMiniBoss,
          priority: enemy.isMiniBoss ? 9 : 1,
        });
      }
    }
    const placedBubbles = layoutSpeechBubbles(ctx, bubbleRequests);
    for (const pb of placedBubbles) {
      drawLaidOutBubble(ctx, pb);
    }

    // 2.4 Phi đạn Kim Chỉ Bay (Mũi kim phát sáng kéo theo vệt tơ lụa)
    for (const p of this.player.projectiles) {
      // Vệt tơ lụa vàng ánh kim phía sau
      ctx.fillStyle = 'rgba(254, 219, 91, 0.4)';
      ctx.fillRect(p.x - (p.vx > 0 ? 12 : -2), p.y - 1, 10, 2);

      // Mũi kim may sắc nhọn
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - p.width / 2 + 1, p.y - 1, p.width - 2, 2);
    }

    // 2.5 Nhân vật chính (Chiều cao ~1/5 khung hình 270px)
    // 2.5.1 Bóng dưới chân nhân vật (Yêu cầu 3: giữ nguyên trên mặt đất, đổi kích thước theo độ cao)
    const playerDistFromGround = Math.max(0, 200 - this.player.y);
    const shadowScale = Math.max(0.35, 1 - playerDistFromGround / 100);
    ctx.save();
    ctx.fillStyle = `rgba(15, 13, 27, ${(0.42 * shadowScale).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(this.player.x, 201, 14 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dư ảnh (Afterimage) khi né (Yêu cầu 3)
    for (const img of this.player.afterimages) {
      ctx.save();
      ctx.globalAlpha = img.alpha * 0.7;
      this.renderer.drawSprite('hero_idle', img.x, img.y, img.flipX, 0);
      ctx.restore();
    }

    let playerSprite = 'hero_idle';
    let frameIdx = 0;

    if (this.player.state === 'run') {
      playerSprite = 'hero_run';
      frameIdx = Math.floor(this.tick / 6) % 4;
    } else if (this.player.state === 'crouch') {
      playerSprite = 'hero_crouch';
      frameIdx = Math.floor(this.tick / 10) % 2;
    } else if (this.player.state === 'attack_1') {
      playerSprite = 'hero_attack_1';
      frameIdx = Math.min(2, Math.floor(this.player.stateTime / 4));
    } else if (this.player.state === 'attack_2') {
      playerSprite = 'hero_attack_2';
      frameIdx = Math.min(2, Math.floor(this.player.stateTime / 4));
    } else if (this.player.state === 'attack_3') {
      playerSprite = 'hero_attack_3';
      frameIdx = Math.min(3, Math.floor(this.player.stateTime / 3));
    } else if (this.player.state === 'jump') {
      playerSprite = 'hero_jump';
      frameIdx = this.player.vy < 0 ? 0 : 1;
    } else if (this.player.state === 'dodge') {
      playerSprite = 'hero_dodge';
      frameIdx = Math.min(2, Math.floor(this.player.stateTime / 4));
    } else {
      playerSprite = 'hero_idle';
      frameIdx = Math.floor(this.tick / 15) % 2;
    }

    const shouldDraw = this.player.invincibleTimer === 0 || Math.floor(this.tick / 3) % 2 === 0;
    if (shouldDraw) {
      ctx.save();
      // Co giãn nhân vật (Squash and Stretch 2-3 khung hình khi nhảy và tiếp đất) (Yêu cầu 3)
      if (this.player.squashStretchX !== 1.0 || this.player.squashStretchY !== 1.0) {
        ctx.translate(this.player.x, this.player.y);
        ctx.scale(this.player.squashStretchX, this.player.squashStretchY);
        ctx.translate(-this.player.x, -this.player.y);
      }
      if (this.player.flashTimer > 0) {
        // Chớp trắng 2 khung ở đối tượng bị trúng (Yêu cầu 1)
        ctx.filter = 'brightness(5) contrast(1.5)';
      }
      // Viền sáng nhẹ khi ở chế độ chụp ảnh để nhân vật chính nổi bật rõ ràng
      if (SceneManager.getInstance().photoModeTarget === 'A') {
        ctx.save();
        ctx.shadowColor = '#fedb5b';
        ctx.shadowBlur = 6;
        this.renderer.drawSprite(playerSprite, this.player.x, this.player.y, this.player.flipX, frameIdx);
        ctx.restore();
      } else {
        this.renderer.drawSprite(playerSprite, this.player.x, this.player.y, this.player.flipX, frameIdx);
      }
      ctx.restore();
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

    // 2.6 Hạt VFX trong không gian thế giới
    this.particles.draw(ctx, 0);

    this.camera.restoreTransform(ctx);

    // 2.7 Lớp phủ hiệu ứng toàn màn hình (Speed Lines, Chiêu K Focus & Chớp sáng va chạm Impact Flash)
    this.particles.drawScreenOverlays(ctx);
    this.camera.drawSpecialFocus(ctx);
    this.camera.drawImpactFlash(ctx);

    // 3. GIAO DIỆN CỐ ĐỊNH (HUD)
    // 3.0 Nút bấm trong canvas (Thống nhất nhãn HỎI NGHỆ NHÂN (T))
    drawCanvasButton(ctx, 8, 6, 80, 22, 'TẠM DỪNG (P)', false, '⏸');
    drawCanvasButton(ctx, 362, 6, 110, 22, 'HỎI NGHỆ NHÂN (T)', false, '💬');

    // 3.1 Thanh Mini-Boss Lãng Quên (Tên bên trái BÓNG KHUY LẠC, bên phải LÃNG QUÊN: xx% không đè nhau)
    const miniBoss = this.enemies.find((e) => e.isMiniBoss);
    if (miniBoss && !miniBoss.isDead && this.inBossArena) {
      const bossPercent = Math.max(0, (miniBoss.hp / miniBoss.maxHp) * 100);
      drawBossBar(ctx, 96, 6, 260, 28, bossPercent, miniBoss.name.toUpperCase());
    }

    // 3.2 HUD Người Chơi: Ký Ức, Chỉ, Mảnh ghép (kèm hiệu ứng nảy flash khi nhặt đồ - Yêu cầu 7)
    const hudBounceY = this.hudBounceTimer > 0 ? Math.sin((this.hudBounceTimer / 16) * Math.PI) * 4 : 0;
    const hudY = Math.round(214 - hudBounceY);
    drawPlayerHUD(ctx, 8, hudY, this.player.kyUcHearts, this.player.maxHearts, this.player.chiEnergy, 3, 4);

    // 3.3 Khay Thẻ Sự Thật (Yêu cầu 2: mỗi thẻ có khung riêng, clip, tối đa 3 dòng)
    const cardW = 92;
    const cardGap = 8;
    const startX = 176;
    this.activeTruthCards.forEach((card, idx) => {
      const isSelected = idx === this.selectedTruthCardIndex;
      drawTruthCardSlot(ctx, startX + idx * (cardW + cardGap), 214, idx + 1, card.text, isSelected, cardW, 50);
    });

    // 3.4 Tiêu đề địa điểm trượt từ trên xuống khi vào màn (Yêu cầu 9)
    if (this.levelIntroTimer > 0) {
      const progress = Math.min(1, (120 - this.levelIntroTimer) / 25);
      const fadeOut = Math.min(1, this.levelIntroTimer / 25);
      const slideY = Math.floor(-35 + Math.min(1, progress) * 55);
      ctx.save();
      ctx.globalAlpha = Math.min(progress, fadeOut);
      const panel = get9SliceCanvas();
      draw9Slice(ctx, panel, 130, slideY, 220, 36, 6);
      drawPixelTextWithShadow(ctx, 'ĐỊA ĐIỂM CỐ ĐÔ', 240, slideY + 5, {
        font: 'bold 8px "Pixelify Sans", monospace',
        textColor: '#77e0b5',
        align: 'center',
      });
      drawPixelTextWithShadow(ctx, this.currentLevelName.toUpperCase(), 240, slideY + 16, {
        font: 'bold 11px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        align: 'center',
      });
      ctx.restore();
    }

    // 3.4 Hộp thoại Nghệ Nhân giải thích khi phá khiên / gợi ý
    if (this.artisanMessage) {
      drawDialogueBox(ctx, 80, 50, 320, 65, 'Nghệ Nhân May Đo:', this.artisanMessage.replace(/^(Cụ Nghệ Nhân|Nghệ Nhân May Đo):\s*/, ''));
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
    ctx.font = '7.5px "Pixelify Sans", monospace';
    const cleanText = (text || '').normalize('NFC');
    const words = cleanText.split(/\s+/).filter(Boolean);
    const maxLineW = 160;
    const lines: string[] = [];
    let curLine = '';

    for (const w of words) {
      const test = curLine ? `${curLine} ${w}` : w;
      if (ctx.measureText(test).width <= maxLineW) {
        curLine = test;
      } else {
        if (curLine) lines.push(curLine);
        curLine = w;
      }
    }
    if (curLine) lines.push(curLine);

    const textW = Math.max(80, Math.min(180, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14));
    const lineH = 9;
    const textH = lines.length * lineH + 8;
    const bx = worldX - textW / 2;
    const by = worldY - textH;

    ctx.fillStyle = '#f7edd7';
    ctx.fillRect(bx, by, textW, textH);
    ctx.strokeStyle = '#161426';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, textW - 1, textH - 1);

    // Mũi nhọn bong bóng trỏ xuống đầu quái
    ctx.beginPath();
    ctx.moveTo(worldX - 4, by + textH);
    ctx.lineTo(worldX + 4, by + textH);
    ctx.lineTo(worldX, by + textH + 5);
    ctx.fill();

    ctx.fillStyle = '#541924';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], worldX, by + 4 + i * lineH);
    }
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
