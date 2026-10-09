/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VỎ BỌC GAME TOÀN MÀN HÌNH (FULLSCREEN RETRO CANVAS SHELL)
 * Hệ thống Quản lý Trạng thái Game (Game State Management System) & Vòng lặp Cốt lõi (Core Game Loop)
 * - Quản lý các trạng thái: 'loading', 'playing', 'paused'
 * - Fixed-timestep 60Hz physics accumulator (chống giật lag và sai lệch tần số quét màn hình)
 * - Màn hình Nạp Game (Loading Screen) phong cách pixel 9-slice với thanh tiến trình mượt mà
 * - Menu Tạm Dừng (Pause Menu) đồng bộ hóa hoàn toàn với hệ thống trạng thái
 * - Canvas 480x270 logic scale theo số nguyên (Integer Scaling) phủ kín khung hình với letterbox #0f0d1b
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager, LookbookEntry } from '../../client/src/game/sceneManager.ts';
import { GameWorld } from '../../client/src/game/gameWorld.ts';
import { BossArenaWorld } from '../../client/src/game/bossArena.ts';
import { RapAoManager } from '../../client/src/game/rapAo.ts';
import { PaperdollRenderer, OutfitSelection } from '../../client/src/art/paperdoll.ts';
import { AlbumStorage } from '../../client/src/art/albumStorage.ts';
import { CHAPTER_1_JOURNAL } from '../../client/src/game/nhatKyTrangPhuc.ts';
import { AudioManager, BGMTrack } from '../../client/src/engine/audio.ts';
import { InputManager } from '../../client/src/engine/input.ts';
import { AccessibilityManager } from '../../client/src/engine/accessibility.ts';
import { GameRenderer } from '../../client/src/engine/renderer.ts';
import { AssetManager } from '../../client/src/assets/loader.ts';
import { WeatherManager } from '../../client/src/engine/weather.ts';
import { ParticleSystem } from '../../client/src/engine/particles.ts';
import { ClothingCodexManager, CLOTHING_CODEX_DATA } from '../../client/src/game/clothingCodex.ts';
import { evaluateOutfitRuleBased } from '../../server/rules.ts';
import {
  ensureFontLoaded,
  draw9Slice,
  get9SliceCanvas,
  drawPixelTextWithShadow,
  drawDialogueBox,
  drawActionCallout,
  drawCanvasButton,
} from '../../client/src/art/nineSlice.ts';

export const LOGIC_WIDTH = 480;
export const LOGIC_HEIGHT = 270;
export const FIXED_TIME_STEP = 1000 / 60; // 16.667ms per update tick (60Hz)

// ============================================================================
// HỆ THỐNG QUẢN LÝ TRẠNG THÁI GAME (GAME STATE MANAGEMENT SYSTEM)
// ============================================================================

export type CoreGameState = 'loading' | 'playing' | 'paused';

export interface GameStateSubscriber {
  (newState: CoreGameState, prevState: CoreGameState): void;
}

export class GameStateManager {
  private static instance: GameStateManager;

  private currentState: CoreGameState = 'loading';
  private previousState: CoreGameState = 'loading';
  private subscribers: Set<GameStateSubscriber> = new Set();

  public loadingProgress = 0; // 0..100
  public loadingMessage = 'Đang khởi động trò chơi...';
  public pauseTime = 0;

  private constructor() {}

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  public getState(): CoreGameState {
    return this.currentState;
  }

  public getPreviousState(): CoreGameState {
    return this.previousState;
  }

  public isLoading(): boolean {
    return this.currentState === 'loading';
  }

  public isPlaying(): boolean {
    return this.currentState === 'playing';
  }

  public isPaused(): boolean {
    return this.currentState === 'paused';
  }

  public setState(newState: CoreGameState, message?: string): void {
    if (this.currentState === newState) return;
    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = newState;

    if (message) {
      this.loadingMessage = message;
    }

    if (newState === 'paused') {
      this.pauseTime = performance.now();
      SceneManager.getInstance().isPaused = true;
    } else if (newState === 'playing') {
      SceneManager.getInstance().isPaused = false;
    }

    this.notify(newState, oldState);
  }

  public updateLoading(progress: number, message: string): void {
    this.loadingProgress = Math.min(100, Math.max(0, progress));
    this.loadingMessage = message;
    if (this.currentState !== 'loading') {
      this.setState('loading', message);
    }
  }

  public finishLoading(): void {
    this.loadingProgress = 100;
    this.setState('playing');
  }

  public pause(): void {
    if (this.currentState === 'playing') {
      this.setState('paused');
    }
  }

  public resume(): void {
    if (this.currentState === 'paused') {
      this.setState('playing');
    }
  }

  public togglePause(): void {
    if (this.currentState === 'paused') {
      this.resume();
    } else if (this.currentState === 'playing') {
      this.pause();
    }
  }

  public subscribe(fn: GameStateSubscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify(newState: CoreGameState, prevState: CoreGameState): void {
    this.subscribers.forEach((fn) => fn(newState, prevState));
  }
}

interface GameShellProps {
  onToggleDevPanel: () => void;
  isDevPanelOpen: boolean;
}

export const GameShell: React.FC<GameShellProps> = ({ onToggleDevPanel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  // Quản lý Trạng thái Game cốt lõi
  const gameStateMgr = GameStateManager.getInstance();
  const [coreGameState, setCoreGameState] = useState<CoreGameState>(gameStateMgr.getState());
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>('Khởi tạo...');

  // Tham chiếu game engine
  const sceneMgr = SceneManager.getInstance();
  const audio = AudioManager.getInstance();
  const a11y = AccessibilityManager.getInstance();
  const input = InputManager.getInstance();
  const weatherMgr = WeatherManager.getInstance();
  const codexMgr = ClothingCodexManager.getInstance();

  const gameWorldRef = useRef<GameWorld | null>(null);
  const bossArenaRef = useRef<BossArenaWorld | null>(null);
  const rapAoRef = useRef<RapAoManager>(new RapAoManager());

  // Trạng thái Menu Tiêu Đề
  const [titleSelectedIndex, setTitleSelectedIndex] = useState(0);
  const titleMenuItems = [
    { id: 'start', label: '1. BẮT ĐẦU VÒNG CHƠI (MẤT ÁO)' },
    { id: 'map', label: '2. BẢN ĐỒ CỐ ĐÔ HUẾ' },
    { id: 'codex', label: '3. BÁCH KHOA CỔ PHỤC (C)' },
    { id: 'rap_ao', label: '4. MÀN RÁP ÁO NGŨ THÂN' },
    { id: 'lookbook', label: '5. PHÒNG THỬ ĐỒ & LOOKBOOK' },
    { id: 'reset', label: '6. ↺ CHƠI LẠI TỪ ĐẦU' },
    { id: 'settings', label: '7. CÀI ĐẶT & TIẾP CẬN' },
  ];

  // Trạng thái Màn Bản Đồ
  const [mapSelectedIndex, setMapSelectedIndex] = useState(0);
  const chapterStages = [
    { id: 'c1_m1', name: '1. Ngọ Môn', desc: 'Thân Áo & Năm Tà', x: 70, y: 155 },
    { id: 'c1_m2', name: '2. Sông Hương', desc: 'Cổ Đứng Lập Lĩnh', x: 150, y: 110 },
    { id: 'c1_m3', name: '3. Điện Thái Hòa', desc: 'Năm Khuy Ngũ Thường', x: 235, y: 145 },
    { id: 'c1_m4', name: '4. Lăng Tự Đức', desc: 'Tay Chẽn & Quần Lụa', x: 315, y: 105 },
    { id: 'c1_boss', name: '5. Xưởng May Cổ', desc: 'Trùm "Bóng Lãng Quên"', x: 405, y: 140 },
  ];

  // Trạng thái Menu Tạm Dừng (Pause Menu)
  const [pauseMenuIndex, setPauseMenuIndex] = useState(0);
  const [, setA11yVersion] = useState(0);

  // Danh mục Sự kiện Phối Đồ Remix
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const remixEvents = [
    { id: 'ky_yeu', name: 'Chụp Ảnh Kỷ Yếu Cố Đô', desc: 'Trẻ trung, năng động nhưng tôn trọng' },
    { id: 'le_hoi', name: 'Lễ Hội Hoa Đăng Sông Hương', desc: 'Thanh lịch, hài hòa đêm hội di sản' },
    { id: 'di_tich', name: 'Viếng Thăm Di Tích Đại Nội', desc: 'Trang nghiêm, kín đáo, đúng mực' },
    { id: 'ngay_tet', name: 'Dạo Phố Xuân Ngày Tết', desc: 'Rực rỡ, may mắn, chỉn chu tà áo' },
  ];

  // Danh mục phụ kiện và trang phục Remix
  const [quanIndex, setQuanIndex] = useState(0);
  const quanOptions = [
    { id: 'quan_lua_ong_rong', label: 'Quần Lụa Trắng Ống Rộng' },
    { id: 'quan_lua_den', label: 'Quần Lụa Đen Ống Rộng' },
    { id: 'quan_jean_dai', label: 'Quần Jean Dài Lịch Sự' },
    { id: 'quan_short', label: 'Quần Short Ngắn (Cảnh báo)' },
    { id: 'vay_ngan', label: 'Chân Váy Xòe Ngắn (Lệch)' },
  ];

  const [headwearIndex, setHeadwearIndex] = useState(0);
  const headwearOptions = [
    { id: 'khan_dong', label: 'Khăn Đóng Truyền Thống' },
    { id: 'non_bai_tho', label: 'Nón Bài Thơ Xứ Huế' },
    { id: 'none', label: 'Không Đội (Tóc Búi Gọn)' },
    { id: 'mu_luoi_trai', label: 'Mũ Lưỡi Trai Hiện Đại' },
  ];

  const [footwearIndex, setFootwearIndex] = useState(0);
  const footwearOptions = [
    { id: 'sneaker', label: 'Sneaker Trắng Tối Giản' },
    { id: 'guoc_moc', label: 'Guốc Mộc Cố Đô' },
    { id: 'giay_tay', label: 'Giày Tây Lịch Sự' },
  ];

  const [accessoryIndex, setAccessoryIndex] = useState(0);
  const accessoryOptions = [
    { id: 'hoa_sen', label: 'Hoa Sen Cầm Tay' },
    { id: 'quat_giay', label: 'Quạt Gấp Trầm Hương' },
    { id: 'tui_tho_cam', label: 'Túi Thổ Cẩm Dân Tộc' },
    { id: 'none', label: 'Không Mang Phụ Kiện' },
  ];

  // Trạng thái Remix trong canvas
  const [remixOutfit, setRemixOutfit] = useState<OutfitSelection>({
    ao: 'ao_ngu_than',
    aoColor: '#4f3547',
    quan: 'quan_lua_ong_rong',
    quanColor: '#f7edd7',
    headwear: 'khan_dong',
    accessory: 'hoa_sen',
    footwear: 'sneaker',
  });
  const [remixResult, setRemixResult] = useState<any>(null);
  const [isLookbookModalOpen, setIsLookbookModalOpen] = useState(false);

  // Trạng thái Hỏi Cụ Nghệ Nhân trong game (phím T)
  const [artisanChatText] = useState(
    'Áo ngũ thân lập lĩnh là chuẩn mực trang phục truyền thống của người Việt dưới thời Nguyễn. Bốn thân ngoài tượng trưng cho Tứ thân phụ mẫu, thân thứ năm bên trong che chở người mặc đó con!'
  );
  const [artisanChatTitle] = useState('Cụ Nghệ Nhân May Đo Cố Đô:');
  const touchStartYRef = useRef<number | null>(null);
  const bloomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vignetteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanlineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Đăng ký theo dõi thay đổi trạng thái Game
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__sceneManager = sceneMgr;
    }
    const unsub = gameStateMgr.subscribe((newState) => {
      setCoreGameState(newState);
      setLoadingPercent(gameStateMgr.loadingProgress);
      setLoadingText(gameStateMgr.loadingMessage);
    });
    return unsub;
  }, [gameStateMgr]);

  // Tính toán Integer Scaling
  useEffect(() => {
    const handleResize = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const integerScale = Math.max(1, Math.floor(Math.min(winW / LOGIC_WIDTH, winH / LOGIC_HEIGHT)));
      setScale(integerScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Nút cảm ứng chỉ hiện khi thiết bị có pointer coarse (cảm ứng)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(pointer: coarse)');
      setIsCoarsePointer(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
      if (mq.addEventListener) {
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      } else if ((mq as any).addListener) {
        (mq as any).addListener(handler);
        return () => (mq as any).removeListener(handler);
      }
    }
  }, []);

  // Hàm chuyển đổi Tạm Dừng (Pause)
  const togglePause = useCallback(() => {
    gameStateMgr.togglePause();
    audio.playItemCollect();
    setPauseMenuIndex(0);
  }, [audio, gameStateMgr]);

  // Lắng nghe phím tắt toàn cục
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mở khóa âm thanh WebAudio sau tương tác đầu tiên của người chơi
      audio.unlock();

      // F1: Mở bảng Dev ẩn
      if (e.key === 'F1') {
        e.preventDefault();
        onToggleDevPanel();
        return;
      }

      // F2: Bật / Tắt chế độ Debug
      if (e.key === 'F2') {
        e.preventDefault();
        GameRenderer.debugMode = !GameRenderer.debugMode;
        console.log(`[Debug Mode]: ${GameRenderer.debugMode ? 'BẬT' : 'TẮT'}`);
        return;
      }

      // P: Kích hoạt / Tắt Menu Tạm Dừng (Pause Menu)
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      // T: Hỏi Cụ Nghệ Nhân trong game
      if (e.key === 't' || e.key === 'T') {
        sceneMgr.isArtisanChatOpen = !sceneMgr.isArtisanChatOpen;
        audio.playItemCollect();
        return;
      }

      // C: Mở / Đóng Bách Khoa Cổ Phục (In-Game Codex)
      if (e.key === 'c' || e.key === 'C') {
        sceneMgr.isCodexOpen = !sceneMgr.isCodexOpen;
        audio.playItemCollect();
        return;
      }

      // ESC: Trong chế độ chụp ảnh -> đóng cảnh và mở lại Dev Panel (không mở menu tạm dừng)
      if (e.key === 'Escape') {
        if (sceneMgr.activeProofScene || sceneMgr.photoModeTarget) {
          sceneMgr.activeProofScene = null;
          sceneMgr.photoModeTarget = null;
          sceneMgr.isTimeFrozen = false;
          sceneMgr.hideDebugHud = false;
          setIsDevPanelOpen(true);
          return;
        }
        if (gameStateMgr.isPaused()) {
          gameStateMgr.resume();
          audio.playItemCollect();
        } else if (sceneMgr.isArtisanChatOpen) {
          sceneMgr.isArtisanChatOpen = false;
        } else if (sceneMgr.isSettingsModalOpen) {
          sceneMgr.isSettingsModalOpen = false;
        } else if (sceneMgr.isCodexOpen) {
          sceneMgr.isCodexOpen = false;
          audio.playItemCollect();
        } else if (sceneMgr.currentScene === 'LEVEL' || sceneMgr.currentScene === 'BOSS') {
          if (sceneMgr.currentScene === 'BOSS' && bossArenaRef.current?.isGameOver) {
            sceneMgr.changeScene('CHAPTER_MAP');
            return;
          }
          togglePause();
        } else if (sceneMgr.currentScene === 'CHAPTER_MAP' || sceneMgr.currentScene === 'RAP_AO' || sceneMgr.currentScene === 'REMIX') {
          sceneMgr.changeScene('TITLE');
        }
        return;
      }

      // ĐIỀU KHIỂN KHI ĐANG MỞ MODAL CÀI ĐẶT
      if (sceneMgr.isSettingsModalOpen) {
        if (e.key === '1') {
          audio.toggleMute();
          setA11yVersion((v) => v + 1);
        } else if (e.key === '2') {
          audio.toggleMusicMute();
          setA11yVersion((v) => v + 1);
        } else if (e.key === '3') {
          const nextVol = (Math.round(a11y.settings.volume / 20) * 20 + 20) % 120;
          audio.setVolume(nextVol / 100);
          audio.playItemPickup();
          setA11yVersion((v) => v + 1);
        } else if (e.key === 'ArrowLeft' || e.key === '-' || e.key === '[') {
          const newVol = Math.max(0, a11y.settings.volume - 10);
          audio.setVolume(newVol / 100);
          audio.playItemPickup();
          setA11yVersion((v) => v + 1);
        } else if (e.key === 'ArrowRight' || e.key === '+' || e.key === '=' || e.key === ']') {
          const newVol = Math.min(100, a11y.settings.volume + 10);
          audio.setVolume(newVol / 100);
          audio.playItemPickup();
          setA11yVersion((v) => v + 1);
        } else if (e.key === '4') {
          a11y.updateSetting('reduceMotion', !a11y.settings.reduceMotion);
          setA11yVersion((v) => v + 1);
        } else if (e.key === '5') {
          a11y.updateSetting('postProcessingBloom', !a11y.settings.postProcessingBloom);
          setA11yVersion((v) => v + 1);
        } else if (e.key === '6') {
          a11y.updateSetting('highContrast', !a11y.settings.highContrast);
          setA11yVersion((v) => v + 1);
        } else if (e.key === '7') {
          a11y.updateSetting('difficulty', a11y.settings.difficulty === 'de' ? 'thuong' : 'de');
          setA11yVersion((v) => v + 1);
        } else if (e.key === '8') {
          a11y.updateSetting('virtualControls', !a11y.settings.virtualControls);
          setA11yVersion((v) => v + 1);
        } else if (e.key === '9') {
          a11y.updateSetting('weatherEffects', !a11y.settings.weatherEffects);
          setA11yVersion((v) => v + 1);
        } else if (e.key === 'Escape') {
          sceneMgr.isSettingsModalOpen = false;
          audio.playItemCollect();
        }
        return;
      }

      // ĐIỀU KHIỂN KHI ĐANG MỞ MODAL BÁCH KHOA CỔ PHỤC (CODEX)
      if (sceneMgr.isCodexOpen) {
        if (codexMgr.isPixelArtViewerOpen) {
          if (
            e.key === 'Escape' ||
            e.key === 'v' ||
            e.key === 'V' ||
            e.key === 'Enter' ||
            e.key === ' ' ||
            e.key === 'c' ||
            e.key === 'C'
          ) {
            codexMgr.isPixelArtViewerOpen = false;
            audio.playAttackSwing();
          }
          return;
        }

        if (e.key === 'v' || e.key === 'V') {
          codexMgr.isPixelArtViewerOpen = true;
          audio.playSpecialSkill();
          return;
        }

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          codexMgr.selectedIndex = codexMgr.selectedIndex > 0 ? codexMgr.selectedIndex - 1 : CLOTHING_CODEX_DATA.length - 1;
          codexMgr.scrollOffset = 0;
          audio.playAttackSwing();
          return;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          codexMgr.selectedIndex = codexMgr.selectedIndex < CLOTHING_CODEX_DATA.length - 1 ? codexMgr.selectedIndex + 1 : 0;
          codexMgr.scrollOffset = 0;
          audio.playAttackSwing();
          return;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          codexMgr.scrollUp();
          audio.playAttackSwing();
          return;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          codexMgr.scrollDown();
          audio.playAttackSwing();
          return;
        }
        return;
      }

      // ĐIỀU KHIỂN KHI MỞ CỐT TRUYỆN MẤT ÁO (CÔ HẠNH)
      if (sceneMgr.isStoryCutsceneOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J' || e.key === 'Escape') {
          sceneMgr.isStoryCutsceneOpen = false;
          sceneMgr.changeScene('LEVEL', 'c1_m1');
          audio.startAmbientBGM();
          audio.playItemCollect();
          return;
        }
        return;
      }

      // ĐIỀU KHIỂN KHI MỞ MODAL LOOKBOOK
      if (isLookbookModalOpen) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          setIsLookbookModalOpen(false);
          audio.playItemCollect();
          return;
        }
        return;
      }

      // ĐIỀU KHIỂN KHI ĐANG MỞ MENU TẠM DỪNG (PAUSE MENU)
      if (gameStateMgr.isPaused()) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          setPauseMenuIndex((prev) => (prev > 0 ? prev - 1 : 8));
          audio.playAttackSwing();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          setPauseMenuIndex((prev) => (prev < 8 ? prev + 1 : 0));
          audio.playAttackSwing();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          handlePauseMenuAdjust(pauseMenuIndex, -1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          handlePauseMenuAdjust(pauseMenuIndex, 1);
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
          handlePauseMenuSelect(pauseMenuIndex);
        }
        return;
      }

      // Menu Tiêu Đề
      if (sceneMgr.currentScene === 'TITLE' && !sceneMgr.isSettingsModalOpen && !sceneMgr.isCodexOpen) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          setTitleSelectedIndex((prev) => (prev > 0 ? prev - 1 : titleMenuItems.length - 1));
          audio.playAttackSwing();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          setTitleSelectedIndex((prev) => (prev < titleMenuItems.length - 1 ? prev + 1 : 0));
          audio.playAttackSwing();
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
          handleSelectTitleMenuItem(titleSelectedIndex);
        }
      }

      // Menu Bản Đồ Điều Khiển
      if (sceneMgr.currentScene === 'CHAPTER_MAP' && !gameStateMgr.isPaused() && !sceneMgr.isArtisanChatOpen) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          setMapSelectedIndex((prev) => (prev > 0 ? prev - 1 : chapterStages.length - 1));
          audio.playAttackSwing();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          setMapSelectedIndex((prev) => (prev < chapterStages.length - 1 ? prev + 1 : 0));
          audio.playAttackSwing();
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
          handleSelectMapStage(mapSelectedIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [titleSelectedIndex, mapSelectedIndex, pauseMenuIndex, onToggleDevPanel, togglePause, gameStateMgr]);

  // Xử lý chọn trong Menu Tạm Dừng
  const handlePauseMenuSelect = (idx: number) => {
    audio.playItemCollect();
    if (idx === 0) {
      // 1. TIẾP TỤC (Resume)
      gameStateMgr.resume();
    } else if (idx === 1) {
      // 2. THOÁT VỀ BẢN ĐỒ (Exit to Map)
      gameStateMgr.resume();
      sceneMgr.changeScene('CHAPTER_MAP');
    } else if (idx === 2) {
      // 3. Âm thanh tổng (Bật / Tắt Mute)
      audio.toggleMute();
      setA11yVersion((v) => v + 1);
    } else if (idx === 3) {
      // 4. Tắt / Bật Nhạc nền riêng (Yêu cầu 3)
      audio.toggleMusicMute();
      setA11yVersion((v) => v + 1);
    } else if (idx === 4) {
      // 5. Giảm chuyển động (Reduce Motion)
      a11y.updateSetting('reduceMotion', !a11y.settings.reduceMotion);
      setA11yVersion((v) => v + 1);
    } else if (idx === 5) {
      // 6. Độ tương phản cao (High Contrast)
      a11y.updateSetting('highContrast', !a11y.settings.highContrast);
      setA11yVersion((v) => v + 1);
    } else if (idx === 6) {
      // 7. Chế độ khó
      a11y.updateSetting('difficulty', a11y.settings.difficulty === 'de' ? 'thuong' : 'de');
      setA11yVersion((v) => v + 1);
    } else if (idx === 7) {
      // 8. Hiệu ứng thời tiết
      a11y.updateSetting('weatherEffects', !a11y.settings.weatherEffects);
      setA11yVersion((v) => v + 1);
    } else if (idx === 8) {
      // 9. Chơi lại từ đầu
      sceneMgr.resetProgress();
      setRemixResult(null);
      gameStateMgr.resume();
      setA11yVersion((v) => v + 1);
      audio.playFragmentUnlock();
    }
  };

  const handlePauseMenuAdjust = (idx: number, delta: number) => {
    if (idx === 2) {
      // Chỉnh âm lượng tổng
      const newVol = Math.max(0, Math.min(100, a11y.settings.volume + delta * 10));
      audio.setVolume(newVol / 100);
      setA11yVersion((v) => v + 1);
      audio.playItemPickup();
    } else if (idx === 3) {
      // Bật/tắt nhạc nền
      audio.toggleMusicMute();
      setA11yVersion((v) => v + 1);
      audio.playItemPickup();
    } else if (idx === 7) {
      a11y.updateSetting('weatherEffects', !a11y.settings.weatherEffects);
      setA11yVersion((v) => v + 1);
      audio.playAttackSwing();
    }
  };

  const handleSelectTitleMenuItem = (idx: number) => {
    audio.playItemCollect();
    const item = titleMenuItems[idx];
    if (item.id === 'start') {
      if (sceneMgr.manh_da_co.length === 0) {
        sceneMgr.isStoryCutsceneOpen = true;
      } else {
        sceneMgr.changeScene('LEVEL', sceneMgr.currentLevelId || 'c1_m1');
        audio.startAmbientBGM();
      }
    } else if (item.id === 'map') {
      sceneMgr.changeScene('CHAPTER_MAP');
      audio.startAmbientBGM();
    } else if (item.id === 'codex') {
      sceneMgr.isCodexOpen = true;
    } else if (item.id === 'rap_ao') {
      sceneMgr.changeScene('RAP_AO');
    } else if (item.id === 'lookbook') {
      sceneMgr.changeScene('REMIX');
    } else if (item.id === 'reset') {
      sceneMgr.resetProgress();
      setRemixResult(null);
      audio.playFragmentUnlock();
      setA11yVersion((v) => v + 1);
    } else if (item.id === 'settings') {
      sceneMgr.isSettingsModalOpen = true;
    }
  };

  const handleSelectMapStage = (idx: number) => {
    const stage = chapterStages[idx];
    audio.playItemCollect();
    if (stage.id === 'c1_boss') {
      sceneMgr.changeScene('BOSS');
    } else {
      sceneMgr.changeScene('LEVEL', stage.id);
    }
  };

  // ============================================================================
  // VÒNG LẶP CHÍNH CỐT LÕI (CORE GAME LOOP) VỚI FIXED-TIMESTEP ACCUMULATOR
  // ============================================================================
  useEffect(() => {
    let animId: number;
    let isMounted = true;
    let loopTick = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // QUÁ TRÌNH NẠP TÀI NGUYÊN (LOADING STATE)
    const initializeGameAssets = async () => {
      gameStateMgr.updateLoading(10, 'Nạp phông chữ Pixelify Sans...');
      await ensureFontLoaded();

      gameStateMgr.updateLoading(35, 'Nạp tài sản hình ảnh & âm thanh...');
      await AssetManager.getInstance().loadAll();

      gameStateMgr.updateLoading(70, 'Khởi tạo màn chơi & Cố Đô Huế...');
      gameWorldRef.current = new GameWorld(canvas, sceneMgr.currentLevelId);
      bossArenaRef.current = new BossArenaWorld(canvas);

      gameStateMgr.updateLoading(100, 'Sẵn sàng bước vào hành trình!');
      // Độ trễ nhỏ để người chơi thấy thanh nạp đầy mượt mà
      setTimeout(() => {
        if (isMounted) {
          gameStateMgr.finishLoading();
        }
      }, 200);
    };

    initializeGameAssets();

    // FIXED TIME-STEP ACCUMULATOR (60Hz)
    let lastTime = performance.now();
    let accumulator = 0;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const gameLoop = (currentTime: number) => {
      if (!isMounted) return;
      animId = requestAnimationFrame(gameLoop);
      loopTick++;

      let deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Cập nhật đo đạc FPS & Frame Time
      frameCount++;
      if (currentTime - lastFpsTime >= 500) {
        GameRenderer.currentFps = Math.max(1, Math.round((frameCount * 1000) / (currentTime - lastFpsTime)));
        GameRenderer.currentFrameTime = deltaTime;
        frameCount = 0;
        lastFpsTime = currentTime;
      }

      // Bảo vệ chống "xoắn ốc hiệu năng" (spiral of death) khi tab bị ẩn hoặc lag
      if (deltaTime > 100) deltaTime = 100;

      const currentState = gameStateMgr.getState();

      // ======================================================================
      // ĐỒNG BỘ NHẠC NỀN THEO CẢNH & GIẢM ÂM (DUCKING) KHI HỘI THOẠI/TẠM DỪNG (Yêu cầu 3)
      // ======================================================================
      if (currentState !== 'loading') {
        const currentScene = sceneMgr.currentScene;
        let desiredTrack: BGMTrack = 'menu';
        if (currentScene === 'TITLE' || currentScene === 'CHAPTER_MAP') {
          desiredTrack = 'menu';
        } else if (currentScene === 'LEVEL') {
          desiredTrack = 'level';
        } else if (currentScene === 'BOSS') {
          desiredTrack = 'boss';
        } else if (currentScene === 'RAP_AO' || currentScene === 'REMIX') {
          desiredTrack = 'rap_ao';
        }
        audio.playBGM(desiredTrack);

        const isPaused = currentState === 'paused' || sceneMgr.isPaused || gameStateMgr.isPaused();
        const isDialogOpen = sceneMgr.isArtisanChatOpen || sceneMgr.isSettingsModalOpen || sceneMgr.isCodexOpen;
        const hasInGameMessage = Boolean(
          (gameWorldRef.current && gameWorldRef.current.artisanMessage !== null) ||
          (bossArenaRef.current && bossArenaRef.current.artisanComment !== null)
        );
        audio.setDucked(isPaused || isDialogOpen || hasInGameMessage);
      }

      // ======================================================================
      // 1. TRẠNG THÁI NẠP (LOADING STATE)
      // ======================================================================
      if (currentState === 'loading') {
        renderLoadingScreen(ctx, gameStateMgr.loadingProgress, gameStateMgr.loadingMessage, loopTick);
        return;
      }

      // ======================================================================
      // 2. TRẠNG THÁI ĐANG CHƠI (PLAYING STATE): Cập nhật vật lý 60Hz chuẩn xác
      // ======================================================================
      if (currentState === 'playing') {
        accumulator += deltaTime;
        while (accumulator >= FIXED_TIME_STEP) {
          // Cập nhật máy trạng thái cảnh
          sceneMgr.update();

          // Xử lý chuyển thẳng trạng thái Chế độ chụp ảnh minh chứng (Yêu cầu 10)
          if (sceneMgr.photoModeTarget === 'A') {
            if (sceneMgr.currentScene === 'LEVEL' && gameWorldRef.current) {
              const gw = gameWorldRef.current;
              if (gw.currentLevelId !== 'c1_m3') {
                gw.loadLevel('c1_m3');
              }
              const mb = gw.enemies.find((e) => e.isMiniBoss);
              if (mb) {
                mb.hasShield = true;
                mb.isDead = false;
                mb.x = 1020;
                mb.y = 200;
                mb.speechBubble = 'Năm hạt khuy áo gắn ngẫu nhiên từ cổ xuống chân để trang trí cho áo lấp lánh!';
                gw.player.x = 800;
                gw.player.y = 200;
                gw.player.flipX = false;
                gw.player.state = 'idle';
                gw.inBossArena = true;
                gw.camera.x = 1020 - 390;
                gw.camera.y = 0;
                gw.selectedTruthCardIndex = 0;
              }
              sceneMgr.photoModeTarget = null;
            }
          } else if (sceneMgr.photoModeTarget === 'B') {
            if (sceneMgr.currentScene === 'BOSS' && bossArenaRef.current) {
              const ba = bossArenaRef.current;
              ba.boss.shieldActive = true;
              ba.boss.isDead = false;
              ba.boss.hp = 255; // 85%
              ba.lagHp = 255;
              ba.boss.currentSpeech = 'Áo ngũ thân vốn chỉ dành riêng cho quan lại cung đình, thứ dân không được mặc!';
              ba.boss.speechTimer = 9999;
              ba.selectedTruthCardIndex = 0;
              ba.tutorialTimer = 0;
              ba.introTimer = 0;
              sceneMgr.photoModeTarget = null;
            }
          } else if (sceneMgr.photoModeTarget === 'C') {
            if (sceneMgr.currentScene === 'RAP_AO' && rapAoRef.current) {
              rapAoRef.current.triggerWrongPlacementDemo();
              sceneMgr.photoModeTarget = null;
            }
          }

          // Cập nhật màn chơi platformer
          if (sceneMgr.currentScene === 'LEVEL' && gameWorldRef.current) {
            if (gameWorldRef.current.currentLevelId !== sceneMgr.currentLevelId) {
              gameWorldRef.current.loadLevel(sceneMgr.currentLevelId);
            }
            if (!sceneMgr.isArtisanChatOpen && sceneMgr.fadeState === 'none' && !sceneMgr.isTimeFrozen) {
              gameWorldRef.current.update();
            }

            // Mở khóa màn tiếp theo
            if (gameWorldRef.current.isLevelCompleted) {
              sceneMgr.unlockNextLevel();
              if (sceneMgr.fadeState === 'none') {
                setTimeout(() => {
                  if (sceneMgr.currentLevelId === 'c1_m1') {
                    sceneMgr.changeScene('LEVEL', 'c1_m2');
                  } else if (sceneMgr.currentLevelId === 'c1_m2') {
                    sceneMgr.changeScene('LEVEL', 'c1_m3');
                  } else if (sceneMgr.currentLevelId === 'c1_m3') {
                    sceneMgr.changeScene('LEVEL', 'c1_m4');
                  } else if (sceneMgr.currentLevelId === 'c1_m4') {
                    sceneMgr.changeScene('BOSS');
                  } else {
                    sceneMgr.changeScene('RAP_AO');
                  }
                }, 1800);
              }
            }
          }
          // Cập nhật màn Boss
          else if (sceneMgr.currentScene === 'BOSS' && bossArenaRef.current) {
            bossArenaRef.current.difficulty = a11y.settings.difficulty;
            if (!sceneMgr.isArtisanChatOpen && sceneMgr.fadeState === 'none' && !sceneMgr.isTimeFrozen) {
              bossArenaRef.current.update();
            }

            // Nếu hạ Boss -> Chuyển sang màn Ráp Áo
            if (bossArenaRef.current.isVictory && !bossArenaRef.current.hasTriggeredTransition) {
              bossArenaRef.current.hasTriggeredTransition = true;
              sceneMgr.isBossDefeated = true;
              sceneMgr.saveProgress();
              if (sceneMgr.fadeState === 'none') {
                setTimeout(() => {
                  sceneMgr.changeScene('RAP_AO');
                }, 3500);
              }
            }
          }

          // Cập nhật thời tiết toàn cục
          if (a11y.settings.weatherEffects && !a11y.settings.reduceMotion) {
            const currentWeather = weatherMgr.getWeatherForScene(sceneMgr.currentScene, sceneMgr.currentLevelId);
            if (currentWeather !== 'none') {
              weatherMgr.update(currentWeather, LOGIC_WIDTH, LOGIC_HEIGHT);
            }
          }

          accumulator -= FIXED_TIME_STEP;
        }
      }
      // ======================================================================
      // 3. TRẠNG THÁI TẠM DỪNG (PAUSED STATE): Đóng băng vật lý, reset accumulator
      // ======================================================================
      else if (currentState === 'paused') {
        accumulator = 0;
      }

      // ======================================================================
      // 4. RENDER FRAME GAME HIỆN TẠI (MỌI TRẠNG THÁI)
      // ======================================================================
      // 4.1 Xóa nền canvas
      ctx.fillStyle = '#0f0d1b';
      ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

      // 4.2 Render cảnh tương ứng
      if (sceneMgr.currentScene === 'TITLE') {
        renderTitleScene(ctx);
      } else if (sceneMgr.currentScene === 'CHAPTER_MAP') {
        renderChapterMapScene(ctx);
      } else if (sceneMgr.currentScene === 'LEVEL') {
        if (gameWorldRef.current) {
          gameWorldRef.current.render();
        }
      } else if (sceneMgr.currentScene === 'BOSS') {
        if (bossArenaRef.current) {
          bossArenaRef.current.render();
        }
      } else if (sceneMgr.currentScene === 'RAP_AO') {
        renderRapAoScene(ctx);
      } else if (sceneMgr.currentScene === 'REMIX') {
        renderRemixScene(ctx);
      }

      // 4.3 Lớp phủ thời tiết
      if (a11y.settings.weatherEffects && !a11y.settings.reduceMotion) {
        const currentWeather = weatherMgr.getWeatherForScene(sceneMgr.currentScene, sceneMgr.currentLevelId);
        if (currentWeather !== 'none') {
          weatherMgr.draw(ctx, currentWeather);
        }
      }

      // 4.3.5 HẬU KỲ PROMAX: Bloom vùng sáng, Vignette điện ảnh & Scanlines nhẹ phong cách Arcade
      // Tắt hoàn toàn khi "Giảm hiệu ứng", FPS thấp (< 45 FPS) hoặc người dùng tắt trong Cài đặt
      if (
        !a11y.settings.reduceMotion &&
        a11y.settings.postProcessingBloom &&
        GameRenderer.currentFps >= 45
      ) {
        GameRenderer.isBloomActive = true;
        // 1. Bloom nhẹ bằng cách thu nhỏ và hòa trộn screen mờ dịu
        if (!bloomCanvasRef.current) {
          bloomCanvasRef.current = document.createElement('canvas');
          bloomCanvasRef.current.width = 120;
          bloomCanvasRef.current.height = 68;
        }
        const bCanvas = bloomCanvasRef.current;
        const bCtx = bCanvas.getContext('2d');
        if (bCtx) {
          bCtx.imageSmoothingEnabled = true;
          bCtx.drawImage(canvas, 0, 0, 120, 68);
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(bCanvas, 0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
          ctx.restore();
        }

        // 2. Vignette hoàng hôn điện ảnh (Cached offscreen canvas đạt 60 FPS mượt mà)
        ctx.save();
        if (!vignetteCanvasRef.current) {
          const vCan = document.createElement('canvas');
          vCan.width = LOGIC_WIDTH;
          vCan.height = LOGIC_HEIGHT;
          const vCtx = vCan.getContext('2d');
          if (vCtx) {
            const vignetteGrad = vCtx.createRadialGradient(
              LOGIC_WIDTH / 2,
              LOGIC_HEIGHT / 2,
              155,
              LOGIC_WIDTH / 2,
              LOGIC_HEIGHT / 2,
              270
            );
            vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignetteGrad.addColorStop(1, 'rgba(10, 8, 18, 0.40)');
            vCtx.fillStyle = vignetteGrad;
            vCtx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
          }
          vignetteCanvasRef.current = vCan;
        }
        ctx.drawImage(vignetteCanvasRef.current, 0, 0);
        ctx.restore();

        // 3. Scanline mờ nhẹ CRT Arcade (Cached 1 draw call thay vì lặp 135 fillRect mỗi frame)
        ctx.save();
        if (!scanlineCanvasRef.current) {
          const sCan = document.createElement('canvas');
          sCan.width = LOGIC_WIDTH;
          sCan.height = LOGIC_HEIGHT;
          const sCtx = sCan.getContext('2d');
          if (sCtx) {
            sCtx.fillStyle = 'rgba(0, 0, 0, 0.035)';
            for (let y = 0; y < LOGIC_HEIGHT; y += 2) {
              sCtx.fillRect(0, y, LOGIC_WIDTH, 1);
            }
          }
          scanlineCanvasRef.current = sCan;
        }
        ctx.drawImage(scanlineCanvasRef.current, 0, 0);
        ctx.restore();
      } else {
        GameRenderer.isBloomActive = false;
      }

      // 4.3.8 Chú thích nhỏ ở góc dưới khi ở chế độ chụp ảnh minh chứng (Yêu cầu 17)
      if (sceneMgr.activeProofScene) {
        ctx.save();
        const bannerTxt = `📸 Cảnh chụp: Ảnh ${sceneMgr.activeProofScene} [ESC: Về Dev | P: Chạy tiếp]`;
        ctx.fillStyle = 'rgba(15, 13, 27, 0.90)';
        ctx.fillRect(8, LOGIC_HEIGHT - 18, 224, 14);
        ctx.strokeStyle = '#fedb5b';
        ctx.lineWidth = 1;
        ctx.strokeRect(8.5, LOGIC_HEIGHT - 17.5, 223, 13);
        drawPixelTextWithShadow(ctx, bannerTxt, 12, LOGIC_HEIGHT - 15, {
          font: 'bold 7.5px "Pixelify Sans", monospace',
          textColor: '#fedb5b',
          baseline: 'top',
        });
        ctx.restore();
      }

      // 4.4 Render Lớp phủ Tạm Dừng & Modals
      if (currentState === 'paused' || sceneMgr.isPaused) {
        renderPauseMenu(ctx);
      } else if (sceneMgr.isStoryCutsceneOpen) {
        renderStoryCutsceneModal(ctx);
      } else if (isLookbookModalOpen) {
        renderLookbookModal(ctx);
      } else if (sceneMgr.isArtisanChatOpen) {
        renderArtisanChatModal(ctx);
      } else if (sceneMgr.isSettingsModalOpen) {
        renderSettingsModal(ctx);
      } else if (sceneMgr.isCodexOpen) {
        codexMgr.renderModal(ctx, LOGIC_WIDTH, LOGIC_HEIGHT, animId || 0);
      }

      // 4.5 Render Fade Transition Mờ Dần
      sceneMgr.renderFade(ctx, LOGIC_WIDTH, LOGIC_HEIGHT);

      // 4.6 Bảng đo thông số hiệu năng Debug F2 (Yêu cầu 11)
      if (GameRenderer.debugMode) {
        ctx.save();
        ctx.fillStyle = 'rgba(22, 20, 38, 0.88)';
        ctx.fillRect(270, 4, 206, 92);
        ctx.strokeStyle = '#f7af34';
        ctx.lineWidth = 1;
        ctx.strokeRect(270.5, 4.5, 205, 91);

        ctx.font = 'bold 9px "Pixelify Sans", monospace';
        ctx.fillStyle = '#fedb5b';
        ctx.fillText('--- CHẾ ĐỘ DEBUG (PHÍM F2) ---'.normalize('NFC'), 276, 16);

        const particleCount = ParticleSystem.getInstance().activeParticleCount;
        const fps = GameRenderer.currentFps;
        const frameTime = GameRenderer.currentFrameTime;
        const fpsColor = fps >= 45 ? '#77e0b5' : '#bf363b';

        ctx.font = '8px monospace';
        ctx.fillStyle = fpsColor;
        ctx.fillText(`FPS: ${fps} | Frame: ${frameTime.toFixed(1)}ms`, 276, 28);

        ctx.fillStyle = '#f7edd7';
        ctx.fillText(`Hạt Particle: ${particleCount} / 300 (Pool)`, 276, 38);
        ctx.fillText(`Hậu kỳ Bloom: ${GameRenderer.isBloomActive ? 'BẬT' : 'TẮT (<45 FPS / A11y)'}`, 276, 48);
        ctx.fillText(`Cảnh: ${sceneMgr.currentScene} | Cấp: ${sceneMgr.currentLevelId}`, 276, 58);
        ctx.fillStyle = '#40bfa3';
        ctx.fillText(`Độ phân giải: 480x270 (16:9 Retro)`, 276, 68);
        ctx.fillStyle = '#e88827';
        ctx.fillText(`A11y: Giảm hiệu ứng=${a11y.settings.reduceMotion ? 'BẬT' : 'TẮT'}`, 276, 78);
        ctx.fillText(`Thời tiết: ${a11y.settings.weatherEffects ? 'BẬT' : 'TẮT'}`, 276, 88);
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // ============================================================================
  // HÀM VẼ MÀN HÌNH NẠP GAME (LOADING SCREEN) RETRO PIXEL
  // ============================================================================
  const renderLoadingScreen = (
    ctx: CanvasRenderingContext2D,
    progress: number,
    message: string,
    tick: number
  ) => {
    // 1. Bầu trời đêm Cố Đô tím than
    const grad = ctx.createLinearGradient(0, 0, 0, LOGIC_HEIGHT);
    grad.addColorStop(0, '#0f0d1b');
    grad.addColorStop(0.6, '#20152b');
    grad.addColorStop(1, '#3b1d36');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // 2. Những hạt hoa đăng lấp lánh nhẹ
    for (let i = 0; i < 16; i++) {
      const sx = (i * 37 + (tick * 0.3)) % LOGIC_WIDTH;
      const sy = (i * 23 + Math.sin((tick + i * 15) / 10) * 8) % (LOGIC_HEIGHT - 60);
      const twinkle = Math.sin((tick + i * 8) / 8);
      if (twinkle > 0) {
        ctx.fillStyle = twinkle > 0.5 ? '#fedb5b' : 'rgba(247, 175, 52, 0.4)';
        ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
      }
    }

    // 3. Khung 9-slice chính giữa
    const panel = get9SliceCanvas();
    const bx = 60;
    const by = 48;
    const bw = 360;
    const bh = 174;
    draw9Slice(ctx, panel, bx, by, bw, bh, 8);

    // Tiêu đề game hoàng gia Cố Đô
    drawPixelTextWithShadow(ctx, 'TẦM PHỤC KÝ', LOGIC_WIDTH / 2, by + 16, {
      font: 'bold 22px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
      align: 'center',
    });

    drawPixelTextWithShadow(ctx, 'VIỆT PHỤC REMIX • CỐ ĐÔ HUẾ', LOGIC_WIDTH / 2, by + 44, {
      font: 'bold 11px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#161426',
      align: 'center',
    });

    // Biểu tượng cuộn chỉ xoay nhẹ phong cách pixel
    const iconX = LOGIC_WIDTH / 2;
    const iconY = by + 76;
    const spoolBob = Math.sin(tick / 6) * 3;
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(iconX - 10, iconY - 6 + spoolBob, 20, 12);
    ctx.fillStyle = '#ba5e1b';
    ctx.fillRect(iconX - 7, iconY - 4 + spoolBob, 14, 8);
    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(iconX - 4, iconY - 2 + spoolBob, 8, 4);

    // 4. Thanh Tiến Trình (Progress Bar)
    const barX = bx + 36;
    const barY = by + 104;
    const barW = bw - 72;
    const barH = 14;

    // Viền ngoài thanh nạp
    ctx.fillStyle = '#0f0d1b';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#fedb5b';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

    // Phần trăm đã nạp
    const fillWidth = Math.max(0, Math.min(barW - 2, Math.floor(((barW - 2) * progress) / 100)));
    if (fillWidth > 0) {
      const barGrad = ctx.createLinearGradient(barX + 1, barY + 1, barX + 1 + fillWidth, barY + 1);
      barGrad.addColorStop(0, '#40bfa3');
      barGrad.addColorStop(1, '#fedb5b');
      ctx.fillStyle = barGrad;
      ctx.fillRect(barX + 1, barY + 1, fillWidth, barH - 2);

      // Vạch highlight sáng phía trên thanh
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(barX + 1, barY + 1, fillWidth, 2);
    }

    // Hiển thị số phần trăm
    drawPixelTextWithShadow(ctx, `${Math.round(progress)}%`, LOGIC_WIDTH / 2, barY + 2, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: '#161426',
      shadowColor: 'transparent',
      align: 'center',
    });

    // 5. Dòng thông điệp trạng thái nạp
    drawPixelTextWithShadow(ctx, message, LOGIC_WIDTH / 2, by + 128, {
      font: '10px "Pixelify Sans", monospace',
      textColor: '#f7edd7',
      shadowColor: '#161426',
      align: 'center',
    });

    // Chỉ dẫn chân trang
    drawPixelTextWithShadow(ctx, 'Hành trình gìn giữ di sản cổ phục Việt Nam', LOGIC_WIDTH / 2, by + 148, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#a38f7e',
      shadowColor: '#161426',
      align: 'center',
    });
  };

  // ============================================================================
  // VẼ MENU TẠM DỪNG (PAUSE MENU) BẰNG KHUNG 9-SLICE
  // ============================================================================
  const renderPauseMenu = (ctx: CanvasRenderingContext2D) => {
    // 1. Lớp phủ tối mờ màn hình game đang chạy
    ctx.fillStyle = 'rgba(15, 13, 27, 0.85)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // 2. Khung 9-slice chính giữa
    const panel = get9SliceCanvas();
    const px = 50;
    const py = 12;
    const pw = 380;
    const ph = 246;
    draw9Slice(ctx, panel, px, py, pw, ph, 8);

    // Tiêu đề
    drawPixelTextWithShadow(ctx, '⏸ TẠM DỪNG (PAUSED)', LOGIC_WIDTH / 2, py + 6, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
    });

    // 2 Nút hành động chính
    drawCanvasButton(ctx, px + 15, py + 30, 165, 24, '1. TIẾP TỤC (RESUME)', pauseMenuIndex === 0, '▶');
    drawCanvasButton(ctx, px + 200, py + 30, 165, 24, '2. THOÁT VỀ BẢN ĐỒ', pauseMenuIndex === 1, '🗺');

    // Đường kẻ phân cách
    ctx.strokeStyle = '#5a3d28';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 62);
    ctx.lineTo(px + pw - 15, py + 62);
    ctx.stroke();

    // Tiêu đề mục cài đặt
    drawPixelTextWithShadow(ctx, 'CÀI ĐẶT & TRỢ NĂNG (ACCESSIBILITY):', px + 16, py + 66, {
      font: 'bold 11px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
    });

    const settingsRows = [
      {
        id: 'sound',
        label: `3. Âm thanh tổng: ${audio.isMuted() ? 'ĐANG TẮT (MUTE)' : `BẬT (${Math.round(a11y.settings.volume)}%)`}`,
        hint: '◄ Giảm | Tăng ►',
        active: !audio.isMuted(),
      },
      {
        id: 'music',
        label: `4. Nhạc nền (BGM ngũ cung): ${audio.isMusicMuted() ? 'TẮT' : 'BẬT'}`,
        hint: 'Nhấn để đổi',
        active: !audio.isMusicMuted(),
      },
      {
        id: 'reduceMotion',
        label: `5. Giảm chuyển động (Reduce Motion): ${a11y.settings.reduceMotion ? 'BẬT' : 'TẮT'}`,
        hint: 'Nhấn để đổi',
        active: a11y.settings.reduceMotion,
      },
      {
        id: 'highContrast',
        label: `6. Tương phản cao (High Contrast): ${a11y.settings.highContrast ? 'BẬT' : 'TẮT'}`,
        hint: 'Nhấn để đổi',
        active: a11y.settings.highContrast,
      },
      {
        id: 'difficulty',
        label: `7. Độ khó trận chiến: ${a11y.settings.difficulty === 'de' ? 'DỄ (Hồi máu, boss chậm)' : 'THƯỜNG'}`,
        hint: 'Nhấn để đổi',
        active: a11y.settings.difficulty === 'de',
      },
      {
        id: 'weatherEffects',
        label: `8. Hiệu ứng thời tiết (Mưa Huế/Cánh hoa): ${a11y.settings.weatherEffects ? 'BẬT' : 'TẮT'}`,
        hint: '◄ / ► để đổi',
        active: a11y.settings.weatherEffects,
      },
      {
        id: 'reset',
        label: `9. ↺ Chơi lại từ đầu (Reset toàn bộ tiến trình)`,
        hint: 'Enter để xóa',
        active: false,
      },
    ];

    settingsRows.forEach((row, idx) => {
      const menuIdx = idx + 2;
      const isSelected = pauseMenuIndex === menuIdx;
      const rowY = py + 78 + idx * 23;

      if (isSelected) {
        ctx.fillStyle = 'rgba(254, 219, 91, 0.2)';
        ctx.fillRect(px + 12, rowY - 2, pw - 24, 20);
        ctx.strokeStyle = '#fedb5b';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 12.5, rowY - 1.5, pw - 25, 19);
      }

      drawPixelTextWithShadow(ctx, `${isSelected ? '► ' : '  '}${row.label}`, px + 16, rowY + 2, {
        font: '10px "Pixelify Sans", monospace',
        textColor: isSelected ? '#fedb5b' : row.active ? '#f7edd7' : '#9c8c7c',
        shadowColor: '#05040a',
      });

      drawPixelTextWithShadow(ctx, row.hint, px + pw - 20, rowY + 2, {
        font: '9px "Pixelify Sans", monospace',
        textColor: isSelected ? '#40bfa3' : '#6b5e52',
        shadowColor: '#05040a',
        align: 'right',
      });
    });

    // Chỉ dẫn phím ở đáy bảng
    drawPixelTextWithShadow(ctx, '[W/S/▲/▼]: Chọn  |  [Enter/Space/J]: Xác nhận  |  [P/ESC]: Tiếp tục', LOGIC_WIDTH / 2, py + ph - 16, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
    });
  };

  // ============================================================================
  // CÁC HÀM VẼ CẢNH CHÍNH (TITLE, MAP, RAP_AO, REMIX, MODALS)
  // ============================================================================
  const renderTitleScene = (ctx: CanvasRenderingContext2D) => {
    const tick = Math.floor(Date.now() / 16);

    // 1. Nền chuyển sắc hoàng hôn tím Cố Đô Huế cao cấp (Dạ Lam -> Tím Cung Đình -> Đỏ Rượu -> Cam Hổ Phách)
    const sky = ctx.createLinearGradient(0, 0, 0, LOGIC_HEIGHT);
    sky.addColorStop(0, '#0c0e1e');
    sky.addColorStop(0.35, '#24102d');
    sky.addColorStop(0.65, '#52162a');
    sky.addColorStop(0.88, '#9c3f1a');
    sky.addColorStop(1, '#e88827');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // 2. Những vì sao lấp lánh và sao băng
    const stars = [
      [24, 18], [68, 28], [112, 14], [165, 32], [220, 20], [290, 16],
      [340, 30], [440, 22], [460, 42], [90, 45], [260, 38],
    ];
    stars.forEach(([sx, sy], idx) => {
      const twinkle = Math.sin((tick + idx * 15) / 8);
      if (twinkle > 0) {
        ctx.fillStyle = twinkle > 0.6 ? '#ffffff' : 'rgba(254, 219, 91, 0.75)';
        ctx.fillRect(sx, sy, 1, 1);
        if (twinkle > 0.85) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(sx - 1, sy, 3, 1);
          ctx.fillRect(sx, sy - 1, 1, 3);
        }
      }
    });

    // 3. Vầng trăng rằm Cố Đô với quầng hào quang đa tầng lung linh
    const moonX = 385;
    const moonY = 52;
    // Hào quang vàng nhạt xa
    ctx.fillStyle = 'rgba(254, 219, 91, 0.05)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
    ctx.fill();
    // Hào quang gần
    ctx.fillStyle = 'rgba(254, 219, 91, 0.16)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
    ctx.fill();
    // Thân trăng vàng ngọc
    ctx.fillStyle = '#fff4a3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 17, 0, Math.PI * 2);
    ctx.fill();
    // Vết lồi lõm pixel mặt trăng cổ
    ctx.fillStyle = '#eed77e';
    ctx.fillRect(moonX - 7, moonY - 5, 5, 4);
    ctx.fillRect(moonX + 2, moonY + 3, 4, 3);
    ctx.fillRect(moonX - 3, moonY + 7, 3, 3);

    // Mây hoàng cung lướt ngang vầng trăng
    const cloudShift = (tick * 0.12) % (LOGIC_WIDTH + 80);
    ctx.fillStyle = 'rgba(84, 25, 36, 0.45)';
    ctx.fillRect((LOGIC_WIDTH - cloudShift + 320) % (LOGIC_WIDTH + 80) - 40, moonY + 4, 45, 3);
    ctx.fillRect((LOGIC_WIDTH - cloudShift + 300) % (LOGIC_WIDTH + 80) - 40, moonY + 8, 70, 4);

    // 4. Dãy núi Ngự Bình mờ ảo nhiều tầng chiều sâu
    // Tầng núi xa (Tím xám nhạt)
    ctx.fillStyle = '#1c1328';
    ctx.beginPath();
    ctx.moveTo(0, 185);
    ctx.lineTo(60, 150);
    ctx.lineTo(130, 168);
    ctx.lineTo(210, 138);
    ctx.lineTo(320, 172);
    ctx.lineTo(410, 145);
    ctx.lineTo(480, 160);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.fill();

    // Tầng núi gần (Tím thẫm chân thành)
    ctx.fillStyle = '#140c1d';
    ctx.beginPath();
    ctx.moveTo(0, 195);
    ctx.lineTo(95, 160);
    ctx.lineTo(180, 182);
    ctx.lineTo(270, 152);
    ctx.lineTo(370, 188);
    ctx.lineTo(480, 168);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.fill();

    // 5. Mặt nước Sông Hương đêm thơ mộng
    ctx.fillStyle = '#0f172b';
    ctx.fillRect(0, 202, LOGIC_WIDTH, 68);

    // Dải ánh trăng dát vàng lấp lánh trải dài trên sông Hương
    for (let i = 0; i < 9; i++) {
      const sw = (tick + i * 8) / 6;
      const shimmerX = moonX - 20 + Math.sin(sw) * (i * 2 + 3);
      const rowW = 20 + i * 11;
      ctx.fillStyle = 'rgba(254, 219, 91, 0.35)';
      ctx.fillRect(shimmerX - rowW / 2, 206 + i * 7, rowW, 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(shimmerX - 2, 206 + i * 7, 5, 1);
    }

    // Hoa đăng sen thả trôi trên mặt nước
    for (let l = 0; l < 5; l++) {
      const lx = (LOGIC_WIDTH - ((tick * 0.25 + l * 95) % (LOGIC_WIDTH + 30)));
      const ly = 215 + l * 9;
      ctx.fillStyle = '#d96499';
      ctx.fillRect(lx - 3, ly, 6, 2);
      ctx.fillStyle = '#f29ec0';
      ctx.fillRect(lx - 2, ly - 1, 4, 1);
      const candle = (tick + l * 4) % 4 > 1 ? 1 : 0;
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(lx - 1, ly - 3 - candle, 2, 2);
    }

    // 6. Tiêu đề game lớn với bóng râm hoàng cung & viền vàng
    const titleY = 24;
    // Hào quang vàng phía sau tiêu đề
    ctx.save();
    ctx.fillStyle = 'rgba(254, 219, 91, 0.08)';
    ctx.beginPath();
    ctx.ellipse(LOGIC_WIDTH / 2, titleY + 16, 120, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawPixelTextWithShadow(ctx, 'TẦM PHỤC KÝ', LOGIC_WIDTH / 2, titleY, {
      font: 'bold 28px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0a0612',
      align: 'center',
    });

    drawPixelTextWithShadow(ctx, '✦ VIỆT PHỤC REMIX • HÀNH TRÌNH CỐ ĐÔ HUẾ ✦', LOGIC_WIDTH / 2, 57, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#0a0612',
      align: 'center',
    });

    // 7. Khung danh sách chọn
    const panel = get9SliceCanvas();
    const mx = 135;
    const my = 80;
    const mw = 210;
    const mh = 168;
    draw9Slice(ctx, panel, mx, my, mw, mh, 6);

    titleMenuItems.forEach((item, idx) => {
      const isSel = idx === titleSelectedIndex;
      const iy = my + 14 + idx * 24;

      if (isSel) {
        ctx.fillStyle = 'rgba(254, 219, 91, 0.28)';
        ctx.fillRect(mx + 8, iy - 2, mw - 16, 20);
        ctx.strokeStyle = '#fedb5b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(mx + 8.5, iy - 1.5, mw - 17, 19);
      }

      drawPixelTextWithShadow(ctx, `${isSel ? '► ' : '  '}${item.label}`, mx + 14, iy + 2, {
        font: 'bold 10.5px "Pixelify Sans", monospace',
        textColor: isSel ? '#fedb5b' : '#f7edd7',
        shadowColor: '#0f0d1b',
      });
    });

    // Chỉ dẫn thao tác
    drawPixelTextWithShadow(ctx, '[W/S/▲/▼] Chọn  •  [Enter/J] Bắt đầu  •  [P/ESC] Tạm dừng', LOGIC_WIDTH / 2, 254, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#c7aa8d',
      shadowColor: '#0f0d1b',
      align: 'center',
    });
  };

  const renderChapterMapScene = (ctx: CanvasRenderingContext2D) => {
    const tick = Math.floor(Date.now() / 16);

    // 1. Nền bản đồ Cố Đô phong cách lụa hoàng gia và giấy điệp Cung Đình
    ctx.fillStyle = '#140d1e';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // Mảng bản đồ trung tâm giấy điệp cổ
    const mapGrad = ctx.createRadialGradient(240, 135, 40, 240, 135, 230);
    mapGrad.addColorStop(0, '#241433');
    mapGrad.addColorStop(0.75, '#190e24');
    mapGrad.addColorStop(1, '#100918');
    ctx.fillStyle = mapGrad;
    ctx.fillRect(10, 28, LOGIC_WIDTH - 20, 234);

    // Dòng sông Hương uốn lượn phong thủy màu lam ngọc cổ kính
    ctx.save();
    ctx.strokeStyle = 'rgba(42, 75, 115, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(30, 175);
    ctx.bezierCurveTo(120, 195, 180, 115, 260, 125);
    ctx.bezierCurveTo(340, 135, 380, 175, 450, 155);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(64, 191, 163, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, 175);
    ctx.bezierCurveTo(120, 195, 180, 115, 260, 125);
    ctx.bezierCurveTo(340, 135, 380, 175, 450, 155);
    ctx.stroke();
    ctx.restore();

    // Tiêu đề bản đồ
    drawPixelTextWithShadow(ctx, '✦ BẢN ĐỒ CỐ ĐÔ HUẾ - CHƯƠNG 1: ÁO NGŨ THÂN ✦', LOGIC_WIDTH / 2, 12, {
      font: 'bold 12.5px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0a0612',
      align: 'center',
    });

    // Nút điều hướng
    drawCanvasButton(ctx, 8, 6, 64, 20, 'QUAY LẠI', false, '◀');

    // Nối các chặng bằng sợi chỉ vàng kim hoàng gia
    ctx.strokeStyle = '#ba5e1b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    chapterStages.forEach((stg, idx) => {
      if (idx === 0) ctx.moveTo(stg.x, stg.y);
      else ctx.lineTo(stg.x, stg.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Vẽ các nút màn chơi với hiệu ứng hào quang lấp lánh
    chapterStages.forEach((stg, idx) => {
      const isSel = idx === mapSelectedIndex;
      const isUnlocked = sceneMgr.unlockedStages.includes(stg.id);

      // Vòng hào quang xung quanh chặng đang chọn
      if (isSel) {
        const pulse = (Math.sin(tick * 0.15) + 1) / 2;
        ctx.fillStyle = `rgba(254, 219, 91, ${0.2 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(stg.x, stg.y, 14 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fedb5b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Điểm mốc
      ctx.fillStyle = isSel ? '#fedb5b' : isUnlocked ? '#77e0b5' : '#4a3328';
      ctx.beginPath();
      ctx.arc(stg.x, stg.y, isSel ? 9 : 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f0d1b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tâm điểm sáng
      ctx.fillStyle = isSel ? '#ffffff' : isUnlocked ? '#268c7e' : '#261b2d';
      ctx.beginPath();
      ctx.arc(stg.x, stg.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Tên địa danh
      drawPixelTextWithShadow(ctx, stg.name, stg.x, stg.y + 11, {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: isSel ? '#fedb5b' : isUnlocked ? '#f7edd7' : '#7a6a5d',
        shadowColor: '#0f0d1b',
        align: 'center',
      });
    });

    // Khung mô tả chi tiết chặng được chọn
    const selStage = chapterStages[mapSelectedIndex];
    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 70, 192, 340, 68, 6);

    drawPixelTextWithShadow(ctx, `CHẶNG: ${selStage.name.toUpperCase()}`, 86, 201, {
      font: 'bold 11px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
    });
    drawPixelTextWithShadow(ctx, `Mục tiêu cổ phục: ${selStage.desc}`, 86, 217, {
      font: '10px "Pixelify Sans", monospace',
      textColor: '#f7edd7',
      shadowColor: '#0f0d1b',
    });
    drawPixelTextWithShadow(ctx, '[A/D/◄/►] Chuyển chặng  •  [Enter/J] Vào màn chơi', LOGIC_WIDTH / 2, 241, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#0f0d1b',
      align: 'center',
    });
  };

  const renderRapAoScene = (ctx: CanvasRenderingContext2D) => {
    const tick = Math.floor(Date.now() / 16);
    ctx.fillStyle = '#161224';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // Tiêu đề trên cùng
    drawPixelTextWithShadow(ctx, 'MÀN RÁP ÁO NGŨ THÂN LẬP LĨNH', LOGIC_WIDTH / 2, 10, {
      font: 'bold 12px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
      align: 'center',
    });

    drawCanvasButton(ctx, 8, 4, 60, 20, 'QUAY LẠI', false, '◀');

    const rap = rapAoRef.current;
    if (rap.isCompleted) {
      drawCanvasButton(ctx, 296, 4, 176, 20, 'TIẾP TỤC: PHỐI ĐỒ REMIX', true, '▶');
    } else {
      drawCanvasButton(ctx, 362, 4, 110, 20, 'HỎI NGHỆ NHÂN (T)', false, '💬');
    }

    const panel = get9SliceCanvas();

    // ẢNH C - 1: DANH SÁCH BỐN MẢNH BÊN TRÁI (x: 8..152, y: 26..188)
    draw9Slice(ctx, panel, 8, 26, 144, 162, 6);
    drawPixelTextWithShadow(ctx, '4 MẢNH GHÉP:', 16, 32, {
      font: 'bold 9.5px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
    });

    rap.parts.forEach((p, idx) => {
      const isSelected = rap.selectedPartId === p.id;
      const isPlaced = p.assignedSlotId !== null;
      const isBouncing = rap.bouncingPartId === p.id && rap.bounceTimer > 0;
      const bounceOffset = isBouncing ? Math.sin(rap.bounceTimer * 1.5) * 4 : 0;
      const py = 46 + idx * 34;

      ctx.save();
      ctx.translate(bounceOffset, 0);

      ctx.fillStyle = isSelected
        ? 'rgba(254, 219, 91, 0.3)'
        : isPlaced
        ? 'rgba(64, 191, 163, 0.2)'
        : isBouncing
        ? 'rgba(191, 54, 59, 0.35)'
        : 'rgba(22, 20, 38, 0.7)';
      ctx.fillRect(14, py, 132, 30);
      ctx.strokeStyle = isSelected ? '#fedb5b' : isPlaced ? '#40bfa3' : isBouncing ? '#bf363b' : '#5a3d28';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.strokeRect(14.5, py + 0.5, 131, 29);

      // Icon màu đại diện mảnh ghép
      ctx.fillStyle = p.iconColor;
      ctx.fillRect(18, py + 7, 14, 16);
      ctx.strokeStyle = '#fedb5b';
      ctx.strokeRect(18.5, py + 7.5, 13, 15);

      // Tên mảnh ghép: dùng fitText và wrapText chống tràn (cho chữ "3. Hàng Khuy Ngũ Thường")
      const titleText = isPlaced ? `✓ ${p.name}` : `${idx + 1}. ${p.name}`;
      const { font: pFont } = fitText(ctx, titleText, 102, 8, 8, '"Pixelify Sans", monospace', 'bold');
      const titleLines = wrapText(ctx, titleText, 102, 2);

      if (titleLines.length > 1) {
        drawPixelTextWithShadow(ctx, titleLines[0], 36, py + 3, {
          font: pFont,
          textColor: isPlaced ? '#77e0b5' : isSelected ? '#fedb5b' : '#f7edd7',
        });
        drawPixelTextWithShadow(ctx, titleLines[1], 36, py + 12, {
          font: pFont,
          textColor: isPlaced ? '#77e0b5' : isSelected ? '#fedb5b' : '#f7edd7',
        });
        drawPixelTextWithShadow(ctx, isPlaced ? 'Đã khớp' : isSelected ? '▶ Đang chọn' : 'Chưa ráp', 36, py + 21, {
          font: '7px "Pixelify Sans", monospace',
          textColor: isPlaced ? '#40bfa3' : isSelected ? '#fedb5b' : '#a38f7e',
        });
      } else {
        drawPixelTextWithShadow(ctx, titleText, 36, py + 5, {
          font: pFont,
          textColor: isPlaced ? '#77e0b5' : isSelected ? '#fedb5b' : '#f7edd7',
        });
        drawPixelTextWithShadow(ctx, isPlaced ? 'Đã khớp vào áo' : isSelected ? '▶ Đang chọn' : 'Chưa ráp', 36, py + 16, {
          font: '7.5px "Pixelify Sans", monospace',
          textColor: isPlaced ? '#40bfa3' : isSelected ? '#fedb5b' : '#a38f7e',
        });
      }
      ctx.restore();
    });

    // ẢNH C - 2: HÌNH CHIẾC ÁO NGŨ THÂN Ở GIỮA ĐẶT TRÊN GIÁ (x: 156..472, y: 26..188)
    draw9Slice(ctx, panel, 156, 26, 316, 162, 6);

    ctx.save();
    // 1. Giá treo áo gỗ cổ kính (Mannequin hanger rack)
    ctx.fillStyle = '#42281a';
    ctx.fillRect(314 - 10, 31, 20, 8); // Móc gỗ đầu giá
    ctx.fillStyle = '#6b432a';
    ctx.fillRect(314 - 44, 35, 88, 4); // Cầu vai gỗ đỡ áo
    ctx.fillStyle = '#301d13';
    ctx.fillRect(314 - 3, 39, 6, 126); // Trụ đứng giá treo

    // 2. Thân áo ngũ thân màu vải tím sẫm cung đình (#4a1e38), viền 1px sáng (#c49ab5)
    ctx.fillStyle = '#4a1e38';
    ctx.beginPath();
    ctx.moveTo(314 - 36, 40);
    ctx.lineTo(314 - 85, 66);
    ctx.lineTo(314 - 105, 152);
    ctx.lineTo(314 - 82, 152);
    ctx.lineTo(314 - 65, 84);
    ctx.lineTo(314 - 58, 164);
    ctx.lineTo(314 + 58, 164);
    ctx.lineTo(314 + 65, 84);
    ctx.lineTo(314 + 82, 152);
    ctx.lineTo(314 + 105, 152);
    ctx.lineTo(314 + 85, 66);
    ctx.lineTo(314 + 36, 40);
    ctx.closePath();
    ctx.fill();

    // Viền 1px sáng rõ rệt quanh toàn bộ chiếc áo
    ctx.strokeStyle = '#c49ab5';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Đường sống áo thẳng tắp ở chính giữa (đặc trưng Ngũ Thân)
    ctx.strokeStyle = '#6b3353';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(314, 48);
    ctx.lineTo(314, 164);
    ctx.stroke();

    // Vạt cả đè vạt con, lượn cong cài sang sườn phải
    ctx.strokeStyle = '#e0b8d2';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(314 + 10, 44);
    ctx.quadraticCurveTo(314 + 40, 56, 314 + 32, 164);
    ctx.stroke();
    ctx.restore();

    // BỐN VÙNG VIỀN NÉT ĐỨT (thân áo, cổ đứng, hàng khuy, tay chẽn) & NHÃN TÊN BỘ PHẬN Ở MỖI VÙNG
    rap.slots.forEach((s) => {
      const isFilled = s.placedPartId !== null;
      const isHighlighted = rap.highlightSlotId === s.id && rap.highlightTimer > 0;
      const pulse = isHighlighted ? (Math.sin(tick * 0.15) + 1) / 2 : 0;

      ctx.save();
      if (isFilled) {
        // Đặt đúng: hiện rõ bộ phận tương ứng trên áo (không chỉ đổi chữ)
        if (s.expectedPartId === 'part_nguthan_than') {
          ctx.fillStyle = 'rgba(102, 36, 78, 0.88)';
          ctx.fillRect(s.x, s.y, s.width, s.height);
          // Hoa văn gấm và sống áo
          ctx.strokeStyle = '#fedb5b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x + s.width / 2, s.y);
          ctx.lineTo(s.x + s.width / 2, s.y + s.height);
          ctx.stroke();
        } else if (s.expectedPartId === 'part_nguthan_co') {
          ctx.fillStyle = '#61214a';
          ctx.fillRect(s.x, s.y, s.width, s.height);
          // Nẹp viền cổ vàng kim và lót trắng
          ctx.strokeStyle = '#fedb5b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(s.x + 1, s.y + 1, s.width - 2, s.height - 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(s.x + 3, s.y + 3, s.width - 6, 2);
        } else if (s.expectedPartId === 'part_nguthan_khuy') {
          ctx.fillStyle = 'rgba(74, 30, 56, 0.7)';
          ctx.fillRect(s.x, s.y, s.width, s.height);
          // 5 hạt khuy tròn bằng đồng vàng
          for (let k = 0; k < 5; k++) {
            const ky = s.y + 3 + k * 8;
            ctx.fillStyle = '#fedb5b';
            ctx.beginPath();
            ctx.arc(s.x + s.width / 2, ky, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#a86c1d';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else {
          // Tay chẽn
          ctx.fillStyle = 'rgba(92, 33, 70, 0.85)';
          ctx.fillRect(s.x, s.y, s.width, s.height);
          ctx.strokeStyle = '#c49ab5';
          ctx.lineWidth = 1;
          ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.width - 1, s.height - 1);
        }

        ctx.strokeStyle = '#77e0b5';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.width - 1, s.height - 1);

        drawPixelTextWithShadow(ctx, `✓ ${s.name.toUpperCase()}`, s.x + s.width / 2, s.y + s.height / 2 - 4, {
          font: 'bold 8px "Pixelify Sans", monospace',
          textColor: '#ffffff',
          shadowColor: '#161426',
          align: 'center',
        });
      } else {
        // Vùng nét đứt khi chưa đặt
        ctx.setLineDash([3, 3]);
        if (isHighlighted) {
          // Vùng đúng nhấp sáng nhẹ khi đặt sai
          ctx.fillStyle = `rgba(254, 219, 91, ${0.2 + pulse * 0.25})`;
          ctx.fillRect(s.x, s.y, s.width, s.height);
          ctx.strokeStyle = `rgba(254, 219, 91, ${0.7 + pulse * 0.3})`;
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = 'rgba(22, 20, 38, 0.5)';
          ctx.fillRect(s.x, s.y, s.width, s.height);
          ctx.strokeStyle = '#a38f7e';
          ctx.lineWidth = 1;
        }
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.width - 1, s.height - 1);
        ctx.setLineDash([]);

        // Nhãn tên bộ phận ở mỗi vùng
        drawPixelTextWithShadow(ctx, s.name.toUpperCase(), s.x + s.width / 2, s.y + s.height / 2 - 4, {
          font: 'bold 8px "Pixelify Sans", monospace',
          textColor: isHighlighted ? '#fedb5b' : '#f7edd7',
          shadowColor: '#161426',
          align: 'center',
        });

        if (isHighlighted) {
          // Nhãn VỊ TRÍ ĐÚNG nằm cạnh vùng đúng (ở phía trong khung áo), không đè lên tiêu đề màn
          let labelX = s.x + s.width / 2;
          let labelY = s.y + s.height + 4;
          if (s.id === 'slot_khuy') {
            labelX = s.x + s.width + 24;
            labelY = s.y + s.height / 2 - 4;
          } else if (s.id === 'slot_than') {
            labelX = s.x + s.width / 2;
            labelY = s.y + s.height - 12;
          }
          drawPixelTextWithShadow(ctx, '👈 VỊ TRÍ ĐÚNG', labelX, labelY, {
            font: 'bold 7.5px "Pixelify Sans", monospace',
            textColor: '#fedb5b',
            shadowColor: '#161426',
            align: 'center',
          });
        }
      }
      ctx.restore();
    });

    // ẢNH C - 3: BẢNG NGHỆ NHÂN PHÍA DƯỚI (x: 8..472, y: 192..264)
    // Toàn bộ khu vực áo, bốn mảnh và bảng giải thích phải hiện cùng lúc trong một khung hình
    draw9Slice(ctx, panel, 8, 192, 464, 72, 6);

    // Tiêu đề bảng nghệ nhân
    drawPixelTextWithShadow(ctx, 'NGHỆ NHÂN MAY ĐO (ÁO DÀI XỨ HUẾ):', 18, 198, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
    });

    const cleanFeedback = (rap.artisanFeedback || '').normalize('NFC');
    const [mainFeedback, recallPart] = cleanFeedback.split('\nNhớ lại: ');
    const mainLines = wrapText(ctx, mainFeedback, 440, recallPart ? 2 : 3);

    let fbY = 212;
    for (const l of mainLines) {
      drawPixelTextWithShadow(ctx, l, 18, fbY, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
        shadowColor: '#161426',
      });
      fbY += 11;
    }

    if (recallPart) {
      drawPixelTextWithShadow(ctx, `Nhớ lại: ${recallPart}`, 18, fbY + 1, {
        font: 'bold 7.5px "Pixelify Sans", monospace',
        textColor: '#77e0b5',
        shadowColor: '#161426',
      });
    }
  };

  const renderRemixScene = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#1c1328';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    drawPixelTextWithShadow(ctx, 'PHÒNG THỬ ĐỒ VIỆT PHỤC REMIX', LOGIC_WIDTH / 2, 14, {
      font: 'bold 14px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
      align: 'center',
    });

    drawCanvasButton(ctx, 8, 8, 64, 22, 'QUAY LẠI', false, '◀');

    // Khung ma-nơ-canh bên trái
    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 24, 38, 146, 220, 6);
    PaperdollRenderer.drawAvatar(ctx, remixOutfit, 97, 220);

    // Bảng chọn phụ kiện và phối đồ bên phải
    draw9Slice(ctx, panel, 178, 38, 288, 220, 6);
    drawPixelTextWithShadow(ctx, 'PHỐI ĐỒ REMIX CHO SỰ KIỆN:', 190, 46, {
      font: 'bold 11px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
    });

    // 1. Chọn Sự kiện (Click để đổi)
    drawCanvasButton(ctx, 188, 62, 268, 22, `Sự kiện: ${remixEvents[selectedEventIndex].name}`, false, '📅');

    // 2. Áo chính cố định là Áo Ngũ Thân Lập Lĩnh vừa ráp
    drawCanvasButton(ctx, 188, 88, 268, 22, 'Áo: Áo Ngũ Thân Lập Lĩnh (Đã ráp)', false, '👘');

    // 3. Chọn Quần
    drawCanvasButton(ctx, 188, 114, 268, 22, `Quần: ${quanOptions[quanIndex].label}`, false, '👖');

    // 4. Chọn Đội đầu
    drawCanvasButton(ctx, 188, 140, 268, 22, `Đầu: ${headwearOptions[headwearIndex].label}`, false, '👑');

    // 5. Chọn Giày
    drawCanvasButton(ctx, 188, 166, 268, 22, `Giày: ${footwearOptions[footwearIndex].label}`, false, '👟');

    // 6. Chọn Phụ kiện
    drawCanvasButton(ctx, 188, 192, 268, 22, `Phụ kiện: ${accessoryOptions[accessoryIndex].label}`, false, '🌸');

    // 2 Nút thao tác dưới cùng
    drawCanvasButton(ctx, 188, 222, 170, 26, 'ĐÁNH GIÁ CHUẨN MỰC', true, '✨');
    drawCanvasButton(ctx, 364, 222, 92, 26, 'LOOKBOOK', false, '📖');
  };

  const renderStoryCutsceneModal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.90)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 35, 16, 410, 238, 8);

    drawPixelTextWithShadow(ctx, '🏛️ CỐT TRUYỆN: MẤT ÁO NƠI CỐ ĐÔ HUẾ', LOGIC_WIDTH / 2, 26, {
      font: 'bold 13px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
      align: 'center',
    });

    drawPixelTextWithShadow(ctx, 'Cô Hạnh (Nghệ nhân may đo Cố đô Huế) ân cần gửi gắm:', 50, 48, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#0f0d1b',
    });

    const lines = [
      '“Bóng Lãng Quên đã xé chiếc áo ngũ thân thành các mảnh',
      'và giấu ở những nơi trong Huế! Cô nhờ con tìm lại từng bộ phận',
      'để áo được mặc lại đúng cách con nhé!”',
      '',
      '*(Đây là cốt truyện hư cấu; không khẳng định mảnh nào “thật sự thuộc” địa điểm nào)*',
      '',
      'Luồng chơi: Mất áo → 4 Màn tìm mảnh → Ráp áo → Phối Remix → Chấm điểm & Lookbook',
    ];

    lines.forEach((l, idx) => {
      const isNote = l.startsWith('*');
      const isFlow = l.startsWith('Luồng chơi:');
      drawPixelTextWithShadow(ctx, l, 50, 68 + idx * 16, {
        font: isNote ? '8px "Pixelify Sans", monospace' : isFlow ? 'bold 9px "Pixelify Sans", monospace' : '10px "Pixelify Sans", monospace',
        textColor: isNote ? '#c7aa8d' : isFlow ? '#fedb5b' : '#f7edd7',
        shadowColor: '#0f0d1b',
      });
    });

    drawCanvasButton(ctx, 100, 198, 280, 28, 'BẮT ĐẦU: TÌM MẢNH 1 TẠI NGỌ MÔN', true, '▶');
  };

  const renderLookbookModal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.90)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 30, 10, 420, 250, 8);

    drawPixelTextWithShadow(ctx, '📸 KẾT QUẢ CHẤM ĐIỂM & ALBUM LOOKBOOK', LOGIC_WIDTH / 2, 18, {
      font: 'bold 13px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
      align: 'center',
    });

    const den = remixResult?.den || 'xanh';
    const badgeColor = den === 'xanh' ? '#77e0b5' : den === 'vang' ? '#fedb5b' : '#ff6b6b';
    const badgeText =
      den === 'xanh'
        ? '🟢 ĐÈN XANH: ĐẠT CHUẨN MỰC - HÒA HỢP TUYỆT HẢO'
        : den === 'vang'
        ? '🟡 ĐÈN VÀNG: CÁCH TÂN CẦN LƯU Ý BỐI CẢNH'
        : '🔴 ĐÈN ĐỎ: LỖI QUY ƯỚC NƠI TÔN NGHIÊM';

    drawPixelTextWithShadow(ctx, badgeText, LOGIC_WIDTH / 2, 38, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: badgeColor,
      align: 'center',
    });

    const hoaHop = remixResult?.diem_hoa_hop ?? 100;
    const tonTrong = remixResult?.diem_ton_trong ?? 100;
    drawPixelTextWithShadow(
      ctx,
      `Điểm Hòa Hợp: ${hoaHop}/100    |    Điểm Tôn Trọng: ${tonTrong}/100`,
      LOGIC_WIDTH / 2,
      56,
      {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
        align: 'center',
      }
    );

    const nhanXet =
      remixResult?.canh_bao?.[0]?.ly_do ||
      'Bản phối xuất sắc! Chiếc áo ngũ thân phục hồi hòa quyện duyên dáng cùng phong thái đương đại.';
    drawDialogueBox(ctx, 45, 72, 390, 48, 'Cô Hạnh Nhận Xét:', nhanXet);

    drawPixelTextWithShadow(ctx, 'ALBUM LOOKBOOK ĐÃ LƯU (TIẾN TRÌNH LOCALSTORAGE):', 45, 128, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
    });

    const savedList = sceneMgr.lookbook.slice(0, 3);
    if (savedList.length === 0) {
      drawPixelTextWithShadow(ctx, 'Chưa có bộ phối nào được lưu trong Lookbook.', 55, 146, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#a38f7e',
      });
    } else {
      savedList.forEach((entry, idx) => {
        const ey = 142 + idx * 22;
        drawCanvasButton(
          ctx,
          45,
          ey,
          390,
          18,
          `#${idx + 1} [${entry.su_kien}]: ${entry.outfit.ao} + ${entry.outfit.quan} (${entry.diem}đ)`,
          false,
          '✓'
        );
      });
    }

    // 3 Nút hành động dưới cùng
    drawCanvasButton(ctx, 45, 222, 125, 24, 'CHƠI LẠI TỪ ĐẦU', false, '↺');
    drawCanvasButton(ctx, 178, 222, 125, 24, 'THỬ PHỐI LẠI', true, '◀');
    drawCanvasButton(ctx, 310, 222, 125, 24, 'VỀ TRANG CHỦ', false, '🏠');
  };

  const renderArtisanChatModal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.75)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
    drawDialogueBox(ctx, 40, 60, 400, 150, artisanChatTitle, artisanChatText);
    drawPixelTextWithShadow(ctx, 'Bấm phím [T] hoặc [ESC] để đóng lời dặn', LOGIC_WIDTH / 2, 190, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
      align: 'center',
    });
  };

  const renderSettingsModal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.88)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 55, 8, 370, 252, 8);

    drawPixelTextWithShadow(ctx, '⚙️ CÀI ĐẶT & TRỢ NĂNG (SETTINGS)', LOGIC_WIDTH / 2, 17, {
      font: 'bold 12px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#0f0d1b',
      align: 'center',
    });

    const optList = [
      `1. Âm thanh tổng: ${audio.isMuted() ? 'ĐANG TẮT (MUTE)' : 'ĐANG BẬT'}`,
      `2. Tắt nhạc nền (BGM): ${audio.isMusicMuted() ? 'ĐÃ TẮT' : 'ĐANG BẬT'}`,
      `3. Thanh âm lượng:`,
      `4. Giảm hiệu ứng (Reduce Motion): ${a11y.settings.reduceMotion ? 'BẬT' : 'TẮT'} (Không tắt âm)`,
      `5. Hậu kỳ nhẹ (Bloom & Vignette): ${a11y.settings.postProcessingBloom ? 'BẬT' : 'TẮT'}`,
      `6. Độ tương phản cao (High Contrast): ${a11y.settings.highContrast ? 'BẬT' : 'TẮT'}`,
      `7. Độ khó: ${a11y.settings.difficulty === 'de' ? 'DỄ (Hồi máu, quái chậm)' : 'THƯỜNG'}`,
      `8. Phím ảo cảm ứng: ${a11y.settings.virtualControls ? 'BẬT' : 'TẮT'}`,
      `9. Hiệu ứng thời tiết Cố Đô: ${a11y.settings.weatherEffects ? 'BẬT' : 'TẮT'}`,
      `10. [↺] Chơi lại từ đầu (Reset toàn bộ tiến trình)`,
    ];

    optList.forEach((txt, idx) => {
      const rowY = 32 + idx * 22;
      if (idx === 2) {
        // Vẽ nút kèm thanh âm lượng trực quan (Visual Slider)
        drawCanvasButton(ctx, 75, rowY, 330, 20, '', false);
        drawPixelTextWithShadow(ctx, '3. Thanh âm lượng:', 83, rowY + 3, {
          font: 'bold 9px "Pixelify Sans", monospace',
          textColor: '#f7edd7',
        });

        // Nút Giảm ◀
        drawCanvasButton(ctx, 204, rowY + 1, 18, 17, '◀', false);

        // Thanh trượt âm lượng
        const barX = 226;
        const barY = rowY + 4;
        const barW = 88;
        const barH = 11;
        ctx.fillStyle = '#161426';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#5a3d28';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

        const currentVolRatio = a11y.settings.volume / 100;
        const fillW = Math.max(0, Math.min(barW - 2, Math.round((barW - 2) * currentVolRatio)));
        if (fillW > 0) {
          ctx.fillStyle = audio.isMuted() ? '#6b5e52' : '#fedb5b';
          ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);
        }

        // Nút Tăng ▶
        drawCanvasButton(ctx, 318, rowY + 1, 18, 17, '▶', false);

        // Hiển thị số phần trăm
        drawPixelTextWithShadow(ctx, `${Math.round(a11y.settings.volume)}%`, 342, rowY + 3, {
          font: 'bold 9px "Pixelify Sans", monospace',
          textColor: audio.isMuted() ? '#a38f7e' : '#77e0b5',
        });
      } else {
        drawCanvasButton(ctx, 75, rowY, 330, 20, txt, false);
      }
    });

    drawPixelTextWithShadow(ctx, 'Nhấn [1-9] hoặc Click để đổi  •  [◄/►] Chỉnh âm lượng  •  [ESC] Đóng', LOGIC_WIDTH / 2, 236, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#77e0b5',
      shadowColor: '#0f0d1b',
      align: 'center',
    });
  };

  // ============================================================================
  // XỬ LÝ CHUỘT / CẢM ỨNG TRÊN CANVAS
  // ============================================================================
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    audio.unlock();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.floor((e.clientX - rect.left) / scale);
    const clickY = Math.floor((e.clientY - rect.top) / scale);
    handleLogicClick(clickX, clickY);
  };

  const handleLogicClick = (clickX: number, clickY: number) => {
    audio.unlock();
    // 0. BÁCH KHOA CỔ PHỤC
    if (sceneMgr.isCodexOpen) {
      if (codexMgr.isPixelArtViewerOpen) {
        codexMgr.isPixelArtViewerOpen = false;
        audio.playAttackSwing();
        return;
      }
      if (clickX < 16 || clickX > 464 || clickY < 8 || clickY > 262) {
        sceneMgr.isCodexOpen = false;
        audio.playItemCollect();
        return;
      }
      if (clickX >= 24 && clickX <= 144 && clickY >= 44 && clickY <= 248) {
        const itemIdx = Math.floor((clickY - 44) / 33);
        if (itemIdx >= 0 && itemIdx < CLOTHING_CODEX_DATA.length) {
          codexMgr.selectedIndex = itemIdx;
          codexMgr.scrollOffset = 0;
          audio.playAttackSwing();
          return;
        }
      }
      if (clickX >= 152 && clickX <= 230 && clickY >= 170 && clickY <= 198) {
        codexMgr.isPixelArtViewerOpen = true;
        audio.playSpecialSkill();
        return;
      }
      return;
    }

    // 0. MODAL CỐT TRUYỆN MẤT ÁO (CÔ HẠNH)
    if (sceneMgr.isStoryCutsceneOpen) {
      if (clickX >= 100 && clickX <= 380 && clickY >= 195 && clickY <= 230) {
        sceneMgr.isStoryCutsceneOpen = false;
        sceneMgr.changeScene('LEVEL', 'c1_m1');
        audio.startAmbientBGM();
        audio.playItemCollect();
      } else if (clickX < 35 || clickX > 445 || clickY < 16 || clickY > 254) {
        sceneMgr.isStoryCutsceneOpen = false;
        audio.playItemCollect();
      }
      return;
    }

    // 0.1 MODAL LOOKBOOK & KẾT QUẢ
    if (isLookbookModalOpen) {
      // Nút 1: Chơi lại từ đầu
      if (clickX >= 45 && clickX <= 170 && clickY >= 218 && clickY <= 248) {
        sceneMgr.resetProgress();
        setRemixResult(null);
        setIsLookbookModalOpen(false);
        audio.playFragmentUnlock();
        setA11yVersion((v) => v + 1);
        return;
      }
      // Nút 2: Thử phối lại
      if (clickX >= 178 && clickX <= 303 && clickY >= 218 && clickY <= 248) {
        setIsLookbookModalOpen(false);
        audio.playItemCollect();
        return;
      }
      // Nút 3: Về trang chủ
      if (clickX >= 310 && clickX <= 435 && clickY >= 218 && clickY <= 248) {
        setIsLookbookModalOpen(false);
        sceneMgr.changeScene('TITLE');
        audio.playItemCollect();
        return;
      }
      if (clickX < 30 || clickX > 450 || clickY < 10 || clickY > 260) {
        setIsLookbookModalOpen(false);
        audio.playItemCollect();
        return;
      }
      return;
    }

    // 1. MENU TẠM DỪNG (PAUSE MENU)
    if (gameStateMgr.isPaused()) {
      if (clickX >= 65 && clickX <= 230 && clickY >= 42 && clickY <= 66) {
        handlePauseMenuSelect(0);
        return;
      }
      if (clickX >= 250 && clickX <= 415 && clickY >= 42 && clickY <= 66) {
        handlePauseMenuSelect(1);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 92 && clickY <= 112) {
        handlePauseMenuSelect(2);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 114 && clickY <= 134) {
        handlePauseMenuSelect(3);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 136 && clickY <= 156) {
        handlePauseMenuSelect(4);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 158 && clickY <= 178) {
        handlePauseMenuSelect(5);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 180 && clickY <= 200) {
        handlePauseMenuSelect(6);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 202 && clickY <= 222) {
        handlePauseMenuSelect(7);
        return;
      }
      if (clickX >= 65 && clickX <= 415 && clickY >= 224 && clickY <= 244) {
        handlePauseMenuSelect(8);
        return;
      }
      return;
    }

    // 2. MODAL CÀI ĐẶT
    if (sceneMgr.isSettingsModalOpen) {
      if (clickX < 55 || clickX > 425 || clickY < 8 || clickY > 260) {
        sceneMgr.isSettingsModalOpen = false;
        audio.playItemCollect();
        return;
      }
      if (clickX >= 75 && clickX <= 405 && clickY >= 32 && clickY <= 250) {
        const optIdx = Math.floor((clickY - 32) / 22);
        if (optIdx === 0) {
          audio.toggleMute();
        } else if (optIdx === 1) {
          audio.toggleMusicMute();
        } else if (optIdx === 2) {
          // Thanh âm lượng: Nút Giảm ◀, Nút Tăng ▶, hoặc click trực tiếp lên thanh
          if (clickX >= 200 && clickX <= 224) {
            const newVol = Math.max(0, a11y.settings.volume - 10);
            audio.setVolume(newVol / 100);
            audio.playItemPickup();
          } else if (clickX >= 316 && clickX <= 338) {
            const newVol = Math.min(100, a11y.settings.volume + 10);
            audio.setVolume(newVol / 100);
            audio.playItemPickup();
          } else if (clickX >= 225 && clickX <= 315) {
            const ratio = (clickX - 226) / 88;
            const newVol = Math.max(0, Math.min(100, Math.round(ratio * 10) * 10));
            audio.setVolume(newVol / 100);
            audio.playItemPickup();
          } else {
            const nextVol = (Math.round(a11y.settings.volume / 20) * 20 + 20) % 120;
            audio.setVolume(nextVol / 100);
            audio.playItemPickup();
          }
        } else if (optIdx === 3) {
          a11y.updateSetting('reduceMotion', !a11y.settings.reduceMotion);
        } else if (optIdx === 4) {
          a11y.updateSetting('postProcessingBloom', !a11y.settings.postProcessingBloom);
        } else if (optIdx === 5) {
          a11y.updateSetting('highContrast', !a11y.settings.highContrast);
        } else if (optIdx === 6) {
          a11y.updateSetting('difficulty', a11y.settings.difficulty === 'de' ? 'thuong' : 'de');
        } else if (optIdx === 7) {
          a11y.updateSetting('virtualControls', !a11y.settings.virtualControls);
        } else if (optIdx === 8) {
          a11y.updateSetting('weatherEffects', !a11y.settings.weatherEffects);
        } else if (optIdx === 9) {
          sceneMgr.resetProgress();
          setRemixResult(null);
          audio.playFragmentUnlock();
          sceneMgr.isSettingsModalOpen = false;
        }
        setA11yVersion((v) => v + 1);
        return;
      }
    }

    // 3. LEVEL & BOSS
    if (sceneMgr.currentScene === 'LEVEL' || sceneMgr.currentScene === 'BOSS') {
      if (sceneMgr.currentScene === 'BOSS' && bossArenaRef.current) {
        if (bossArenaRef.current.isGameOver) {
          if (clickX >= 75 && clickX <= 225 && clickY >= 135 && clickY <= 175) {
            bossArenaRef.current.handleDefeatChoice(0);
            return;
          }
          if (clickX >= 235 && clickX <= 385 && clickY >= 135 && clickY <= 175) {
            bossArenaRef.current.handleDefeatChoice(1);
            return;
          }
        } else if (bossArenaRef.current.isVictory) {
          if (clickX >= 130 && clickX <= 350 && clickY >= 195 && clickY <= 240) {
            sceneMgr.changeScene('RAP_AO');
            audio.playVictoryFanfare();
            return;
          }
        }
      }

      // Nút Pause ở góc trên trái
      if (clickX >= 6 && clickX <= 106 && clickY >= 4 && clickY <= 30) {
        togglePause();
        return;
      }
      // Nút Hỏi Cụ ở góc trên phải
      if (clickX >= 360 && clickX <= 476 && clickY >= 4 && clickY <= 30) {
        sceneMgr.isArtisanChatOpen = !sceneMgr.isArtisanChatOpen;
        audio.playItemCollect();
        return;
      }
      // Khay thẻ dưới đáy (BOSS)
      if (clickY >= 210 && clickY <= 268 && clickX >= 176 && clickX <= 476) {
        const cardIdx = Math.floor((clickX - 176) / 100);
        if (cardIdx >= 0 && cardIdx < 3) {
          if (sceneMgr.currentScene === 'LEVEL' && gameWorldRef.current) {
            gameWorldRef.current.selectCard(cardIdx);
          } else if (sceneMgr.currentScene === 'BOSS' && bossArenaRef.current) {
            bossArenaRef.current.selectCard(cardIdx);
          }
          return;
        }
      }
    }

    // 4. TITLE
    if (sceneMgr.currentScene === 'TITLE') {
      if (clickX >= 135 && clickX <= 345 && clickY >= 88 && clickY <= 248) {
        const itemIdx = Math.floor((clickY - 94) / 24);
        if (itemIdx >= 0 && itemIdx < titleMenuItems.length) {
          handleSelectTitleMenuItem(itemIdx);
          return;
        }
      }
    }

    // 5. CHAPTER_MAP
    if (sceneMgr.currentScene === 'CHAPTER_MAP') {
      if (clickX >= 8 && clickX <= 72 && clickY >= 8 && clickY <= 30) {
        sceneMgr.changeScene('TITLE');
        audio.playItemCollect();
        return;
      }
      chapterStages.forEach((stg, idx) => {
        const dist = Math.hypot(clickX - stg.x, clickY - stg.y);
        if (dist <= 22) {
          setMapSelectedIndex(idx);
          handleSelectMapStage(idx);
        }
      });
    }

    // 6. RAP_AO
    if (sceneMgr.currentScene === 'RAP_AO') {
      if (clickX >= 8 && clickX <= 72 && clickY >= 4 && clickY <= 26) {
        sceneMgr.changeScene('CHAPTER_MAP');
        audio.playItemCollect();
        return;
      }
      const rap = rapAoRef.current;
      // Nút tiếp tục khi ráp xong 4/4 mảnh
      if (rap.isCompleted && clickX >= 290 && clickX <= 472 && clickY >= 4 && clickY <= 26) {
        sceneMgr.changeScene('REMIX');
        audio.playItemCollect();
        return;
      }
      // Click chọn mảnh ghép bên trái (x: 14..146, py: 46 + idx * 34)
      rap.parts.forEach((p, idx) => {
        const py = 46 + idx * 34;
        if (clickX >= 14 && clickX <= 146 && clickY >= py && clickY <= py + 30) {
          rap.selectPart(p.id);
          audio.playAttackSwing();
        }
      });
      // Click đặt vào slot ở giữa (s.x, s.y, s.width, s.height)
      rap.slots.forEach((s) => {
        if (clickX >= s.x && clickX <= s.x + s.width && clickY >= s.y && clickY <= s.y + s.height) {
          const success = rap.placeSelectedPartIntoSlot(s.id);
          if (success) {
            audio.playFragmentUnlock();
          } else {
            audio.playTruthCardWrong();
          }
        }
      });
    }

    // 7. REMIX
    if (sceneMgr.currentScene === 'REMIX') {
      if (clickX >= 8 && clickX <= 72 && clickY >= 8 && clickY <= 30) {
        sceneMgr.changeScene('TITLE');
        audio.playItemCollect();
        return;
      }

      // Nút Sự kiện (y: 62..84)
      if (clickX >= 188 && clickX <= 456 && clickY >= 62 && clickY <= 84) {
        setSelectedEventIndex((prev) => (prev + 1) % remixEvents.length);
        audio.playItemPickup();
        return;
      }
      // Nút Quần (y: 114..136)
      if (clickX >= 188 && clickX <= 456 && clickY >= 114 && clickY <= 136) {
        const next = (quanIndex + 1) % quanOptions.length;
        setQuanIndex(next);
        setRemixOutfit((prev) => ({ ...prev, quan: quanOptions[next].id }));
        audio.playAttackSwing();
        return;
      }
      // Nút Đội đầu (y: 140..162)
      if (clickX >= 188 && clickX <= 456 && clickY >= 140 && clickY <= 162) {
        const next = (headwearIndex + 1) % headwearOptions.length;
        setHeadwearIndex(next);
        setRemixOutfit((prev) => ({ ...prev, headwear: headwearOptions[next].id }));
        audio.playAttackSwing();
        return;
      }
      // Nút Giày (y: 166..188)
      if (clickX >= 188 && clickX <= 456 && clickY >= 166 && clickY <= 188) {
        const next = (footwearIndex + 1) % footwearOptions.length;
        setFootwearIndex(next);
        setRemixOutfit((prev) => ({ ...prev, footwear: footwearOptions[next].id }));
        audio.playAttackSwing();
        return;
      }
      // Nút Phụ kiện (y: 192..214)
      if (clickX >= 188 && clickX <= 456 && clickY >= 192 && clickY <= 214) {
        const next = (accessoryIndex + 1) % accessoryOptions.length;
        setAccessoryIndex(next);
        setRemixOutfit((prev) => ({ ...prev, accessory: accessoryOptions[next].id }));
        audio.playAttackSwing();
        return;
      }

      // Nút Đánh giá chuẩn mực (x: 188..358, y: 220..248)
      if (clickX >= 188 && clickX <= 358 && clickY >= 220 && clickY <= 248) {
        const ev = remixEvents[selectedEventIndex];
        const outfitInput = {
          ao: 'ao_ngu_than',
          quan_vay: quanOptions[quanIndex].id,
          phu_kien: [headwearOptions[headwearIndex].id, accessoryOptions[accessoryIndex].id, footwearOptions[footwearIndex].id].filter(
            (x) => x !== 'none'
          ),
          mau_sac: 'tim_hue',
          phong_cach: 'remix_genz',
        };
        const result = evaluateOutfitRuleBased(ev.id, outfitInput);
        setRemixResult(result);
        const entry: LookbookEntry = {
          id: `look_${Date.now()}`,
          su_kien: ev.name,
          outfit: {
            ao: 'Áo Ngũ Thân Lập Lĩnh',
            quan: quanOptions[quanIndex].label,
            dau: headwearOptions[headwearIndex].label,
            giay: footwearOptions[footwearIndex].label,
            phu_kien: accessoryOptions[accessoryIndex].label,
          },
          diem: Math.round((result.diem_hoa_hop + result.diem_ton_trong) / 2),
          danh_hieu:
            result.den === 'xanh'
              ? 'Tuyệt Tác Phối Đồ Di Sản'
              : result.den === 'vang'
              ? 'Bản Phối Cách Tân Gợi Mở'
              : 'Cần Lưu Ý Chuẩn Mực Nơi Tôn Nghiêm',
          nhan_xet: result.canh_bao?.[0]?.ly_do || 'Bản phối xuất sắc, tôn trọng lịch sử và giàu tính thẩm mỹ đương đại!',
          ngay_tao: new Date().toLocaleDateString('vi-VN'),
        };
        sceneMgr.luuLookbook(entry);
        AlbumStorage.saveLook({
          name: `Bản phối ${ev.name}`,
          event: ev.id,
          outfit: remixOutfit,
          judgeResult: result,
        });
        audio.playVictoryFanfare();
        setIsLookbookModalOpen(true);
        return;
      }

      // Nút Xem Lookbook (x: 364..456, y: 220..248)
      if (clickX >= 364 && clickX <= 456 && clickY >= 220 && clickY <= 248) {
        setIsLookbookModalOpen(true);
        audio.playItemCollect();
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#0f0d1b] flex items-center justify-center overflow-hidden select-none m-0 p-0"
      style={{ touchAction: 'none' }}
    >
      {/* Canvas Logic 480x270 với Integer Scaling */}
      <canvas
        ref={canvasRef}
        width={LOGIC_WIDTH}
        height={LOGIC_HEIGHT}
        onClick={handleCanvasClick}
        style={{
          width: `${LOGIC_WIDTH * scale}px`,
          height: `${LOGIC_HEIGHT * scale}px`,
          imageRendering: 'pixelated',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          cursor: 'pointer',
        }}
        className="block bg-[#0f0d1b] shadow-2xl"
      />

      {/* Phím ảo cảm ứng dành cho màn hình di động (Chỉ hiện khi pointer là coarse) */}
      {isCoarsePointer && a11y.settings.virtualControls && coreGameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3">
          {/* Nút tạm dừng cảm ứng trên đỉnh */}
          <div className="flex justify-between items-center w-full">
            <button
              onClick={togglePause}
              className="pointer-events-auto bg-[#161426]/85 border-2 border-[#fedb5b] text-[#fedb5b] px-3 py-1.5 rounded text-xs font-bold shadow-md active:bg-[#fedb5b] active:text-[#161426]"
            >
              ⏸ {gameStateMgr.isPaused() ? 'TIẾP TỤC' : 'TẠM DỪNG'}
            </button>
            <button
              onClick={() => {
                sceneMgr.isArtisanChatOpen = !sceneMgr.isArtisanChatOpen;
                audio.playItemCollect();
              }}
              className="pointer-events-auto bg-[#161426]/85 border-2 border-[#77e0b5] text-[#77e0b5] px-3 py-1.5 rounded text-xs font-bold shadow-md active:bg-[#77e0b5] active:text-[#161426]"
            >
              💬 HỎI NGHỆ NHÂN (T)
            </button>
          </div>

          {/* Cụm D-Pad và Nút Hành Động ở đáy */}
          <div className="flex justify-between items-end w-full pb-2">
            {/* Cụm D-Pad Trái / Phải / Nhảy / Cúi */}
            <div className="grid grid-cols-3 gap-1.5 pointer-events-auto">
              <div />
              <button
                onTouchStart={() => input.setVirtualAction('jump', true)}
                onTouchEnd={() => input.setVirtualAction('jump', false)}
                className="w-12 h-12 bg-[#161426]/85 border border-[#fedb5b] text-[#fedb5b] font-bold rounded flex items-center justify-center text-lg active:bg-[#fedb5b] active:text-[#161426]"
              >
                ▲
              </button>
              <div />
              <button
                onTouchStart={() => input.setVirtualAction('left', true)}
                onTouchEnd={() => input.setVirtualAction('left', false)}
                className="w-12 h-12 bg-[#161426]/85 border border-[#fedb5b] text-[#fedb5b] font-bold rounded flex items-center justify-center text-lg active:bg-[#fedb5b] active:text-[#161426]"
              >
                ◀
              </button>
              <button
                onTouchStart={() => input.setVirtualAction('crouch', true)}
                onTouchEnd={() => input.setVirtualAction('crouch', false)}
                className="w-12 h-12 bg-[#161426]/85 border border-[#fedb5b] text-[#fedb5b] font-bold rounded flex items-center justify-center text-lg active:bg-[#fedb5b] active:text-[#161426]"
              >
                ▼
              </button>
              <button
                onTouchStart={() => input.setVirtualAction('right', true)}
                onTouchEnd={() => input.setVirtualAction('right', false)}
                className="w-12 h-12 bg-[#161426]/85 border border-[#fedb5b] text-[#fedb5b] font-bold rounded flex items-center justify-center text-lg active:bg-[#fedb5b] active:text-[#161426]"
              >
                ▶
              </button>
            </div>

            {/* Cụm Nút Hành Động J (Đánh), K (Chiêu), L (Né) */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onTouchStart={() => input.setVirtualAction('attack', true)}
                onTouchEnd={() => input.setVirtualAction('attack', false)}
                className="w-14 h-14 bg-[#bf363b]/90 border-2 border-[#fedb5b] text-white font-bold rounded-full flex flex-col items-center justify-center shadow-lg active:scale-95"
              >
                <span className="text-sm">J</span>
                <span className="text-[9px]">ĐÁNH</span>
              </button>
              <button
                onTouchStart={() => input.setVirtualAction('special', true)}
                onTouchEnd={() => input.setVirtualAction('special', false)}
                className="w-14 h-14 bg-[#40bfa3]/90 border-2 border-[#fedb5b] text-white font-bold rounded-full flex flex-col items-center justify-center shadow-lg active:scale-95"
              >
                <span className="text-sm">K</span>
                <span className="text-[9px]">CHIÊU</span>
              </button>
              <button
                onTouchStart={() => input.setVirtualAction('dodge', true)}
                onTouchEnd={() => input.setVirtualAction('dodge', false)}
                className="w-12 h-12 bg-[#e88827]/90 border-2 border-[#fedb5b] text-white font-bold rounded-full flex flex-col items-center justify-center shadow-lg active:scale-95"
              >
                <span className="text-sm">L</span>
                <span className="text-[8px]">NÉ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
