/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VỎ BỌC GAME TOÀN MÀN HÌNH (FULLSCREEN RETRO CANVAS SHELL)
 * - Canvas 480x270 logic phủ kín cửa sổ (100vw x 100vh)
 * - Phóng đại theo SỐ NGUYÊN lớn nhất vừa khung (Math.floor)
 * - Phần dư là viền letterbox màu navy đậm (#0f0d1b)
 * - ctx.imageSmoothingEnabled = false, CSS image-rendering: pixelated
 * - Menu Tạm Dừng (Pause Menu) bên trong vòng lặp game kích hoạt bằng 'P' hoặc cảm ứng di động,
 *   hiển thị Cài đặt trò chơi (Settings), 'Tiếp tục' (Resume), và 'Thoát về bản đồ' (Exit to Map)
 *   vẽ bằng hệ thống giao diện 9-slice.
 */

import React, { useEffect, useRef, useState } from 'react';
import { SceneManager } from './sceneManager.ts';
import { GameWorld } from './gameWorld.ts';
import { BossArenaWorld } from './bossArena.ts';
import { RapAoManager } from './rapAo.ts';
import { PaperdollRenderer, OutfitSelection } from '../art/paperdoll.ts';
import { CHAPTER_1_JOURNAL } from './nhatKyTrangPhuc.ts';
import { AudioManager } from '../engine/audio.ts';
import { InputManager } from '../engine/input.ts';
import { AccessibilityManager } from '../engine/accessibility.ts';
import { GameRenderer } from '../engine/renderer.ts';
import { AssetManager } from '../assets/loader.ts';
import {
  ensureFontLoaded,
  draw9Slice,
  get9SliceCanvas,
  drawPixelTextWithShadow,
  drawDialogueBox,
  drawActionCallout,
} from '../art/nineSlice.ts';

const LOGIC_WIDTH = 480;
const LOGIC_HEIGHT = 270;

interface GameShellProps {
  onToggleDevPanel: () => void;
  isDevPanelOpen: boolean;
}

export const GameShell: React.FC<GameShellProps> = ({ onToggleDevPanel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  // Tham chiếu game engine
  const sceneMgr = SceneManager.getInstance();
  const audio = AudioManager.getInstance();
  const a11y = AccessibilityManager.getInstance();
  const input = InputManager.getInstance();

  const gameWorldRef = useRef<GameWorld | null>(null);
  const bossArenaRef = useRef<BossArenaWorld | null>(null);
  const rapAoRef = useRef<RapAoManager>(new RapAoManager());

  // Trạng thái Menu Tiêu Đề
  const [titleSelectedIndex, setTitleSelectedIndex] = useState(0);
  const titleMenuItems = [
    { id: 'start', label: 'BẮT ĐẦU HÀNH TRÌNH' },
    { id: 'map', label: 'BẢN ĐỒ CỐ ĐÔ HUẾ' },
    { id: 'rap_ao', label: 'MÀN RÁP ÁO NGŨ THÂN' },
    { id: 'lookbook', label: 'PHÒNG THỬ ĐỒ REMIX' },
    { id: 'settings', label: 'CÀI ĐẶT & TIẾP CẬN' },
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
  const [, setA11yVersion] = useState(0); // Để kích hoạt re-render khi setting thay đổi

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
  const [remixResult] = useState<any>(null);
  const [isEvaluatingRemix] = useState(false);

  // Trạng thái Hỏi Cụ Nghệ Nhân trong game (phím T)
  const [artisanChatText] = useState(
    'Áo ngũ thân lập lĩnh là chuẩn mực trang phục truyền thống của người Việt dưới thời Nguyễn. Bốn thân ngoài tượng trưng cho Tứ thân phụ mẫu, thân thứ năm bên trong che chở người mặc đó con!'
  );
  const [artisanChatTitle] = useState('Cụ Nghệ Nhân May Đo Cố Đô:');

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

  // Yêu cầu 5: Nút cảm ứng chỉ hiện khi matchMedia('(pointer: coarse)').matches; trên máy tính ẩn hoàn toàn.
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
  const togglePause = () => {
    sceneMgr.isPaused = !sceneMgr.isPaused;
    audio.playItemCollect();
    setPauseMenuIndex(0);
  };

  // Lắng nghe phím tắt toàn cục
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Mở bảng Dev ẩn
      if (e.key === 'F1') {
        e.preventDefault();
        onToggleDevPanel();
        return;
      }

      // F2: Bật / Tắt chế độ Debug (Phím debug đổi sang F2, bỏ phím D)
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

      // ESC: Thoát Pause, đóng modal hoặc quay về menu trước
      if (e.key === 'Escape') {
        if (sceneMgr.isPaused) {
          sceneMgr.isPaused = false;
          audio.playItemCollect();
        } else if (sceneMgr.isArtisanChatOpen) {
          sceneMgr.isArtisanChatOpen = false;
        } else if (sceneMgr.isSettingsModalOpen) {
          sceneMgr.isSettingsModalOpen = false;
        } else if (sceneMgr.currentScene === 'LEVEL' || sceneMgr.currentScene === 'BOSS') {
          // Khi đang chơi mà bấm ESC -> Mở Pause Menu
          togglePause();
        } else if (sceneMgr.currentScene === 'CHAPTER_MAP' || sceneMgr.currentScene === 'RAP_AO' || sceneMgr.currentScene === 'REMIX') {
          sceneMgr.changeScene('TITLE');
        }
        return;
      }

      // ĐIỀU KHIỂN KHI ĐANG TẠM DỪNG (PAUSED)
      if (sceneMgr.isPaused) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          setPauseMenuIndex((prev) => (prev > 0 ? prev - 1 : 5));
          audio.playAttackSwing();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          setPauseMenuIndex((prev) => (prev < 5 ? prev + 1 : 0));
          audio.playAttackSwing();
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
          handlePauseMenuSelect(pauseMenuIndex);
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          handlePauseMenuAdjust(pauseMenuIndex, -1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          handlePauseMenuAdjust(pauseMenuIndex, 1);
        }
        return;
      }

      // Menu Tiêu Đề Điều Khiển
      if (sceneMgr.currentScene === 'TITLE' && !sceneMgr.isSettingsModalOpen) {
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
      if (sceneMgr.currentScene === 'CHAPTER_MAP' && !sceneMgr.isPaused && !sceneMgr.isArtisanChatOpen) {
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
  }, [titleSelectedIndex, mapSelectedIndex, pauseMenuIndex, onToggleDevPanel]);

  // Xử lý chọn trong Menu Tạm Dừng
  const handlePauseMenuSelect = (idx: number) => {
    audio.playItemCollect();
    if (idx === 0) {
      // 1. TIẾP TỤC (Resume)
      sceneMgr.isPaused = false;
    } else if (idx === 1) {
      // 2. THOÁT VỀ BẢN ĐỒ (Exit to Map)
      sceneMgr.isPaused = false;
      sceneMgr.changeScene('CHAPTER_MAP');
    } else if (idx === 2) {
      // 3. Âm thanh (Bật / Tắt Mute)
      audio.toggleMute();
      setA11yVersion((v) => v + 1);
    } else if (idx === 3) {
      // 4. Giảm chuyển động (Reduce Motion)
      a11y.updateSetting('reduceMotion', !a11y.settings.reduceMotion);
      setA11yVersion((v) => v + 1);
    } else if (idx === 4) {
      // 5. Độ tương phản cao (High Contrast)
      a11y.updateSetting('highContrast', !a11y.settings.highContrast);
      setA11yVersion((v) => v + 1);
    } else if (idx === 5) {
      // 6. Độ khó (Difficulty)
      a11y.updateSetting('difficulty', a11y.settings.difficulty === 'de' ? 'thuong' : 'de');
      setA11yVersion((v) => v + 1);
    }
  };

  const handlePauseMenuAdjust = (idx: number, delta: number) => {
    if (idx === 2) {
      // Chỉnh âm lượng
      const newVol = Math.max(0, Math.min(100, a11y.settings.volume + delta * 10));
      audio.setVolume(newVol / 100);
      setA11yVersion((v) => v + 1);
      audio.playAttackSwing();
    }
  };

  const handleSelectTitleMenuItem = (idx: number) => {
    audio.playItemCollect();
    const item = titleMenuItems[idx];
    if (item.id === 'start') {
      sceneMgr.changeScene('CHAPTER_MAP');
      audio.startAmbientBGM();
    } else if (item.id === 'map') {
      sceneMgr.changeScene('CHAPTER_MAP');
      audio.startAmbientBGM();
    } else if (item.id === 'rap_ao') {
      sceneMgr.changeScene('RAP_AO');
    } else if (item.id === 'lookbook') {
      sceneMgr.changeScene('REMIX');
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

  // VÒNG LẶP CHÍNH CỦA GAME (60Hz)
  useEffect(() => {
    let animId: number;

    const startLoop = async () => {
      // Yêu cầu 4 & 5: Nạp font Pixelify Sans và tài sản Sprite trước khi vẽ bất kỳ thứ gì
      await ensureFontLoaded();
      await AssetManager.getInstance().loadAll();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      // Khởi tạo các thế giới game
      gameWorldRef.current = new GameWorld(canvas, sceneMgr.currentLevelId);
      bossArenaRef.current = new BossArenaWorld(canvas);

      const render = () => {
        // 1. Cập nhật máy trạng thái cảnh
        sceneMgr.update();

        // 2. Xóa canvas
        ctx.fillStyle = '#0f0d1b';
        ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

        // 3. Render cảnh tương ứng
        if (sceneMgr.currentScene === 'TITLE') {
          renderTitleScene(ctx);
        } else if (sceneMgr.currentScene === 'CHAPTER_MAP') {
          renderChapterMapScene(ctx);
        } else if (sceneMgr.currentScene === 'LEVEL') {
          if (gameWorldRef.current) {
            if (gameWorldRef.current.currentLevelId !== sceneMgr.currentLevelId) {
              gameWorldRef.current.loadLevel(sceneMgr.currentLevelId);
            }
            // Đóng băng cập nhật vật lý khi đang Tạm Dừng (isPaused)
            if (!sceneMgr.isPaused && !sceneMgr.isArtisanChatOpen && sceneMgr.fadeState === 'none') {
              gameWorldRef.current.update();
            }
            gameWorldRef.current.render();

            // Nếu qua màn -> Mở khóa màn tiếp theo và về bản đồ
            if (gameWorldRef.current.isLevelCompleted) {
              sceneMgr.unlockNextLevel();
              if (sceneMgr.fadeState === 'none') {
                setTimeout(() => {
                  if (sceneMgr.currentLevelId === 'c1_m4') {
                    sceneMgr.changeScene('BOSS');
                  } else {
                    sceneMgr.changeScene('CHAPTER_MAP');
                  }
                }, 1800);
              }
            }
          }
        } else if (sceneMgr.currentScene === 'BOSS') {
          if (bossArenaRef.current) {
            // Đóng băng cập nhật boss khi đang Tạm Dừng
            if (!sceneMgr.isPaused && !sceneMgr.isArtisanChatOpen && sceneMgr.fadeState === 'none') {
              bossArenaRef.current.update();
            }
            bossArenaRef.current.render();

            // Nếu hạ Boss -> Chuyển sang màn Ráp Áo
            if (bossArenaRef.current.isVictory) {
              sceneMgr.isBossDefeated = true;
              sceneMgr.saveProgress();
              if (sceneMgr.fadeState === 'none') {
                setTimeout(() => {
                  sceneMgr.changeScene('RAP_AO');
                }, 2400);
              }
            }
          }
        } else if (sceneMgr.currentScene === 'RAP_AO') {
          renderRapAoScene(ctx);
        } else if (sceneMgr.currentScene === 'REMIX') {
          renderRemixScene(ctx);
        }

        // 4. RENDER MENU TẠM DỪNG (PAUSE MENU) TRONG CANVAS BẰNG 9-SLICE
        if (sceneMgr.isPaused) {
          renderPauseMenu(ctx);
        } else if (sceneMgr.isArtisanChatOpen) {
          renderArtisanChatModal(ctx);
        } else if (sceneMgr.isSettingsModalOpen) {
          renderSettingsModal(ctx);
        }

        // 5. Render Fade Transition Mờ Dần
        sceneMgr.renderFade(ctx, LOGIC_WIDTH, LOGIC_HEIGHT);

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    };

    startLoop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // VẼ MENU TẠM DỪNG (PAUSE MENU) BẰNG KHUNG 9-SLICE
  const renderPauseMenu = (ctx: CanvasRenderingContext2D) => {
    // 1. Lớp phủ tối mờ màn hình game đang chạy
    ctx.fillStyle = 'rgba(15, 13, 27, 0.85)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // 2. Khung 9-slice chính giữa
    const panel = get9SliceCanvas();
    const px = 50;
    const py = 16;
    const pw = 380;
    const ph = 238;
    draw9Slice(ctx, panel, px, py, pw, ph, 8);

    // Tiêu đề
    drawPixelTextWithShadow(ctx, '⏸ TẠM DỪNG (PAUSED)', LOGIC_WIDTH / 2, py + 8, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
    });

    // 3. HAI NÚT HÀNH ĐỘNG CHÍNH: "TIẾP TỤC" VÀ "THOÁT VỀ BẢN ĐỒ"
    // Nút 0: TIẾP TỤC (Resume)
    const btn0Sel = pauseMenuIndex === 0;
    ctx.fillStyle = btn0Sel ? '#40bfa3' : '#1c5e59';
    ctx.fillRect(65, 48, 165, 26);
    ctx.strokeStyle = btn0Sel ? '#fedb5b' : '#77e0b5';
    ctx.lineWidth = btn0Sel ? 2 : 1;
    ctx.strokeRect(65.5, 48.5, 164, 25);

    drawPixelTextWithShadow(ctx, '▶ TIẾP TỤC (RESUME)', 147, 54, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: btn0Sel ? '#161426' : '#ffffff',
      shadowColor: btn0Sel ? '#77e0b5' : '#05040a',
      align: 'center',
    });

    // Nút 1: THOÁT VỀ BẢN ĐỒ (Exit to Map)
    const btn1Sel = pauseMenuIndex === 1;
    ctx.fillStyle = btn1Sel ? '#bf363b' : '#4f3547';
    ctx.fillRect(250, 48, 165, 26);
    ctx.strokeStyle = btn1Sel ? '#fedb5b' : '#a83b6f';
    ctx.lineWidth = btn1Sel ? 2 : 1;
    ctx.strokeRect(250.5, 48.5, 164, 25);

    drawPixelTextWithShadow(ctx, '🗺️ THOÁT VỀ BẢN ĐỒ', 332, 54, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: btn1Sel ? '#fedb5b' : '#f7edd7',
      shadowColor: '#05040a',
      align: 'center',
    });

    // Đường gạch ngăn cách
    ctx.strokeStyle = '#3b253b';
    ctx.beginPath();
    ctx.moveTo(65, 84);
    ctx.lineTo(415, 84);
    ctx.stroke();

    // 4. PHẦN CÀI ĐẶT TRÒ CHƠI (SETTINGS IN PAUSE)
    drawPixelTextWithShadow(ctx, 'CÀI ĐẶT TRÒ CHƠI (GAME SETTINGS):', 65, 88, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: '#f7af34',
    });

    const settingsRows = [
      {
        idx: 2,
        label: `Âm thanh: ${a11y.settings.muted ? '🔇 TẮT (MUTE)' : `🔊 BẬT (${a11y.settings.volume}%)`}`,
        hint: '[Enter/Chạm để Đổi • ◀/▶ Chỉnh âm]',
        y: 104,
      },
      {
        idx: 3,
        label: `Giảm chuyển động (Reduce Motion): ${a11y.settings.reduceMotion ? '✓ BẬT (Tắt rung lắc & tia tốc độ)' : '✕ TẮT'}`,
        hint: '[Enter/Chạm để Bật/Tắt]',
        y: 130,
      },
      {
        idx: 4,
        label: `Độ tương phản cao (High Contrast): ${a11y.settings.highContrast ? '✓ BẬT' : '✕ TẮT'}`,
        hint: '[Enter/Chạm để Bật/Tắt]',
        y: 156,
      },
      {
        idx: 5,
        label: `Độ khó: ${a11y.settings.difficulty === 'de' ? 'THƯ THÁI (7 TIM, NẠP CHỈ NHANH)' : 'TIÊU CHUẨN (5 TIM)'}`,
        hint: '[Enter/Chạm để Đổi độ khó]',
        y: 182,
      },
    ];

    settingsRows.forEach((row) => {
      const isSel = pauseMenuIndex === row.idx;
      ctx.fillStyle = isSel ? '#3b253b' : '#261b2d';
      ctx.fillRect(65, row.y, 350, 22);
      ctx.strokeStyle = isSel ? '#fedb5b' : '#63534b';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(65.5, row.y + 0.5, 349, 21);

      drawPixelTextWithShadow(ctx, `${isSel ? '▶ ' : '  '}${row.label}`, 72, row.y + 5, {
        font: isSel ? 'bold 9px "Pixelify Sans", monospace' : '9px "Pixelify Sans", monospace',
        textColor: isSel ? '#fedb5b' : '#f7edd7',
      });

      drawPixelTextWithShadow(ctx, row.hint, 405, row.y + 5, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#8e7970',
        align: 'right',
      });
    });

    // Tiến trình mảnh ghép cổ phục
    drawPixelTextWithShadow(
      ctx,
      `Chương 1 Huế: Đã khôi phục ${sceneMgr.collectedPieces.length}/4 Mảnh Áo Ngũ Thân`,
      65,
      210,
      {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#77e0b5',
      }
    );

    // Hướng dẫn thao tác
    drawPixelTextWithShadow(
      ctx,
      '[▲/▼/Chạm] Chọn  •  [ENTER/J] Xác nhận  •  [P / ESC] Tiếp tục trận đấu',
      LOGIC_WIDTH / 2,
      232,
      {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#c7aa8d',
        align: 'center',
      }
    );
  };

  // VẼ CẢNH TIÊU ĐỀ (TITLE SCENE)
  const renderTitleScene = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#161426';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    // Mái ngói điện Thái Hòa mờ ảo
    ctx.fillStyle = '#261b2d';
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(120, 140);
    ctx.lineTo(240, 160);
    ctx.lineTo(360, 130);
    ctx.lineTo(480, 170);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.closePath();
    ctx.fill();

    // Vầng trăng rằm Cố đô
    ctx.fillStyle = '#fedb5b';
    ctx.beginPath();
    ctx.arc(410, 60, 28, 0, Math.PI * 2);
    ctx.fill();

    // Tiêu đề game lớn
    drawPixelTextWithShadow(ctx, 'TẦM PHỤC KÝ', LOGIC_WIDTH / 2, 40, {
      font: 'bold 32px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
    });

    drawPixelTextWithShadow(ctx, 'VIỆT PHỤC REMIX - DI SẢN CỐ ĐÔ HUẾ', LOGIC_WIDTH / 2, 75, {
      font: '10px "Pixelify Sans", monospace',
      textColor: '#f7af34',
      shadowColor: '#161426',
      align: 'center',
    });

    // Khung menu 9-slice
    const menuX = 140;
    const menuY = 95;
    const menuW = 200;
    const menuH = 145;
    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, menuX, menuY, menuW, menuH, 8);

    titleMenuItems.forEach((item, idx) => {
      const isSel = idx === titleSelectedIndex;
      const iy = menuY + 16 + idx * 24;

      if (isSel) {
        ctx.fillStyle = '#3b253b';
        ctx.fillRect(menuX + 12, iy - 3, menuW - 24, 20);
        ctx.strokeStyle = '#fedb5b';
        ctx.strokeRect(menuX + 12.5, iy - 2.5, menuW - 25, 19);
      }

      drawPixelTextWithShadow(ctx, `${isSel ? '▶ ' : '  '}${item.label}`, menuX + 20, iy, {
        font: isSel ? 'bold 10px "Pixelify Sans", monospace' : '10px "Pixelify Sans", monospace',
        textColor: isSel ? '#fedb5b' : '#c7aa8d',
        shadowColor: '#161426',
      });
    });

    drawPixelTextWithShadow(ctx, '[▲/▼] Chọn  •  [ENTER/J] Xác nhận  •  [P] Tạm Dừng / Cài Đặt  •  [T] Hỏi Nghệ Nhân', LOGIC_WIDTH / 2, 252, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#8e7970',
      shadowColor: '#05040a',
      align: 'center',
    });
  };

  // VẼ CẢNH BẢN ĐỒ CHƯƠNG 1 (CHAPTER MAP SCENE)
  const renderChapterMapScene = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#1c172b';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    drawPixelTextWithShadow(ctx, 'BẢN ĐỒ CHƯƠNG 1: HUẾ - ÁO NGŨ THÂN', LOGIC_WIDTH / 2, 14, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
    });

    // Dòng sông Hương uốn lượn
    ctx.strokeStyle = '#268c7e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(30, 160);
    ctx.bezierCurveTo(120, 180, 200, 90, 280, 140);
    ctx.bezierCurveTo(340, 180, 400, 110, 460, 130);
    ctx.stroke();

    // Các trạm
    chapterStages.forEach((stage, idx) => {
      const isSel = idx === mapSelectedIndex;
      const isUnlocked = sceneMgr.unlockedStages.includes(stage.id) || idx === 0;

      ctx.fillStyle = isUnlocked ? (isSel ? '#fedb5b' : '#f7af34') : '#4f3547';
      ctx.beginPath();
      ctx.arc(stage.x, stage.y, isSel ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isSel ? '#ffffff' : '#161426';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawPixelTextWithShadow(ctx, stage.name, stage.x, stage.y + 18, {
        font: isSel ? 'bold 10px "Pixelify Sans", monospace' : '9px "Pixelify Sans", monospace',
        textColor: isSel ? '#fedb5b' : (isUnlocked ? '#f7edd7' : '#8e7970'),
        shadowColor: '#05040a',
        align: 'center',
      });
    });

    const curStage = chapterStages[mapSelectedIndex];
    const isUnlocked = sceneMgr.unlockedStages.includes(curStage.id) || mapSelectedIndex === 0;

    const infoPanel = get9SliceCanvas();
    draw9Slice(ctx, infoPanel, 60, 195, 360, 52, 6);

    drawPixelTextWithShadow(ctx, curStage.name.toUpperCase(), 75, 202, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#161426',
    });

    drawPixelTextWithShadow(ctx, `Mục tiêu giải cứu: ${curStage.desc}`, 75, 218, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#f7edd7',
      shadowColor: '#161426',
    });

    drawPixelTextWithShadow(ctx, isUnlocked ? '▶ Bấm [ENTER/J] để bước vào thử thách' : '🔒 Cần hoàn thành các màn trước để mở khóa', 75, 232, {
      font: '9px "Pixelify Sans", monospace',
      textColor: isUnlocked ? '#77e0b5' : '#ba5e1b',
      shadowColor: '#161426',
    });
  };

  // VẼ CẢNH MÀN RÁP ÁO (RAP AO SCENE)
  const renderRapAoScene = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#161426';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    drawPixelTextWithShadow(ctx, 'MÀN RÁP ÁO NGŨ THÂN HUẾ', LOGIC_WIDTH / 2, 12, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      shadowColor: '#05040a',
      align: 'center',
    });

    const rap = rapAoRef.current;
    const panel = get9SliceCanvas();

    draw9Slice(ctx, panel, 30, 32, 420, 48, 6);
    drawPixelTextWithShadow(ctx, 'CỤ NGHỆ NHÂN CHỈ DẪN:', 42, 38, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
    });

    const words = rap.artisanFeedback.split(' ');
    const line1 = words.slice(0, 14).join(' ');
    const line2 = words.slice(14, 28).join(' ');
    drawPixelTextWithShadow(ctx, line1, 42, 52, { font: '9px "Pixelify Sans", monospace', textColor: '#f7edd7' });
    if (line2) drawPixelTextWithShadow(ctx, line2, 42, 64, { font: '9px "Pixelify Sans", monospace', textColor: '#f7edd7' });

    draw9Slice(ctx, panel, 25, 88, 160, 165, 6);
    drawPixelTextWithShadow(ctx, 'MẢNH GHÉP:', 35, 94, { font: 'bold 10px "Pixelify Sans", monospace', textColor: '#fedb5b' });

    rap.parts.forEach((p, idx) => {
      const isSel = rap.selectedPartId === p.id;
      const isPlaced = p.assignedSlotId !== null;
      const py = 112 + idx * 34;

      ctx.fillStyle = isPlaced ? '#261b2d' : (isSel ? '#fedb5b' : '#3b253b');
      ctx.fillRect(35, py, 140, 28);
      ctx.strokeStyle = isSel ? '#ffffff' : '#63534b';
      ctx.strokeRect(35.5, py + 0.5, 139, 27);

      drawPixelTextWithShadow(ctx, `${p.name}`, 40, py + 4, {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: isSel ? '#161426' : (isPlaced ? '#77e0b5' : '#f7edd7'),
        shadowColor: isSel ? '#fedb5b' : '#05040a',
      });
      drawPixelTextWithShadow(ctx, isPlaced ? '✓ Đã định vị' : (isSel ? 'Đang chọn' : 'Bấm phím số ' + (idx + 1)), 40, py + 16, {
        font: '8px "Pixelify Sans", monospace',
        textColor: isSel ? '#161426' : '#c7aa8d',
        shadowColor: isSel ? '#fedb5b' : '#05040a',
      });
    });

    draw9Slice(ctx, panel, 200, 88, 255, 165, 6);
    drawPixelTextWithShadow(ctx, 'PHÔM ÁO NGŨ THÂN:', 210, 94, { font: 'bold 10px "Pixelify Sans", monospace', textColor: '#fedb5b' });

    rap.slots.forEach((s, idx) => {
      const isFilled = s.placedPartId !== null;
      const sy = 112 + idx * 34;

      ctx.fillStyle = isFilled ? '#1c5e59' : '#161426';
      ctx.fillRect(210, sy, 235, 28);
      ctx.strokeStyle = isFilled ? '#77e0b5' : '#fedb5b';
      ctx.strokeRect(210.5, sy + 0.5, 234, 27);

      drawPixelTextWithShadow(ctx, `${s.name}: ${isFilled ? 'HOÀN THÀNH' : '[CHỜ RÁP]'}`, 218, sy + 4, {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: isFilled ? '#77e0b5' : '#fedb5b',
      });
      drawPixelTextWithShadow(ctx, isFilled ? 'Đúng vị trí giải phẫu cổ phục' : s.hint.substring(0, 42) + '...', 218, sy + 16, {
        font: '8px "Pixelify Sans", monospace',
        textColor: '#c7aa8d',
      });
    });

    if (rap.isCompleted) {
      drawActionCallout(ctx, LOGIC_WIDTH / 2, 140, 'ÁO NGŨ THÂN HOÀN THIỆN!', 1.2, '#fedb5b');
      drawPixelTextWithShadow(ctx, 'Bấm [ESC] để quay lại Bản Đồ', LOGIC_WIDTH / 2, 256, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
        align: 'center',
      });
    }
  };

  // VẼ CẢNH REMIX PHỐI ĐỒ (LOOKBOOK SCENE)
  const renderRemixScene = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#161426';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    drawPixelTextWithShadow(ctx, 'PHÒNG THỬ ĐỒ: VIỆT PHỤC REMIX', LOGIC_WIDTH / 2, 12, {
      font: 'bold 16px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      align: 'center',
    });

    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 25, 34, 180, 222, 6);

    PaperdollRenderer.drawAvatar(ctx, remixOutfit, 115, 240);

    draw9Slice(ctx, panel, 215, 34, 245, 222, 6);
    drawPixelTextWithShadow(ctx, 'TÙY BIẾN TRANG PHỤC:', 225, 42, {
      font: 'bold 10px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
    });

    const aoOptions = [
      { id: 'ao_ngu_than', name: '1. Áo Ngũ Thân Huế' },
      { id: 'ao_dai_truyen_thong', name: '2. Áo Dài Truyền Thống' },
      { id: 'ao_tu_than', name: '3. Áo Tứ Thân Kinh Bắc' },
      { id: 'ao_ba_ba', name: '4. Áo Bà Ba Nam Bộ' },
    ];
    aoOptions.forEach((ao, idx) => {
      const isSel = remixOutfit.ao === ao.id;
      const y = 62 + idx * 20;
      drawPixelTextWithShadow(ctx, `${isSel ? '▶ ' : '  '}${ao.name}`, 225, y, {
        font: '9px "Pixelify Sans", monospace',
        textColor: isSel ? '#fedb5b' : '#c7aa8d',
      });
    });

    drawPixelTextWithShadow(ctx, 'KẾT QUẢ THẨM ĐỊNH VĂN HÓA (/api/judge):', 225, 150, {
      font: 'bold 9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
    });

    if (remixResult) {
      const isGreen = remixResult.den === 'xanh';
      const isYellow = remixResult.den === 'vang';
      ctx.fillStyle = isGreen ? '#77e0b5' : (isYellow ? '#fedb5b' : '#bf363b');
      ctx.fillRect(225, 168, 12, 12);

      drawPixelTextWithShadow(ctx, `ĐÈN ${remixResult.den.toUpperCase()}: ${isGreen ? 'HÀI HÒA & TÔN NGHIÊM' : 'CẦN LƯU Ý BỐI CẢNH'}`, 244, 169, {
        font: 'bold 9px "Pixelify Sans", monospace',
        textColor: isGreen ? '#77e0b5' : '#fedb5b',
      });

      drawPixelTextWithShadow(ctx, `Hòa hợp: ${remixResult.diem_hoa_hop}/100 • Tôn trọng: ${remixResult.diem_ton_trong}/100`, 225, 186, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#f7edd7',
      });
    } else {
      drawPixelTextWithShadow(ctx, isEvaluatingRemix ? 'Đang thẩm định...' : 'Bấm [SPACE/ENTER] để thẩm định', 225, 168, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#c7aa8d',
      });
    }

    drawPixelTextWithShadow(ctx, '[ESC] Quay lại Menu  •  [F1] Mở Bảng Dev Đầy Đủ', LOGIC_WIDTH / 2, 258, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#8e7970',
      align: 'center',
    });
  };

  // VẼ MODAL HỎI CỤ NGHỆ NHÂN (PHÍM T)
  const renderArtisanChatModal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.88)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    drawDialogueBox(ctx, 40, 60, 400, 130, artisanChatTitle, artisanChatText);

    drawPixelTextWithShadow(ctx, 'Bấm [1-4] để hỏi các câu hỏi văn hóa khác  •  Bấm [T] hoặc [ESC] để đóng', LOGIC_WIDTH / 2, 205, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      align: 'center',
    });
  };

  // VẼ MODAL CÀI ĐẶT & TIẾP CẬN TỪ MENU CHÍNH
  const renderSettingsModal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(15, 13, 27, 0.9)';
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);

    const panel = get9SliceCanvas();
    draw9Slice(ctx, panel, 60, 30, 360, 210, 8);

    drawPixelTextWithShadow(ctx, 'CÀI ĐẶT & TIẾP CẬN (ACCESSIBILITY)', LOGIC_WIDTH / 2, 40, {
      font: 'bold 12px "Pixelify Sans", monospace',
      textColor: '#fedb5b',
      align: 'center',
    });

    const settingsItems = [
      `1. ÂM THANH: ${a11y.settings.muted ? 'TẮT (MUTE)' : `BẬT (${a11y.settings.volume}%)`}`,
      `2. GIẢM CHUYỂN ĐỘNG (REDUCE MOTION): ${a11y.settings.reduceMotion ? 'BẬT (Tắt rung lắc)' : 'TẮT'}`,
      `3. ĐỘ TƯƠNG PHẢN CAO (HIGH CONTRAST): ${a11y.settings.highContrast ? 'BẬT' : 'TẮT'}`,
      `4. ĐỘ KHÓ: ${a11y.settings.difficulty === 'de' ? 'THƯ THÁI (7 TIM)' : 'TIÊU CHUẨN (5 TIM)'}`,
      `5. PHÍM CẢM ỨNG ẢO: ${a11y.settings.virtualControls ? 'BẬT' : 'TẮT'}`,
    ];

    settingsItems.forEach((st, idx) => {
      const iy = 68 + idx * 28;
      ctx.fillStyle = '#261b2d';
      ctx.fillRect(80, iy, 320, 24);
      ctx.strokeStyle = '#63534b';
      ctx.strokeRect(80.5, iy + 0.5, 319, 23);

      drawPixelTextWithShadow(ctx, st, 90, iy + 5, {
        font: '9px "Pixelify Sans", monospace',
        textColor: '#fedb5b',
      });
    });

    drawPixelTextWithShadow(ctx, 'Bấm [1 - 5] để chuyển đổi cài đặt  •  Bấm [ESC] để lưu và đóng', LOGIC_WIDTH / 2, 222, {
      font: '9px "Pixelify Sans", monospace',
      textColor: '#c7aa8d',
      align: 'center',
    });
  };

  // XỬ LÝ CLICK CHUỘT VÀ CHẠM TRÊN CANVAS
  const handleLogicClick = (clickX: number, clickY: number) => {
    // 1. CLICK TRONG MENU TẠM DỪNG (PAUSE MENU)
    if (sceneMgr.isPaused) {
      // 1.1 Click nút "TIẾP TỤC" (Resume)
      if (clickX >= 65 && clickX <= 230 && clickY >= 48 && clickY <= 74) {
        handlePauseMenuSelect(0);
        return;
      }
      // 1.2 Click nút "THOÁT VỀ BẢN ĐỒ" (Exit to Map)
      if (clickX >= 250 && clickX <= 415 && clickY >= 48 && clickY <= 74) {
        handlePauseMenuSelect(1);
        return;
      }
      // 1.3 Click dòng Âm thanh
      if (clickX >= 65 && clickX <= 415 && clickY >= 104 && clickY <= 126) {
        handlePauseMenuSelect(2);
        return;
      }
      // 1.4 Click dòng Giảm chuyển động
      if (clickX >= 65 && clickX <= 415 && clickY >= 130 && clickY <= 152) {
        handlePauseMenuSelect(3);
        return;
      }
      // 1.5 Click dòng Tương phản cao
      if (clickX >= 65 && clickX <= 415 && clickY >= 156 && clickY <= 178) {
        handlePauseMenuSelect(4);
        return;
      }
      // 1.6 Click dòng Độ khó
      if (clickX >= 65 && clickX <= 415 && clickY >= 182 && clickY <= 204) {
        handlePauseMenuSelect(5);
        return;
      }
      return;
    }

    // 2. Đóng hộp thoại Hỏi Cụ Nghệ Nhân khi click vào hộp thoại
    if (sceneMgr.isArtisanChatOpen) {
      if (clickX >= 40 && clickX <= 440 && clickY >= 40 && clickY <= 230) {
        sceneMgr.isArtisanChatOpen = false;
        audio.playItemCollect();
        return;
      }
    }

    // 3. Đóng modal Cài đặt khi click vào
    if (sceneMgr.isSettingsModalOpen) {
      if (clickX >= 60 && clickX <= 420 && clickY >= 20 && clickY <= 250) {
        if (clickY >= 68 && clickY <= 92) {
          audio.toggleMute();
          setA11yVersion((v) => v + 1);
        } else if (clickY >= 96 && clickY <= 120) {
          a11y.updateSetting('reduceMotion', !a11y.settings.reduceMotion);
          setA11yVersion((v) => v + 1);
        } else if (clickY >= 124 && clickY <= 148) {
          a11y.updateSetting('highContrast', !a11y.settings.highContrast);
          setA11yVersion((v) => v + 1);
        } else if (clickY >= 152 && clickY <= 176) {
          a11y.updateSetting('difficulty', a11y.settings.difficulty === 'de' ? 'thuong' : 'de');
          setA11yVersion((v) => v + 1);
        } else if (clickY >= 180 && clickY <= 204) {
          a11y.updateSetting('virtualControls', !a11y.settings.virtualControls);
          setA11yVersion((v) => v + 1);
        }
        return;
      }
    }

    // 4. Khi đang trong LEVEL hoặc BOSS: click/chạm vào các nút vẽ trong canvas (Yêu cầu 6)
    if (sceneMgr.currentScene === 'LEVEL' || sceneMgr.currentScene === 'BOSS') {
      // 4.1 Nút "TẠM DỪNG (P)" ở góc trên trái
      if (clickX >= 6 && clickX <= 106 && clickY >= 4 && clickY <= 30) {
        togglePause();
        return;
      }
      // 4.2 Nút "HỎI NGHỆ NHÂN (T)" ở góc trên phải
      if (clickX >= 360 && clickX <= 476 && clickY >= 4 && clickY <= 30) {
        sceneMgr.isArtisanChatOpen = !sceneMgr.isArtisanChatOpen;
        audio.playItemCollect();
        return;
      }
      // 4.3 Khay thẻ ở đáy (x: 176..476, y: 210..268)
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

    // 5. Click trong Title Scene
    if (sceneMgr.currentScene === 'TITLE' && !sceneMgr.isSettingsModalOpen) {
      if (clickX >= 140 && clickX <= 340 && clickY >= 100 && clickY <= 230) {
        const itemIdx = Math.floor((clickY - 100) / 24);
        if (itemIdx >= 0 && itemIdx < titleMenuItems.length) {
          setTitleSelectedIndex(itemIdx);
          handleSelectTitleMenuItem(itemIdx);
        }
      }
    }

    // 6. Click trong Bản Đồ
    if (sceneMgr.currentScene === 'CHAPTER_MAP' && !sceneMgr.isPaused) {
      chapterStages.forEach((s, idx) => {
        const dist = Math.hypot(clickX - s.x, clickY - s.y);
        if (dist <= 18) {
          setMapSelectedIndex(idx);
          handleSelectMapStage(idx);
        }
      });
    }

    // 7. Click trong Màn Ráp Áo
    if (sceneMgr.currentScene === 'RAP_AO') {
      const rap = rapAoRef.current;
      if (clickX >= 35 && clickX <= 175 && clickY >= 112 && clickY <= 248) {
        const pIdx = Math.floor((clickY - 112) / 34);
        if (pIdx >= 0 && pIdx < rap.parts.length) {
          rap.selectPart(rap.parts[pIdx].id);
          audio.playItemCollect();
        }
      }
      if (clickX >= 210 && clickX <= 445 && clickY >= 112 && clickY <= 248) {
        const sIdx = Math.floor((clickY - 112) / 34);
        if (sIdx >= 0 && sIdx < rap.slots.length) {
          const success = rap.placeSelectedPartIntoSlot(rap.slots[sIdx].id);
          if (success) {
            audio.playVictoryFanfare();
          } else {
            audio.playPlayerHurt();
          }
        }
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = Math.floor(((e.clientX - rect.left) / rect.width) * LOGIC_WIDTH);
    const clickY = Math.floor(((e.clientY - rect.top) / rect.height) * LOGIC_HEIGHT);
    handleLogicClick(clickX, clickY);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = Math.floor(((touch.clientX - rect.left) / rect.width) * LOGIC_WIDTH);
      const clickY = Math.floor(((touch.clientY - rect.top) / rect.height) * LOGIC_HEIGHT);
      handleLogicClick(clickX, clickY);
    }
  };

  const handleTouchAction = (action: string, isDown: boolean) => {
    input.setVirtualAction(action as any, isDown);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#0f0d1b] flex items-center justify-center overflow-hidden select-none"
    >
      {/* Canvas 480x270 logic phóng đại theo số nguyên (Math.floor) */}
      <canvas
        ref={canvasRef}
        width={LOGIC_WIDTH}
        height={LOGIC_HEIGHT}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasTouch}
        style={{
          width: `${LOGIC_WIDTH * scale}px`,
          height: `${LOGIC_HEIGHT * scale}px`,
          imageRendering: 'pixelated',
        }}
        className="cursor-pointer shadow-2xl block"
      />

      {/* Lớp phủ nút cảm ứng ảo (Yêu cầu 5: Chỉ hiện khi matchMedia('(pointer: coarse)').matches, trên máy tính ẩn hoàn toàn) */}
      {isCoarsePointer && a11y.settings.virtualControls && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3 select-none">
          {/* Cụm điều khiển ở hai góc dưới (không che nhân vật, Yêu cầu 6: Bỏ nút HTML tạm dừng/hỏi nghệ nhân vì đã vẽ trong canvas) */}
          <div className="flex justify-between items-end pointer-events-auto">
            {/* Góc dưới-trái: Di chuyển Trái/Phải */}
            <div className="flex space-x-2">
              <button
                onPointerDown={() => handleTouchAction('left', true)}
                onPointerUp={() => handleTouchAction('left', false)}
                onPointerLeave={() => handleTouchAction('left', false)}
                className="w-12 h-12 rounded-xl bg-slate-900/85 active:bg-amber-500 active:text-slate-950 border border-amber-400/40 text-amber-200 font-bold text-lg flex items-center justify-center shadow-lg"
              >
                ◀
              </button>
              <button
                onPointerDown={() => handleTouchAction('right', true)}
                onPointerUp={() => handleTouchAction('right', false)}
                onPointerLeave={() => handleTouchAction('right', false)}
                className="w-12 h-12 rounded-xl bg-slate-900/85 active:bg-amber-500 active:text-slate-950 border border-amber-400/40 text-amber-200 font-bold text-lg flex items-center justify-center shadow-lg"
              >
                ▶
              </button>
            </div>

            {/* Góc dưới-phải: Hành động Đánh / Nhảy / Chiêu */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onPointerDown={() => handleTouchAction('jump', true)}
                onPointerUp={() => handleTouchAction('jump', false)}
                className="w-11 h-11 rounded-xl bg-slate-900/85 active:bg-amber-400 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center shadow"
              >
                NHẢY
              </button>
              <button
                onPointerDown={() => handleTouchAction('dodge', true)}
                onPointerUp={() => handleTouchAction('dodge', false)}
                className="w-11 h-11 rounded-xl bg-slate-900/85 active:bg-amber-400 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center shadow"
              >
                NÉ [L]
              </button>
              <button
                onPointerDown={() => handleTouchAction('attack', true)}
                onPointerUp={() => handleTouchAction('attack', false)}
                className="w-11 h-11 rounded-xl bg-amber-600/90 active:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center shadow"
              >
                ĐÁNH [J]
              </button>
              <button
                onPointerDown={() => handleTouchAction('special', true)}
                onPointerUp={() => handleTouchAction('special', false)}
                className="w-11 h-11 rounded-xl bg-teal-600/90 active:bg-teal-300 text-white font-bold text-xs flex items-center justify-center shadow"
              >
                CHIÊU [K]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nút góc mở Dev Panel ẩn */}
      <button
        onClick={onToggleDevPanel}
        className="absolute top-2 right-2 text-[10px] text-slate-700 hover:text-amber-400 opacity-30 hover:opacity-100 transition-all font-mono"
        title="Bấm F1 hoặc nhấn vào đây để mở Bảng Dev"
      >
        [F1: Dev]
      </button>
    </div>
  );
};
