/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ĐẤU TRƯỜNG PHÒNG BOSS XƯỞNG MAY CỔ & TRẬN CHIẾN "BÓNG LÃNG QUÊN"
 * Nền xưởng may cổ: Thước dây gỗ, kéo may, giỏ kim chỉ, thùng gỗ, đuốc than hồng.
 * HUD chuẩn mực:
 * - Thanh Boss Lãng Quên: "BÓNG LÃNG QUÊN" bên trái, "LÃNG QUÊN: xx%" bên phải, không chồng chữ.
 * - Khay 3 Thẻ Sự Thật: phím 1-3 chọn/ném, thẻ đúng phá khiên & boss mất Lãng Quên, thẻ sai boss mạnh nhẹ; thẻ mờ đi và tự động nạp thẻ mới.
 * - Đòn J (combo 3) & chiêu K (kim chỉ) gây sát thương, hit-stop 3-5 frame, đẩy lùi, tia sáng, chớp màu.
 * - Thua (Ký Ức = 0): Hiện màn "Ký ức mờ dần" với nút Thử lại (giữ tiến độ Lãng Quên) và Về bản đồ.
 * - Thắng (Lãng Quên = 0): Boss tan biến, hiện đoạn kể lịch sử và tiến vào Màn Ráp Áo.
 */

import { GameRenderer } from '../engine/renderer.ts';
import { GameCamera } from '../engine/camera.ts';
import { PhysicsEngine } from '../engine/physics.ts';
import { ParticleSystem } from '../engine/particles.ts';
import { AudioManager } from '../engine/audio.ts';
import { InputManager } from '../engine/input.ts';
import { Player } from './entities/player.ts';
import { BossLangQuen } from './entities/bossLangQuen.ts';
import { SceneManager } from './sceneManager.ts';
import {
  drawBossBar,
  drawPlayerHUD,
  drawTruthCardSlot,
  drawDialogueBox,
  drawCanvasButton,
  drawBossSpeechBubbleSafe,
  draw9Slice,
  get9SliceCanvas,
  drawPixelTextWithShadow,
  drawSpiderWebShield,
} from '../art/nineSlice.ts';

export interface ArenaTruthCard {
  id: number;
  text: string;
  isCorrect: boolean;
  artisanNote: string;
  isDimmed?: boolean;
  replaceTimer?: number;
}

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

  // Kho thẻ Sự Thật Chương 1 (Bao gồm cả chân lý và các ngộ nhận phổ biến)
  private cardPool: ArenaTruthCard[] = [
    {
      id: 1,
      text: 'Năm thân áo tượng trưng tứ thân phụ mẫu và thân con',
      isCorrect: true,
      artisanNote: 'Bốn thân ngoài che chở thân con bên trong, nhắc nhớ công ơn phụ mẫu!',
    },
    {
      id: 2,
      text: 'Năm chiếc khuy nhắc nhở đạo lý Ngũ Thường Nhân Nghĩa Lễ Trí Tín',
      isCorrect: true,
      artisanNote: 'Mỗi hạt khuy gài chặt là một lời răn giữ gìn năm đức hạnh làm người!',
    },
    {
      id: 3,
      text: 'Cổ đứng lập lĩnh giữ phong thái chính trực đĩnh đạc',
      isCorrect: true,
      artisanNote: 'Cổ đứng ôm khít kín đáo, thể hiện phong thái tôn nghiêm nhã nhặn!',
    },
    {
      id: 4,
      text: 'Vạt áo dài quá gối tạo nên dáng đi khoan thai mực thước',
      isCorrect: true,
      artisanNote: 'Độ dài tà áo tạo dáng đi khoan thai, khiêm tốn của người mặc!',
    },
    {
      id: 5,
      text: 'Áo ngũ thân may 4 thân mặc trong 5 mùa xuân hạ thu đông',
      isCorrect: false,
      artisanNote: 'Ngộ nhận rồi con! Ngũ thân là 5 thân vải cấu thành, không phải 5 mùa!',
    },
    {
      id: 6,
      text: 'Khuy áo chỉ là vật đính trang trí không mang ý niệm luân lý',
      isCorrect: false,
      artisanNote: 'Chưa đúng! Năm hạt khuy gắn liền với Ngũ Thường Nhân Nghĩa Lễ Trí Tín!',
    },
    {
      id: 7,
      text: 'Cổ áo ngũ thân phanh rộng thoải mái không có viền đứng',
      isCorrect: false,
      artisanNote: 'Sai rồi! Áo ngũ thân có cổ đứng lập lĩnh kín đáo và nghiêm cẩn!',
    },
    {
      id: 8,
      text: 'Áo ngũ thân vốn chỉ dành riêng cho quan lại cung đình',
      isCorrect: false,
      artisanNote: 'Không phải đâu! Áo ngũ thân là thường phục của toàn thể người Việt xưa!',
    },
  ];

  // Khay 3 thẻ Sự Thật hoạt động trong trận đấu (Yêu cầu 2 & 3)
  public selectedTruthCardIndex = 0;
  public truthCards: ArenaTruthCard[] = [];

  // Lời nhận xét của Cụ Nghệ Nhân khi ném thẻ
  public artisanComment: string | null = null;
  public artisanCommentTimer = 0;

  // Hướng dẫn đầu trận đấu (Yêu cầu 4: 3 dòng tự tắt sau 4s hoặc khi bấm phím bất kỳ)
  public tutorialTimer = 240;

  // Cảnh giới thiệu Boss đầu trận (Yêu cầu 5: camera zoom nhẹ, thanh Lãng Quên trượt vào, chữ BÓNG LÃNG QUÊN)
  public introTimer = 90;

  // Thanh Lãng Quên giảm có hiệu ứng (Yêu cầu 2: phần mất chớp rồi mờ)
  public lagHp = 300;

  // Trạng thái thắng trận & kết thúc
  public isVictory = false;
  public hasTriggeredTransition = false;
  public isGameOver = false;
  public defeatChoiceIndex = 0; // 0: Thử lại, 1: Về bản đồ

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

    // Khởi tạo khay 3 thẻ ngẫu nhiên ban đầu
    this.initTruthCards();
  }

  private initTruthCards(): void {
    const shuffled = [...this.cardPool].sort(() => Math.random() - 0.5);
    this.truthCards = shuffled.slice(0, 3).map((c) => ({
      ...c,
      isDimmed: false,
      replaceTimer: 0,
    }));
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

    // Cảnh giới thiệu Boss đầu trận (Yêu cầu 5: camera zoom nhẹ vào boss, thanh Lãng Quên trượt vào)
    if (this.introTimer > 0) {
      if (this.introTimer === 90) {
        this.camera.triggerZoom(1.12, 60, this.boss.x, this.boss.y - 40);
      } else if (this.introTimer === 45) {
        this.camera.resetZoom();
      }
      this.introTimer--;
    }

    // 0. Bảng hướng dẫn đầu màn: tự tắt sau 4s hoặc khi bấm phím bất kỳ (Yêu cầu 4)
    if (this.tutorialTimer > 0) {
      if (
        this.input.isPressed('attack') ||
        this.input.isPressed('special') ||
        this.input.isPressed('jump') ||
        this.input.isPressed('left') ||
        this.input.isPressed('right') ||
        this.input.isPressed('dodge') ||
        this.input.isPressed('card1') ||
        this.input.isPressed('card2') ||
        this.input.isPressed('card3')
      ) {
        this.tutorialTimer = 0;
      } else {
        this.tutorialTimer--;
      }
    }

    // Cập nhật thanh Lãng Quên giảm có hiệu ứng (phần mất chớp rồi mờ) (Yêu cầu 2)
    if (this.lagHp > this.boss.hp) {
      this.lagHp = Math.max(this.boss.hp, this.lagHp - 1.2);
    } else {
      this.lagHp = this.boss.hp;
    }

    // Xử lý đếm ngược lời dặn của nghệ nhân
    if (this.artisanCommentTimer > 0) {
      this.artisanCommentTimer--;
      if (this.artisanCommentTimer <= 0) {
        this.artisanComment = null;
      }
    }

    // 1. Xử lý khi ĐANG TRONG MÀN THUA (Yêu cầu 6: Ký Ức về 0)
    if (this.isGameOver) {
      if (this.input.isPressed('left')) {
        this.defeatChoiceIndex = 0;
        this.audio.playAttackSwing();
      } else if (this.input.isPressed('right')) {
        this.defeatChoiceIndex = 1;
        this.audio.playAttackSwing();
      } else if (this.input.isPressed('attack') || this.input.isPressed('jump')) {
        this.handleDefeatChoice(this.defeatChoiceIndex);
      }
      this.particles.update();
      return;
    }

    // 2. Xử lý Thắng trận (Yêu cầu 7: mở mảnh ghép cuối, chuyển sang RAP_AO)
    if (this.boss.isDead && !this.isVictory) {
      this.isVictory = true;
      this.audio.playVictoryFanfare();
      this.particles.spawnFloatingText(240, 80, 'HOÀN THÀNH CHƯƠNG 1!!', '#fedb5b');

      // Mở khóa mảnh ghép cuối cùng và lưu tiến độ
      try {
        const saved = JSON.parse(localStorage.getItem('tam_phuc_ky_progress') || '{}');
        saved['c1_boss'] = true;
        saved['c1_m4'] = true;
        localStorage.setItem('tam_phuc_ky_progress', JSON.stringify(saved));
      } catch (err) {
        console.warn('Could not save progress:', err);
      }
      const sceneMgr = SceneManager.getInstance();
      sceneMgr.isBossDefeated = true;
      if (!sceneMgr.collectedPieces.includes('c1_m4')) {
        sceneMgr.collectedPieces.push('c1_m4');
      }
      sceneMgr.saveProgress();
    }

    // Khi đã thắng: bấm phím tấn công / nhảy / Enter để chuyển sang RAP_AO
    if (this.isVictory) {
      if (this.input.isPressed('attack') || this.input.isPressed('jump')) {
        const sceneMgr = SceneManager.getInstance();
        sceneMgr.changeScene('RAP_AO');
        this.audio.playVictoryFanfare();
      }
      this.particles.update();
      return;
    }

    // 3. Chọn & Dùng Thẻ bằng phím 1, 2, 3 (Yêu cầu 2)
    if (this.input.isPressed('card1')) this.useCard(0);
    if (this.input.isPressed('card2')) this.useCard(1);
    if (this.input.isPressed('card3')) this.useCard(2);

    // Cập nhật hồi thẻ / thay thẻ mới cho khay thẻ (để không bao giờ hết thẻ)
    for (let i = 0; i < this.truthCards.length; i++) {
      const c = this.truthCards[i];
      if (c.isDimmed && c.replaceTimer !== undefined) {
        c.replaceTimer--;
        if (c.replaceTimer <= 0) {
          const currentTexts = this.truthCards.map((tc) => tc.text);
          const available = this.cardPool.filter((p) => !currentTexts.includes(p.text));
          const nextCard = available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : this.cardPool[Math.floor(Math.random() * this.cardPool.length)];
          this.truthCards[i] = { ...nextCard, isDimmed: false, replaceTimer: 0 };
          this.particles.spawnFloatingText(176 + i * 100 + 40, 205, 'THẺ MỚI!', '#fedb5b');
        }
      }
    }

    // 4. Hit-stop camera
    if (this.camera.isInHitStop()) {
      this.camera.update(this.player.x, this.player.y, true);
      this.particles.update(true);
      return;
    }

    // 5. Cập nhật nhân vật & Boss
    this.player.update(this.input, this.audio, this.particles, this.camera, this.physics);
    this.boss.update(this.player, this.difficulty, this.particles, this.audio, this.camera);

    // 6. Kiểm tra Ký Ức người chơi về 0 -> Bật màn thua (Yêu cầu 6)
    if (this.player.kyUcHearts <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.player.kyUcHearts = 0;
      this.player.state = 'idle';
      this.audio.playPlayerHurt();
      this.audio.playDefeatSound();
      this.camera.triggerShake(5, 20);
      this.particles.spawnFloatingText(this.player.x, this.player.y - 40, 'KÝ ỨC MỜ DẦN...', '#bf363b');
    }

    // 7. Cập nhật Camera và Hạt
    this.camera.x = 0;
    this.camera.update(this.player.x, this.player.y);
    this.particles.update();
  }

  /**
   * Chọn thẻ và phóng vào Boss (Yêu cầu 2)
   */
  public selectCard(idx: number): void {
    this.useCard(idx);
  }

  public useCard(idx: number): void {
    if (idx < 0 || idx >= this.truthCards.length) return;
    const card = this.truthCards[idx];
    if (!card || card.isDimmed || this.boss.isDead || this.isGameOver) return;

    this.selectedTruthCardIndex = idx;

    // Đánh dấu thẻ đã dùng (bị làm mờ và hẹn giờ thay mới - Chế độ Dễ hồi thẻ nhanh hơn)
    card.isDimmed = true;
    card.replaceTimer = this.difficulty === 'de' ? 55 : 95; // Yêu cầu 7: chế độ dễ hồi chiêu ngắn hơn

    // Thẻ đúng/sai bay theo đường cong vào khiên boss (Yêu cầu 4)
    this.audio.playSpecialSkill();
    this.particles.spawnCurvedCard(
      this.player.x,
      this.player.y - 20,
      this.boss.x,
      this.boss.y - 45,
      card.isCorrect
    );

    // Boss phản ứng với Thẻ Sự Thật
    this.boss.hitByTruthCard(card.isCorrect, this.particles, this.camera, this.audio);

    // Dòng nhận xét của Nghệ Nhân May Đo
    if (card.isCorrect) {
      this.artisanComment = `Nghệ Nhân May Đo: "Chính xác! ${card.artisanNote}"`;
      this.artisanCommentTimer = 240;
      this.particles.spawnFloatingText(this.boss.x - 20, this.boss.y - 90, 'KHIÊN NỨT! -60 LÃNG QUÊN', '#77e0b5');
    } else {
      this.artisanComment = `Nghệ Nhân May Đo: "Chưa đúng rồi con! ${card.artisanNote}"`;
      this.artisanCommentTimer = 220;
      this.particles.spawnFloatingText(this.boss.x - 20, this.boss.y - 90, 'NGỘ NHẬN! BOSS MẠNH LÊN!', '#ba5e1b');
    }
  }

  /**
   * Thử lại sau khi Thua (Yêu cầu 6: Hồi Ký Ức, giữ tiến độ Lãng Quên hiện tại một phần)
   */
  public retryBattle(): void {
    this.isGameOver = false;
    this.player.kyUcHearts = this.player.maxHearts;
    this.player.chiEnergy = 80;
    this.player.state = 'idle';
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.x = 100;
    this.player.y = 200;
    this.player.invincibleTimer = 60;

    // Giữ lại phần lớn tiến độ Lãng Quên mà người chơi đã đánh mất của Boss
    // Boss chỉ hồi phục tối đa 35 HP
    this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + 35);
    this.boss.threadTraps = [];
    this.boss.threadMinions = [];
    this.boss.state = 'idle';
    this.boss.stateTime = 0;
    this.boss.attackCooldown = 50;

    this.audio.playSpecialSkill();
    this.particles.spawnFloatingText(this.player.x, this.player.y - 40, 'HỒI PHỤC KÝ ỨC!', '#77e0b5');
  }

  public handleDefeatChoice(choice: number): void {
    if (choice === 0) {
      this.retryBattle();
    } else {
      const sceneMgr = SceneManager.getInstance();
      sceneMgr.changeScene('CHAPTER_MAP');
    }
  }

  /**
   * Vẽ Nền Xưởng May Cổ Điển Hoàng Triều (Royal Atelier) Tuyệt Đẹp
   */
  public drawAtelierBackground(): void {
    const ctx = this.renderer.ctx;
    const w = GameRenderer.LOGIC_WIDTH;
    const h = GameRenderer.LOGIC_HEIGHT;

    // 1. Bức tường gỗ lim & gạch mộc Cung Đình
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 200);
    wallGrad.addColorStop(0, '#1a1024');
    wallGrad.addColorStop(1, '#2c1933');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, 200);

    // Mạch gạch vồ cổ kính với hoa văn gấm trầm
    ctx.fillStyle = 'rgba(63, 33, 66, 0.45)';
    for (let y = 8; y < 192; y += 16) {
      for (let x = 0; x < w; x += 32) {
        ctx.fillRect(x + ((y / 16) % 2 === 0 ? 0 : 16), y, 30, 14);
      }
    }

    // Cột gỗ sơn son thếp vàng 2 bên gian phòng
    [15, 455].forEach((px) => {
      ctx.fillStyle = '#6b1c1c';
      ctx.fillRect(px - 6, 0, 12, 200);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(px - 6, 20, 12, 2);
      ctx.fillRect(px - 6, 90, 12, 2);
      ctx.fillRect(px - 6, 160, 12, 2);
      // Đầu cột chạm hoa sen vàng
      ctx.fillRect(px - 8, 4, 16, 4);
    });

    // 1.5 Lư hương đồng hoàng gia & Làn khói trầm uốn lượn (Incense Burner)
    const burnerX = 240;
    const burnerY = 196;
    // Chân đỉnh đồng 3 chân
    ctx.fillStyle = '#6e5124';
    ctx.fillRect(burnerX - 7, burnerY + 2, 3, 2);
    ctx.fillRect(burnerX + 4, burnerY + 2, 3, 2);
    // Thân lư đồng
    ctx.fillStyle = '#b08b35';
    ctx.fillRect(burnerX - 8, burnerY - 4, 16, 6);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(burnerX - 9, burnerY - 5, 18, 2);
    // Nắp đỉnh chạm nghê
    ctx.fillStyle = '#6e5124';
    ctx.fillRect(burnerX - 5, burnerY - 8, 10, 3);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(burnerX - 2, burnerY - 10, 4, 3);

    // Làn khói trầm hương uốn lượn huyền ảo bốc lên
    ctx.strokeStyle = 'rgba(238, 215, 245, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(burnerX, burnerY - 10);
    const smokeWave1 = Math.sin(this.tick / 12) * 5;
    const smokeWave2 = Math.cos(this.tick / 14) * 7;
    ctx.bezierCurveTo(burnerX + smokeWave1, burnerY - 30, burnerX + smokeWave2, burnerY - 55, burnerX + smokeWave1 * 0.5, burnerY - 75);
    ctx.stroke();

    // 1.6 Bụi tơ lụa ngũ sắc lơ lửng trong không khí xưởng may (Silk Motes)
    for (let m = 0; m < 8; m++) {
      const moteX = ((m * 60 + Math.sin((this.tick + m * 20) / 20) * 30) % (w - 40)) + 20;
      const moteY = 30 + ((m * 22 + this.tick * 0.2) % 150);
      const motePulse = Math.sin((this.tick + m * 15) / 8);
      if (motePulse > 0) {
        ctx.fillStyle = m % 2 === 0 ? 'rgba(254, 219, 91, 0.55)' : 'rgba(119, 224, 181, 0.55)';
        ctx.fillRect(moteX, moteY, 1, 1);
      }
    }

    // 2. Tấm Đại Lụa Hoàng Gia (Tapestry Áo Nhật Bình & Long Bào đang may dở)
    // Tấm lụa gấm treo giữa tường
    ctx.fillStyle = '#4a1525';
    ctx.fillRect(170, 15, 140, 100);
    ctx.strokeStyle = '#f7af34';
    ctx.lineWidth = 1;
    ctx.strokeRect(170.5, 15.5, 139, 99);
    // Viền trong vàng kim
    ctx.strokeStyle = '#fedb5b';
    ctx.strokeRect(174.5, 19.5, 131, 91);

    // Họa tiết phượng hoàng & mây ngũ sắc thêu trên tấm lụa
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(230, 35, 20, 12);
    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(215, 48, 50, 4);
    ctx.fillRect(220, 54, 40, 4);
    ctx.fillStyle = '#ba5e1b';
    ctx.fillRect(226, 60, 28, 4);
    // Tua rua vàng buông rủ dưới đáy bức tranh thêu
    for (let tx = 176; tx < 304; tx += 6) {
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(tx, 116, 2, 8);
    }

    // 3. Khung cửi dệt lụa cổ (Ancient Wooden Loom)
    ctx.fillStyle = '#422416';
    ctx.fillRect(75, 40, 6, 95);
    ctx.fillRect(135, 40, 6, 95);
    ctx.fillRect(75, 45, 66, 4);
    ctx.fillRect(75, 115, 66, 4);
    // Dàn sợi tơ lụa căng dọc óng ánh
    ctx.strokeStyle = 'rgba(254, 219, 91, 0.4)';
    ctx.lineWidth = 1;
    for (let sx = 85; sx < 135; sx += 4) {
      ctx.beginPath();
      ctx.moveTo(sx, 49);
      ctx.lineTo(sx, 115);
      ctx.stroke();
    }

    // 4. Kệ gỗ bày các cuộn tơ lụa ngũ sắc hoàng gia
    ctx.fillStyle = '#4a2b1f';
    ctx.fillRect(335, 55, 95, 8);
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(335, 62, 95, 1);

    const silkRolls = [
      { col: '#bf363b', w: 16, h: 20 }, // Đỏ hoàng tộc
      { col: '#fedb5b', w: 16, h: 18 }, // Vàng cung đình
      { col: '#268c7e', w: 16, h: 22 }, // Lục biếc
      { col: '#a83b6f', w: 16, h: 17 }, // Tím sen
      { col: '#f7edd7', w: 16, h: 19 }, // Bạch lụa
    ];
    silkRolls.forEach((roll, idx) => {
      const rx = 340 + idx * 18;
      const ry = 55 - roll.h;
      ctx.fillStyle = roll.col;
      ctx.fillRect(rx, ry, roll.w, roll.h);
      ctx.strokeStyle = '#161426';
      ctx.strokeRect(rx + 0.5, ry + 0.5, roll.w - 1, roll.h - 1);
      // Nếp cuộn tròn đầu cuộn vải
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(rx + 2, ry + 2, roll.w - 4, 2);
    });

    // Cây kéo may cổ bằng đồng thau chạm trổ
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(380, 20, 3, 20);
    ctx.fillRect(385, 20, 3, 20);
    ctx.beginPath();
    ctx.arc(378, 42, 5, 0, Math.PI * 2);
    ctx.arc(388, 42, 5, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Đèn lồng bát giác hoàng cung lung linh tỏa ánh lửa ấm
    const flicker = Math.sin(this.tick / 5) * 1.5;
    [45, 435].forEach((tx) => {
      // Dây xích đồng treo đèn
      ctx.fillStyle = '#c7aa8d';
      ctx.fillRect(tx, 0, 1, 48);

      // Quầng hào quang ấm áp lan tỏa
      ctx.fillStyle = 'rgba(232, 136, 39, 0.14)';
      ctx.beginPath();
      ctx.arc(tx + 0.5, 58, 20 + flicker, 0, Math.PI * 2);
      ctx.fill();

      // Khung lồng đèn gỗ sơn son
      ctx.fillStyle = '#7a1f1f';
      ctx.fillRect(tx - 7, 48, 15, 18);
      // Giấy bồi đỏ cam lấp lánh ánh nến
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(tx - 5, 50, 11, 14);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(tx - 3, 53 + flicker * 0.5, 7, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx - 1, 55 + flicker * 0.5, 3, 4);

      // Tua rua vàng hoàng gia buông dài
      ctx.fillStyle = '#f7af34';
      ctx.fillRect(tx - 2, 66, 5, 8);
    });

    // 6. Mặt sàn gỗ gõ đỏ đánh bóng Cung Đình
    ctx.fillStyle = '#16101f';
    ctx.fillRect(0, 200, w, h - 200);

    // Kè viền gỗ son mặt sàn
    ctx.fillStyle = '#63281d';
    ctx.fillRect(0, 200, w, 5);
    ctx.fillStyle = '#9e4632';
    ctx.fillRect(0, 200, w, 1); // Gờ sáng

    // Mạch gỗ lát sàn so le kèm đinh đồng thau
    ctx.fillStyle = '#30130d';
    for (let x = 0; x < w; x += 36) {
      ctx.fillRect(x, 205, 1, 65);
      // Đinh tán đồng
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(x + 2, 208, 1, 1);
      ctx.fillRect(x + 2, 230, 1, 1);
      ctx.fillStyle = '#30130d';
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

    // 2.1 Bệ gỗ son thếp vàng Cung Đình
    for (const p of this.physics.platforms) {
      // Bóng đổ dưới bệ
      ctx.fillStyle = 'rgba(10, 8, 16, 0.45)';
      ctx.fillRect(p.x + 2, p.y + p.height, p.width, 3);

      // Thân bệ gỗ gụ đỏ thẫm
      ctx.fillStyle = '#591f1f';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Mặt bệ gỗ gõ đỏ bóng
      ctx.fillStyle = '#8a3329';
      ctx.fillRect(p.x, p.y, p.width, 3);
      ctx.fillStyle = '#c95b4b';
      ctx.fillRect(p.x, p.y, p.width, 1);

      // Gờ nẹp đồng viền vàng kim
      ctx.fillStyle = '#ba5e1b';
      ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(p.x, p.y + p.height - 1, p.width, 1);

      // Đấu củng đỡ bệ 2 bên
      ctx.fillStyle = '#381212';
      ctx.fillRect(p.x + 4, p.y + p.height, 4, 3);
      ctx.fillRect(p.x + p.width - 8, p.y + p.height, 4, 3);

      // Hoa văn hoa sen đồng chạm khắc giữa bệ
      const midX = Math.floor(p.x + p.width / 2);
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(midX - 3, p.y + 3, 6, 4);
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(midX - 1, p.y + 4, 2, 2);
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

    // 2.3 Vẽ Boss "Bóng Lãng Quên" (kèm hiệu ứng Chớp Trắng 2 khung & Tan Biến 4 khung)
    const bossAnim4 = Math.floor(this.tick / 8) % 4;

    // Bóng dưới chân boss (Yêu cầu 3)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 13, 27, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.boss.x, 201, 32, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    if (this.boss.flashTimer > 0) {
      // Yêu cầu 1: Chớp trắng boss 2 khung khi trúng đòn
      ctx.filter = 'brightness(10) contrast(1.5)';
    } else if (this.boss.state === 'vanish') {
      // Yêu cầu 7: Boss tan biến trong 4 khung hình
      ctx.globalAlpha = Math.max(0.1, 1 - (this.boss.stateTime * 0.25));
    }
    this.renderer.drawSprite('boss_idle', this.boss.x, this.boss.y, true, bossAnim4);
    ctx.restore();

    // ẢNH B: Khiên mạng nhện vẽ rõ quanh boss kèm nhãn "KHIÊN HIỂU LẦM"
    if (this.boss.shieldActive && this.boss.state !== 'vanish') {
      drawSpiderWebShield(ctx, this.boss.x, this.boss.y - 55, 62, this.tick, 'KHIÊN HIỂU LẦM', false);
    } else if (this.boss.shieldCrackedTimer > 0 && this.boss.state !== 'vanish') {
      // Khiên đang nứt (hiệu ứng nứt vỡ)
      drawSpiderWebShield(ctx, this.boss.x, this.boss.y - 55, 62, this.tick, 'KHIÊN HIỂU LẦM', true);
    }

    // ẢNH B: Bong bóng quan niệm sai nằm phía trên đầu boss, không che boss
    if (!this.boss.currentSpeech) {
      this.boss.currentSpeech = 'Áo ngũ thân vốn chỉ dành riêng cho quan lại cung đình, thứ dân không được mặc!';
      this.boss.speechTimer = 9999;
    }
    if (this.boss.currentSpeech && !this.boss.isDead && this.boss.speechTimer > 0) {
      drawBossSpeechBubbleSafe(ctx, this.boss.x - 70, this.boss.y - 128, this.boss.currentSpeech);
    }

    // 2.4 Phi đạn kim chỉ của người chơi
    for (const p of this.player.projectiles) {
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - p.width / 2 + 2, p.y - 1, p.width - 4, 2);
    }

    // 2.5 Nhân vật chính (Chiều cao ~1/5 khung hình 270px)
    // 2.5.1 Bóng dưới chân nhân vật (Yêu cầu 3)
    const playerDistFromGround = Math.max(0, 200 - this.player.y);
    const shadowScale = Math.max(0.35, 1 - playerDistFromGround / 100);
    ctx.save();
    ctx.fillStyle = `rgba(15, 13, 27, ${(0.4 * shadowScale).toFixed(2)})`;
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
      // Co giãn nhân vật (Squash and Stretch 2-3 khung hình)
      if (this.player.squashStretchX !== 1.0 || this.player.squashStretchY !== 1.0) {
        ctx.translate(this.player.x, this.player.y);
        ctx.scale(this.player.squashStretchX, this.player.squashStretchY);
        ctx.translate(-this.player.x, -this.player.y);
      }
      if (this.player.flashTimer > 0) {
        ctx.filter = 'brightness(5) contrast(1.5)';
      }
      this.renderer.drawSprite(playerSprite, this.player.x, this.player.y, this.player.flipX, frameIdx);
      ctx.restore();
    }

    // 2.5.2 Chế độ Debug (Phím F2): Hiện hitbox đòn đánh và hurtbox của boss (Yêu cầu 1 & 8)
    if (this.renderer.debugMode) {
      // Hurtbox của Player
      const hurtbox = this.player.getHurtbox();
      ctx.strokeStyle = '#40bfa3';
      ctx.lineWidth = 1;
      ctx.strokeRect(hurtbox.x + 0.5, hurtbox.y + 0.5, hurtbox.width - 1, hurtbox.height - 1);

      // Hitbox đòn đánh Player
      const hitbox = this.player.getAttackHitbox();
      if (hitbox) {
        ctx.strokeStyle = '#bf363b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hitbox.x + 0.5, hitbox.y + 0.5, hitbox.width - 1, hitbox.height - 1);
      }

      // Hurtbox của Boss
      const bossHurt = this.boss.getHurtbox();
      ctx.strokeStyle = '#f7af34';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bossHurt.x + 0.5, bossHurt.y + 0.5, bossHurt.width - 1, bossHurt.height - 1);

      // Hitbox phi đạn kim chỉ
      for (const p of this.player.projectiles) {
        ctx.strokeStyle = '#fedb5b';
        ctx.strokeRect(p.x - p.width / 2 + 0.5, p.y - p.height / 2 + 0.5, p.width - 1, p.height - 1);
      }
    }

    // 2.6 Hạt VFX
    this.particles.draw(ctx, 0);

    this.camera.restoreTransform(ctx);

    // 2.7 Lớp phủ hiệu ứng toàn màn hình (Speed Lines, Chiêu đặc biệt Focus & Chớp sáng va chạm Impact Flash)
    this.particles.drawScreenOverlays(ctx);
    this.camera.drawSpecialFocus(ctx);
    this.camera.drawImpactFlash(ctx);

    // 3. GIAO DIỆN HUD ARCADE
    // 3.0 Nút bấm trong canvas (Thống nhất nhãn HỎI NGHỆ NHÂN (T))
    drawCanvasButton(ctx, 8, 6, 80, 22, 'TẠM DỪNG (P)', false, '⏸');
    drawCanvasButton(ctx, 362, 6, 110, 22, 'HỎI NGHỆ NHÂN (T)', false, '💬');

    // 3.1 Thanh Boss "BÓNG LÃNG QUÊN" trượt vào từ trên xuống (Yêu cầu 5)
    const bossPercent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
    const lagPercent = Math.max(0, (this.lagHp / this.boss.maxHp) * 100);
    const barSlideProgress = this.introTimer > 0 ? Math.min(1, (90 - this.introTimer) / 30) : 1;
    const barY = Math.floor(-35 + barSlideProgress * 43); // Trượt từ -35 xuống 8
    drawBossBar(
      ctx,
      92,
      barY,
      265,
      28,
      bossPercent,
      'BÓNG LÃNG QUÊN',
      lagPercent,
      this.boss.shieldActive,
      this.boss.shieldCrackedTimer
    );

    // Tiêu đề intro Boss "BÓNG LÃNG QUÊN" trượt vào và mờ dần (Yêu cầu 5)
    if (this.introTimer > 10) {
      const introAlpha = Math.min(1, this.introTimer / 25, (90 - this.introTimer) / 15);
      ctx.save();
      ctx.globalAlpha = introAlpha;
      const panel = get9SliceCanvas();
      draw9Slice(ctx, panel, 130, 95, 220, 52, 6);
      drawPixelTextWithShadow(ctx, 'TRẬN CHIẾN CUỐI CÙNG', 240, 102, {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: '#e88827',
        align: 'center',
        shadowColor: '#161426',
      });
      drawPixelTextWithShadow(ctx, 'BÓNG LÃNG QUÊN', 240, 118, {
        font: 'bold 15px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        align: 'center',
        shadowColor: '#161426',
      });
      ctx.restore();
    }

    // 3.2 Bảng Debug F2 (Yêu cầu 8: hiện hitbox đòn đánh, hurtbox boss, trạng thái khiên và máu boss dạng số)
    if (this.renderer.debugMode && !SceneManager.getInstance().hideDebugHud) {
      ctx.fillStyle = 'rgba(15, 13, 27, 0.88)';
      ctx.fillRect(8, 32, 260, 48);
      ctx.strokeStyle = '#fedb5b';
      ctx.lineWidth = 1;
      ctx.strokeRect(8.5, 32.5, 259, 47);

      const percentNum = Math.round(bossPercent);
      const shieldStatus = this.boss.shieldActive
        ? 'BẬT'
        : `NỨT (${Math.ceil(this.boss.shieldCrackedTimer / 60)}s)`;
      drawPixelTextWithShadow(
        ctx,
        `[DEBUG F2] Boss HP: ${Math.round(this.boss.hp)} / ${this.boss.maxHp} (${percentNum}%)`,
        14,
        36,
        { font: '9px "Pixelify Sans", monospace', textColor: '#fedb5b' }
      );
      drawPixelTextWithShadow(
        ctx,
        `Trạng thái Khiên: ${shieldStatus} | Pha: ${this.boss.phase}`,
        14,
        48,
        {
          font: '9px "Pixelify Sans", monospace',
          textColor: this.boss.shieldActive ? '#e88827' : '#77e0b5',
        }
      );
      drawPixelTextWithShadow(
        ctx,
        `Player Hitbox: ${this.player.getAttackHitbox() ? 'ON' : 'OFF'} | Đã trúng: ${this.player.hasHitEnemyThisAttack ? 'CÓ' : 'CHƯA'}`,
        14,
        60,
        { font: '8px "Pixelify Sans", monospace', textColor: '#f7edd7' }
      );
    }

    // 3.3 HUD Người Chơi: Ký Ức & Chỉ
    drawPlayerHUD(ctx, 8, 214, this.player.kyUcHearts, this.player.maxHearts, this.player.chiEnergy, 4, 4);

    // 3.4 Khay Thẻ Sự Thật (Yêu cầu 3 & 5: chỉ dẫn trực quan thẻ đúng nhấp sáng viền khi khiên bật)
    const cardW = 92;
    const cardGap = 8;
    const startX = 176;
    const hintThreshold = this.difficulty === 'de' ? 180 : 360;
    const showVisualHint = this.boss.shieldActive && this.boss.shieldActiveTime >= hintThreshold;

    // ẢNH B: Chỉ dẫn cạnh khay Thẻ Sự Thật
    drawPixelTextWithShadow(ctx, '◀/▶ chọn, J ném'.normalize('NFC'), startX - 2, 203, {
      font: 'bold 8.5px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
      align: 'left',
    });

    // ẢNH B: Khi đang chọn thẻ, hiện đường ngắm từ nhân vật tới boss
    if (this.selectedTruthCardIndex >= 0 && !this.boss.isDead) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(254, 219, 91, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const startAimX = this.player.x + 12;
      const startAimY = this.player.y - 25;
      // Đường ngắm và nhãn NGẮM lệch hẳn ra ngoài vùng mặt boss (mặt boss x: 340-365, y: 140-165)
      const targetAimX = this.boss.x - 45;
      const targetAimY = this.boss.y - 72;
      const midAimX = (startAimX + targetAimX) / 2;
      const midAimY = Math.min(startAimY, targetAimY) - 45;
      ctx.moveTo(startAimX, startAimY);
      ctx.quadraticCurveTo(midAimX, midAimY, targetAimX, targetAimY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tâm ngắm (Reticle) tại rìa Khiên Boss
      const pulse = (Math.sin(this.tick * 0.15) + 1) / 2;
      ctx.strokeStyle = `rgba(254, 219, 91, ${0.7 + pulse * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(targetAimX, targetAimY, 13 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();

      drawPixelTextWithShadow(ctx, '🎯 NGẮM', targetAimX, targetAimY - 20, {
        font: 'bold 8px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        align: 'center',
      });
      ctx.restore();
    }

    this.truthCards.forEach((card, idx) => {
      const isSelected = idx === this.selectedTruthCardIndex;
      const cardSlotX = startX + idx * (cardW + cardGap);
      const cardSlotY = 214;
      drawTruthCardSlot(
        ctx,
        cardSlotX,
        cardSlotY,
        idx + 1,
        card.text,
        isSelected,
        cardW,
        50,
        card.isDimmed
      );

      // Yêu cầu 5: Thẻ đúng nhấp sáng nhẹ ở viền sau 6s (chế độ dễ: sau 3s) khi khiên đang bật
      if (showVisualHint && card.isCorrect && !card.isDimmed) {
        const pulse = (Math.sin(this.tick / 5) + 1) / 2; // 0..1
        ctx.save();
        ctx.strokeStyle = `rgba(254, 219, 91, ${0.45 + pulse * 0.55})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(cardSlotX + 1, cardSlotY + 1, cardW - 2, 48);
        ctx.restore();
      }
    });

    // 3.5 Bảng hướng dẫn đầu trận đấu (Yêu cầu 4: 3 dòng trong khung 9-slice)
    if (this.tutorialTimer > 0 && !this.isGameOver && !this.isVictory) {
      const tutX = 90;
      const tutY = 56;
      const tutW = 300;
      const tutH = 68;
      const panel = get9SliceCanvas();
      draw9Slice(ctx, panel, tutX, tutY, tutW, tutH, 6);

      drawPixelTextWithShadow(ctx, '⚔️ HƯỚNG DẪN CHIẾN ĐẤU', tutX + tutW / 2, tutY + 8, {
        font: 'bold 10px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        shadowColor: '#161426',
        align: 'center',
      });
      drawPixelTextWithShadow(ctx, '• Đánh: J. Chiêu: K.', tutX + 18, tutY + 24, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
        shadowColor: '#161426',
      });
      drawPixelTextWithShadow(ctx, '• Chọn thẻ: 1-3 để phá khiên.', tutX + 18, tutY + 38, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#77e0b5',
        shadowColor: '#161426',
      });
      drawPixelTextWithShadow(ctx, '(Tự đóng sau 4s hoặc bấm phím bất kỳ)', tutX + tutW / 2, tutY + 52, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#c7aa8d',
        shadowColor: '#161426',
        align: 'center',
      });
    }

    // 3.4 Nhận xét của Nghệ Nhân May Đo khi ném thẻ
    if (this.artisanComment) {
      drawDialogueBox(ctx, 75, 42, 330, 68, 'Nghệ Nhân May Đo:', this.artisanComment.replace(/^(Cụ Nghệ Nhân|Nghệ Nhân May Đo):\s*/, ''));
    }

    // 3.5 Bảng vinh danh chiến thắng Boss cuối (Yêu cầu 5)
    if (this.isVictory) {
      this.drawVictoryDialog(ctx);
    }

    // 3.6 Bảng THUA "KÝ ỨC MỜ DẦN" (Yêu cầu 6: Hồi Ký Ức, giữ tiến độ Lãng Quên)
    if (this.isGameOver) {
      this.drawDefeatDialog(ctx);
    }

    // 3.7 Bảng tạm dừng
    if (this.isPaused && !this.isGameOver && !this.isVictory) {
      ctx.fillStyle = 'rgba(22, 20, 38, 0.75)';
      ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);
      drawDialogueBox(ctx, 140, 100, 200, 70, 'TẠM DỪNG', 'Bấm phím [P] để tiếp tục trận chiến.');
    }

    // 3.8 Debug overlay
    this.renderer.drawDebugInfoOverlay();
  }

  /**
   * Bảng THẮNG trận đấu (Yêu cầu 5)
   */
  private drawVictoryDialog(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.85)';
    ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);

    const panel = get9SliceCanvas();
    const vx = 50;
    const vy = 30;
    const vw = 380;
    const vh = 210;
    draw9Slice(ctx, panel, vx, vy, vw, vh, 8);

    drawPixelTextWithShadow(ctx, '🏆 ĐẠI THẮNG BÓNG LÃNG QUÊN!', vx + vw / 2, vy + 12, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
      align: 'center',
    });

    const storyText =
      'Bụi mờ năm tháng đã tan biến! Cuộn chỉ rối hóa thành dải lụa vàng rực rỡ.\n\n' +
      'Ngươi đã hóa giải Bóng Lãng Quên và thu thập đủ 4 MẢNH GHÉP cấu tạo nên Áo Ngũ Thân Lập Lĩnh Cố Đô Huế:\n' +
      '• Mảnh 1: Thân Áo & Năm Tà    • Mảnh 2: Cổ Đứng Lập Lĩnh\n' +
      '• Mảnh 3: Năm Khuy Ngũ Thường • Mảnh 4: Tay Áo Chẽn\n\n' +
      'Toàn bộ trang phục đã sẵn sàng để phục hồi nét đẹp văn hóa!';

    const clean = storyText.normalize('NFC');
    const lines = clean.split('\n');
    let textY = vy + 38;
    for (const line of lines) {
      drawPixelTextWithShadow(ctx, line, vx + 16, textY, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
        shadowColor: '#161426',
      });
      textY += 13;
    }

    // Nút bấm tiến vào Màn Ráp Áo
    const btnW = 200;
    const btnH = 26;
    const btnX = vx + (vw - btnW) / 2;
    const btnY = vy + vh - 38;

    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);

    drawPixelTextWithShadow(ctx, '🧵 TIẾN VÀO MÀN RÁP ÁO (ENTER)', btnX + btnW / 2, btnY + 7, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: '#161426',
      shadowColor: '#77e0b5',
      align: 'center',
    });
  }

  /**
   * Bảng THUA: "KÝ ỨC MỜ DẦN" (Yêu cầu 6)
   */
  private drawDefeatDialog(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.85)';
    ctx.fillRect(0, 0, GameRenderer.LOGIC_WIDTH, GameRenderer.LOGIC_HEIGHT);

    const panel = get9SliceCanvas();
    const vx = 60;
    const vy = 45;
    const vw = 360;
    const vh = 180;
    draw9Slice(ctx, panel, vx, vy, vw, vh, 8);

    // Tiêu đề: Ký ức mờ dần
    drawPixelTextWithShadow(ctx, '💔 KÝ ỨC MỜ DẦN...', vx + vw / 2, vy + 14, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#bf363b',
      shadowColor: '#161426',
      align: 'center',
    });

    drawPixelTextWithShadow(
      ctx,
      'Bóng Lãng Quên đã che mờ tâm trí. Nhưng ngọn lửa di sản chưa bao giờ tắt!'.normalize('NFC'),
      vx + vw / 2,
      vy + 42,
      {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
        align: 'center',
      }
    );

    const percentLeft = Math.round((this.boss.hp / this.boss.maxHp) * 100);
    drawPixelTextWithShadow(
      ctx,
      `Tiến độ hóa giải Lãng Quên hiện tại: ${100 - percentLeft}% (sẽ được bảo lưu một phần)`.normalize('NFC'),
      vx + vw / 2,
      vy + 62,
      {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        align: 'center',
      }
    );

    // Nút 0: THỬ LẠI (Hồi Ký Ức)
    const btn0Sel = this.defeatChoiceIndex === 0;
    ctx.fillStyle = btn0Sel ? '#40bfa3' : '#1c5e59';
    ctx.fillRect(80, vy + 95, 140, 28);
    ctx.strokeStyle = btn0Sel ? '#fedb5b' : '#77e0b5';
    ctx.lineWidth = btn0Sel ? 2 : 1;
    ctx.strokeRect(80.5, vy + 95.5, 139, 27);

    drawPixelTextWithShadow(ctx, '🔄 THỬ LẠI (HỒI KÝ ỨC)', 150, vy + 103, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: btn0Sel ? '#161426' : '#ffffff',
      shadowColor: btn0Sel ? '#77e0b5' : '#161426',
      align: 'center',
    });

    // Nút 1: VỀ BẢN ĐỒ
    const btn1Sel = this.defeatChoiceIndex === 1;
    ctx.fillStyle = btn1Sel ? '#bf363b' : '#4f3547';
    ctx.fillRect(240, vy + 95, 140, 28);
    ctx.strokeStyle = btn1Sel ? '#fedb5b' : '#a83b6f';
    ctx.lineWidth = btn1Sel ? 2 : 1;
    ctx.strokeRect(240.5, vy + 95.5, 139, 27);

    drawPixelTextWithShadow(ctx, '🗺️ VỀ BẢN ĐỒ', 310, vy + 103, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: btn1Sel ? '#fedb5b' : '#f7edd7',
      shadowColor: '#161426',
      align: 'center',
    });

    drawPixelTextWithShadow(ctx, '[◀/▶] Chọn  •  [ENTER / J / CHẠM] Xác nhận'.normalize('NFC'), vx + vw / 2, vy + 145, {
      font: '8px "Pixelify Sans", monospace',
      textColor: '#c7aa8d',
      align: 'center',
    });
  }
}
