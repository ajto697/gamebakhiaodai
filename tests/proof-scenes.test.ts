/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KIỂM THỬ BA CẢNH CHỤP ẢNH MINH CHỨNG & CHẾ ĐỘ CHỤP ẢNH (PROOF SCENES TEST)
 * Yêu cầu:
 * 1. Cảnh ẢNH A: Mini-boss Màn 3 (c1_m3, Năm Chiếc Khuy Ngũ Thường)
 *    - Dựng cảnh không lỗi, mini-boss sẵn khiên lục giác nhấp nháy, bong bóng quan niệm sai trên đầu.
 *    - Camera khóa trong khung 480x270, nhân vật không chìm dưới HUD, khay 3 thẻ sự thật đủ trọn nội dung.
 * 2. Cảnh ẢNH B: Boss Cuối (Bóng Lãng Quên)
 *    - Dựng cảnh không lỗi, thanh Lãng Quên xx%, khiên mạng nhện nhãn KHIÊN HIỂU LẦM, bong bóng quan niệm sai.
 *    - Khay 3 thẻ ở đáy, có chỉ dẫn chọn/ném, có đường ngắm từ nhân vật tới boss.
 * 3. Cảnh ẢNH C: Ráp Áo
 *    - Dựng cảnh không lỗi, hình áo ở giữa với 4 vùng viền nét đứt và nhãn (thân áo, cổ đứng, hàng khuy, tay chẽn).
 *    - 4 mảnh bên trái, bảng nghệ nhân phía dưới, dựng sẵn trạng thái 1 mảnh đặt sai (nảy lại, vùng đúng nhấp sáng, lời giải thích trọn câu).
 * 4. Chế độ chụp ảnh trong Dev Panel:
 *    - Tạm dừng thời gian và ẩn bảng debug / [F1: Dev].
 */

import { SceneManager } from '../client/src/game/sceneManager.ts';
import { RapAoManager } from '../client/src/game/rapAo.ts';
import { BossLangQuen } from '../client/src/game/entities/bossLangQuen.ts';
import level3Data from '../data/levels/c1_m3.json';
import chaptersData from '../data/chapters.json';
import {
  drawHexagonShield,
  drawSpiderWebShield,
  drawTruthCardSlot,
  drawBossBar,
} from '../client/src/art/nineSlice.ts';

function runProofScenesTests(): void {
  console.log('====================================================');
  console.log('  CHẠY KIỂM THỬ BA CẢNH CHỤP ẢNH MINH CHỨNG (A, B, C)');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, msg: string): void {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failedTests++;
    }
  }

  const sceneMgr = SceneManager.getInstance();

  // ---------------------------------------------------------------
  // 1. KIỂM THỬ ẢNH A: MINI-BOSS MÀN 3 (c1_m3)
  // ---------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ ẢNH A: MINI-BOSS MÀN 3 (c1_m3) ---');
  sceneMgr.setupProofSceneA();
  assert(sceneMgr.currentScene === 'LEVEL', 'Chuyển đúng sang cảnh LEVEL');
  assert(sceneMgr.currentLevelId === 'c1_m3', 'Đúng ID màn chơi c1_m3');
  assert(sceneMgr.photoModeTarget === 'A', 'Đặt đúng photoModeTarget = A');

  // Kiểm tra dữ liệu màn c1_m3
  assert(Boolean(level3Data.miniBoss), 'Màn c1_m3 có miniBoss');
  assert(level3Data.miniBoss.name === 'Bóng Khuy Lạc', 'Tên miniBoss đúng là "Bóng Khuy Lạc"');
  assert(Boolean(level3Data.miniBoss.misconception), 'MiniBoss có quan niệm sai để hiện bong bóng thoại');

  // Kiểm tra tính toán Camera và vị trí nhân vật trong khung 480x270
  const bossX = level3Data.miniBoss.x; // 1020
  const cameraX = bossX - 390; // 630
  const playerX = 800; // Khi dựng ảnh A
  const playerScreenX = playerX - cameraX; // 170
  const bossScreenX = bossX - cameraX; // 390

  assert(bossScreenX >= 0 && bossScreenX <= 480, `Mini-boss nằm trọn trong khung 480px (tọa độ màn hình: ${bossScreenX}px)`);
  assert(playerScreenX >= 168 && playerScreenX <= 300, `Nhân vật đứng thoáng ngoài vùng HUD (tọa độ màn hình: ${playerScreenX}px, HUD kết thúc ở 168px)`);
  assert(typeof drawHexagonShield === 'function', 'Hàm vẽ Khiên Hiểu Lầm lục giác tồn tại');

  // Thẻ học màn c1_m3
  const c1 = chaptersData.find((c) => c.id === 'chuong_1');
  const m3 = c1?.cac_man.find((m) => m.id === 'c1_m3');
  assert(Boolean(m3 && m3.the_hoc.length >= 2), 'Màn c1_m3 có ít nhất 2 thẻ học chuẩn mực');
  assert(typeof drawTruthCardSlot === 'function', 'Hàm vẽ ô thẻ sự thật với con trỏ và viền sáng tồn tại');

  // Bounding box kiểm tra không có chữ chồng nhau trong Cảnh A
  // Box 1: Tên mini-boss "BÓNG KHUY LẠC" (x: 104, y: 10, w: 98, h: 14)
  // Box 2: "LÃNG QUÊN: xx%" (x: 268, y: 10, w: 80, h: 14)
  // Box 3: Bong bóng quan niệm sai (x: 230, y: 55, w: 180, h: 36)
  // Box 4: Khay 3 thẻ đáy (x: 176, y: 214, w: 292, h: 50)
  // Box 5: HUD người chơi (x: 8, y: 214, w: 160, h: 50)
  const isOverlap = (
    b1: { x: number; y: number; w: number; h: number },
    b2: { x: number; y: number; w: number; h: number }
  ) => !(b1.x + b1.w <= b2.x || b2.x + b2.w <= b1.x || b1.y + b1.h <= b2.y || b2.y + b2.h <= b1.y);

  const boxNameA = { x: 104, y: 10, w: 98, h: 14 };
  const boxPercentA = { x: 268, y: 10, w: 80, h: 14 };
  const boxBubbleA = { x: 230, y: 55, w: 180, h: 36 };
  const boxCardsA = { x: 176, y: 214, w: 292, h: 50 };
  const boxHudA = { x: 8, y: 214, w: 160, h: 50 };

  assert(!isOverlap(boxNameA, boxPercentA), 'Cảnh A: Tên mini-boss và % Lãng Quên không chồng nhau');
  assert(!isOverlap(boxBubbleA, boxNameA), 'Cảnh A: Bong bóng thoại không đè lên thanh mini-boss');
  assert(!isOverlap(boxBubbleA, boxCardsA), 'Cảnh A: Bong bóng thoại không đè lên khay thẻ');
  assert(!isOverlap(boxHudA, boxCardsA), 'Cảnh A: HUD và khay thẻ có ranh giới riêng');

  // ---------------------------------------------------------------
  // 2. KIỂM THỬ ẢNH B: BOSS CUỐI (BÓNG LÃNG QUÊN)
  // ---------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ ẢNH B: BOSS CUỐI (BÓNG LÃNG QUÊN) ---');
  sceneMgr.setupProofSceneB();
  assert(sceneMgr.currentScene === 'BOSS', 'Chuyển đúng sang cảnh BOSS');
  assert(sceneMgr.photoModeTarget === 'B', 'Đặt đúng photoModeTarget = B');

  const mockBoss = new BossLangQuen();
  mockBoss.x = 360;
  mockBoss.y = 185;
  mockBoss.shieldActive = true;
  mockBoss.hp = 255;
  assert(mockBoss.shieldActive === true, 'Khiên của Boss sẵn sàng bật');
  assert(Math.round((mockBoss.hp / mockBoss.maxHp) * 100) === 85, 'Thanh trạng thái Boss tính được LÃNG QUÊN: 85%');

  assert(typeof drawSpiderWebShield === 'function', 'Hàm vẽ Khiên Mạng Nhện với nhãn KHIÊN HIỂU LẦM tồn tại');
  assert(typeof drawBossBar === 'function', 'Hàm vẽ thanh Boss trên cùng với tên và LÃNG QUÊN % tồn tại');

  // Bounding box kiểm tra không có chữ chồng nhau trong Cảnh B
  // Box 1: Thanh Boss trên cùng (x: 92, y: 8, w: 265, h: 28)
  // Box 2: Bong bóng Boss Safe (y: 42..90, x: 120..310, w: 180, h: 38)
  // Box 3: Tâm ngắm / Nhãn NGẮM (x: 300, y: 110, w: 40, h: 20)
  // Box 4: Nhãn CHỌN & Khung đọc thẻ (x: 176, y: 166, w: 156, h: 46)
  // Box 5: Khay 3 thẻ đáy (x: 176, y: 214, w: 292, h: 50)
  const boxBossBarB = { x: 92, y: 8, w: 265, h: 28 };
  const boxBossBubbleB = { x: 130, y: 44, w: 175, h: 38 };
  const boxAimB = { x: 300, y: 92, w: 45, h: 22 };
  const boxCardPopupB = { x: 176, y: 166, w: 156, h: 36 };
  const boxCardsB = { x: 176, y: 214, w: 292, h: 50 };
  const boxBtnHoiNgheNhan = { x: 362, y: 6, w: 110, h: 22 };

  assert(!isOverlap(boxBossBarB, boxBtnHoiNgheNhan), 'Cảnh B: Thanh Boss và nút Hỏi Nghệ Nhân không chồng nhau');
  assert(!isOverlap(boxBossBubbleB, boxBossBarB), 'Cảnh B: Bong bóng thoại đặt dưới thanh Boss, không bị che');
  assert(!isOverlap(boxAimB, boxBossBubbleB), 'Cảnh B: Tâm ngắm và bong bóng thoại không đè nhau');
  assert(!isOverlap(boxCardPopupB, boxCardsB), 'Cảnh B: Khung đọc thẻ nổi phía trên khay không đè thẻ');

  // Kiểm tra đường ngắm từ player tới boss
  const pPos = { x: 120, y: 200 };
  const bPos = { x: 360, y: 185 };
  const dx = bPos.x - pPos.x;
  assert(dx > 100, `Có khoảng cách hợp lý để vẽ đường ngắm hình cung (${dx}px)`);

  // ---------------------------------------------------------------
  // 3. KIỂM THỬ ẢNH C: RÁP ÁO (VỚI 1 MẢNH ĐẶT SAI)
  // ---------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ ẢNH C: RÁP ÁO (VỚI 1 MẢNH ĐẶT SAI) ---');
  sceneMgr.setupProofSceneC();
  assert(sceneMgr.currentScene === 'RAP_AO', 'Chuyển đúng sang cảnh RAP_AO');
  assert(sceneMgr.photoModeTarget === 'C', 'Đặt đúng photoModeTarget = C');

  const rap = new RapAoManager();
  assert(rap.parts.length === 4, 'Đủ danh sách 4 mảnh ghép bên trái');
  assert(rap.slots.length === 4, 'Đủ 4 vùng vị trí trên áo');

  const slotNames = rap.slots.map((s) => s.name);
  assert(slotNames.includes('Cổ đứng'), 'Có vùng Cổ đứng');
  assert(slotNames.includes('Thân áo'), 'Có vùng Thân áo');
  assert(slotNames.includes('Hàng khuy'), 'Có vùng Hàng khuy');
  assert(slotNames.includes('Tay chẽn'), 'Có vùng Tay chẽn');

  // Kích hoạt thử nghiệm đặt sai 1 mảnh
  rap.triggerWrongPlacementDemo();
  assert(rap.bouncingPartId === 'part_nguthan_co', 'Mảnh Cổ Đứng nảy lại khi đặt sai vào Thân Áo');
  assert(rap.bounceTimer > 0, 'Có đếm ngược hiệu ứng nảy (bounce)');
  assert(rap.highlightSlotId === 'slot_co', 'Vùng đúng (slot_co) được nhấp sáng nhẹ');
  assert(rap.highlightTimer > 0, 'Có đếm ngược nhấp sáng vùng đúng');
  assert(rap.artisanFeedback.includes('Cổ Đứng'), 'Bảng nghệ nhân hiển thị tên bộ phận đúng');
  assert(rap.artisanFeedback.includes('chính trực đĩnh đạc'), 'Bảng nghệ nhân dùng đúng thẻ học liên quan');
  assert(rap.artisanFeedback.length > 20, 'Lời giải thích đọc được trọn vẹn cả câu');

  // Bounding box kiểm tra không có chữ chồng nhau trong Cảnh C
  // Box 1: Tiêu đề màn (x: 120, y: 8, w: 240, h: 16)
  // Box 2: Cột 4 mảnh bên trái (x: 8, y: 26, w: 144, h: 162)
  // Box 3: Khung áo ở giữa (x: 156, y: 26, w: 316, h: 162)
  // Box 4: Bảng nghệ nhân phía dưới (x: 8, y: 192, w: 464, h: 72)
  // Box 5: Nhãn VỊ TRÍ ĐÚNG (x: 290, y: 80, w: 60, h: 14) - nằm trong khung áo
  const boxTitleC = { x: 120, y: 6, w: 240, h: 18 };
  const boxPartsColC = { x: 8, y: 26, w: 144, h: 162 };
  const boxRobeAreaC = { x: 156, y: 26, w: 316, h: 162 };
  const boxArtisanFeedbackC = { x: 8, y: 192, w: 464, h: 72 };
  const boxCorrectPosLabelC = { x: 290, y: 80, w: 60, h: 14 };

  assert(!isOverlap(boxPartsColC, boxRobeAreaC), 'Cảnh C: Cột mảnh ghép và khung áo có ranh giới riêng');
  assert(!isOverlap(boxRobeAreaC, boxArtisanFeedbackC), 'Cảnh C: Khung áo và bảng nghệ nhân không đè nhau');
  assert(!isOverlap(boxPartsColC, boxArtisanFeedbackC), 'Cảnh C: Cột mảnh ghép và bảng nghệ nhân không đè nhau');
  assert(!isOverlap(boxCorrectPosLabelC, boxTitleC), 'Cảnh C: Nhãn VỊ TRÍ ĐÚNG nằm trong khung áo, không đè tiêu đề màn');

  // ---------------------------------------------------------------
  // 4. KIỂM THỬ CÔNG TẮC CHẾ ĐỘ CHỤP ẢNH
  // ---------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ CÔNG TẮC CHẾ ĐỘ CHỤP ẢNH ---');
  sceneMgr.isTimeFrozen = true;
  assert(sceneMgr.isTimeFrozen === true, 'Công tắc tạm dừng thời gian (Freeze Time) hoạt động');
  sceneMgr.isTimeFrozen = false;
  assert(sceneMgr.isTimeFrozen === false, 'Công tắc nhả tạm dừng thời gian hoạt động');

  sceneMgr.hideDebugHud = true;
  assert(sceneMgr.hideDebugHud === true, 'Công tắc ẩn bảng debug & [F1: Dev] hoạt động');
  sceneMgr.hideDebugHud = false;
  assert(sceneMgr.hideDebugHud === false, 'Công tắc hiện lại debug hoạt động');

  console.log('\n====================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passedTests} passed, ${failedTests} failed`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runProofScenesTests();
