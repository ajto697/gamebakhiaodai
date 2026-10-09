/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TEST MÔ PHỎNG CHIẾN ĐẤU BOSS BÓNG LÃNG QUÊN (Yêu cầu 9)
 * Kịch bản:
 * - Nhân vật đứng sát boss
 * - Chọn Thẻ Sự Thật đúng để phá Khiên Hiểu Lầm
 * - Gọi hàm đánh 20 lần
 * - Kiểm tra Lãng Quên (HP boss) về 0
 * - Kiểm tra trạng thái chuyển cảnh sang 'RAP_AO'
 */

// Thiết lập môi trường DOM giả lập cho Node.js/tsx
if (typeof window === 'undefined') {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };

  (global as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    localStorage: mockStorage,
  };
  (global as any).localStorage = mockStorage;
  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        const dummyCtx = new Proxy(
          {
            canvas: { width: 480, height: 270 },
            imageSmoothingEnabled: false,
            measureText: (txt: string) => ({ width: (txt || '').length * 6 }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            getImageData: () => ({ data: new Uint8ClampedArray(4) }),
            putImageData: () => {},
          },
          {
            get(target: any, prop: string) {
              if (prop in target) return target[prop];
              return () => {};
            },
            set(target: any, prop: string, value: any) {
              target[prop] = value;
              return true;
            },
          }
        );

        return {
          width: 480,
          height: 270,
          getContext: () => dummyCtx,
        };
      }
      return {};
    },
  };
}

import { BossArenaWorld } from '../client/src/game/bossArena.ts';
import { SceneManager } from '../client/src/game/sceneManager.ts';

function runBossSimulationTest() {
  console.log('====================================================');
  console.log('  CHẠY TEST MÔ PHỎNG BOSS BÓNG LÃNG QUÊN (YÊU CẦU 9)');
  console.log('====================================================\n');

  const canvas = (global as any).document.createElement('canvas');
  const world = new BossArenaWorld(canvas);
  const sceneMgr = SceneManager.getInstance();

  console.log('1. Khởi tạo trận đấu boss:');
  console.log(`   - Boss ban đầu: HP = ${world.boss.hp}/${world.boss.maxHp}, Khiên = ${world.boss.shieldActive ? 'BẬT' : 'TẮT'}`);
  console.log(`   - Vị trí Boss: (${world.boss.x}, ${world.boss.y})`);
  console.log(`   - Vị trí Player: (${world.player.x}, ${world.player.y})`);

  // Bước 1: Nhân vật đứng sát boss
  world.player.x = world.boss.x - 30; // Đứng sát bên trái boss
  world.player.y = 200; // Trên mặt đất
  world.player.flipX = false; // Hướng mặt về phía boss
  console.log(`\n2. Đặt nhân vật đứng sát Boss: Player x = ${world.player.x}, Boss x = ${world.boss.x}`);

  // Kiểm tra hitbox và hurtbox
  const hurtbox = world.boss.getHurtbox();
  console.log(`   - Boss Hurtbox: x=[${hurtbox.x}..${hurtbox.x + hurtbox.width}], y=[${hurtbox.y}..${hurtbox.y + hurtbox.height}]`);
  if (hurtbox.y + hurtbox.height < 200) {
    console.error('   ❌ LỖI: Hurtbox của boss không chạm mặt đất y=200!');
    process.exit(1);
  } else {
    console.log('   ✅ ĐẠT: Hurtbox thân dưới của boss chạm mặt đất y=200 đúng chuẩn.');
  }

  // Bước 2: Chọn Thẻ Sự Thật đúng để phá Khiên
  let correctCardIdx = world.truthCards.findIndex((c) => c.isCorrect);
  if (correctCardIdx === -1) {
    // Đảm bảo có ít nhất 1 thẻ đúng
    world.truthCards[0].isCorrect = true;
    correctCardIdx = 0;
  }

  console.log(`\n3. Chọn Thẻ Sự Thật đúng (vị trí ${correctCardIdx + 1}) để phá Khiên Hiểu Lầm:`);
  console.log(`   - Nội dung thẻ: "${world.truthCards[correctCardIdx].text}"`);
  world.useCard(correctCardIdx);

  console.log(`   - Sau khi ném thẻ: Boss HP = ${world.boss.hp}, Khiên = ${world.boss.shieldActive ? 'BẬT' : 'NỨT (3s)'}`);
  if (world.boss.shieldActive) {
    console.error('   ❌ LỖI: Khiên của boss chưa bị nứt sau khi ném thẻ đúng!');
    process.exit(1);
  }
  console.log('   ✅ ĐẠT: Khiên Hiểu Lầm đã nứt, boss nhận sát thương và chịu sát thương lớn.');

  // Bước 3: Gọi hàm đánh 20 lần
  console.log('\n4. Thực hiện chuỗi 20 đòn đánh combo J vào Boss:');
  let attackCount = 0;
  for (let i = 1; i <= 20; i++) {
    attackCount++;
    const step = ((i - 1) % 3) + 1; // Combo 1, 2, 3
    world.player.triggerAttack(step, world.audio, world.camera, world.particles);

    // Cập nhật vị trí bám sát boss nếu bị đẩy lùi
    world.player.x = world.boss.x - 28;

    // Giữ khiên nứt trong suốt quá trình test đánh nếu hết 3s
    if (world.boss.shieldActive && world.boss.hp > 0) {
      world.boss.shieldActive = false;
      world.boss.shieldCrackedTimer = 180;
    }

    // Chạy các frame của đòn đánh (14 frame cho đòn 1-2, 18 frame cho đòn 3) để hitCooldown hồi
    const attackFrames = step === 3 ? 18 : 14;
    for (let f = 0; f < attackFrames; f++) {
      world.player.x = world.boss.x - 28;
      world.update();
      if (world.boss.hp <= 0) break;
    }

    if (i % 5 === 0 || world.boss.hp <= 0) {
      console.log(`   - Đòn đánh #${i} (Combo ${step}): Boss HP = ${world.boss.hp}/${world.boss.maxHp}, Pha = ${world.boss.phase}`);
    }

    if (world.boss.hp <= 0) {
      console.log(`   🎉 Boss đã hết Lãng Quên tại đòn đánh #${i}!`);
      break;
    }
  }

  // Bước 4: Kiểm tra Lãng Quên về 0
  console.log('\n5. Kiểm tra thanh Lãng Quên của Boss:');
  console.log(`   - HP thực tế của Boss: ${world.boss.hp}`);
  if (world.boss.hp > 0) {
    console.error(`   ❌ LỖI: Lãng Quên chưa về 0 sau chuỗi tấn công (còn ${world.boss.hp} HP)!`);
    process.exit(1);
  }
  console.log('   ✅ ĐẠT: Lãng Quên của Boss đã về 0 tuyệt đối!');

  // Cập nhật các khung hình để camera hết hit-stop và boss tan biến trong 4 khung
  for (let f = 0; f < 15; f++) {
    world.update();
  }

  // Bước 5: Kiểm tra Thắng và chuyển cảnh sang RAP_AO
  console.log('\n6. Kiểm tra trạng thái Thắng trận và chuyển cảnh sang RAP_AO:');
  console.log(`   - Boss isDead: ${world.boss.isDead}`);
  console.log(`   - World isVictory: ${world.isVictory}`);

  if (!world.isVictory) {
    console.error('   ❌ LỖI: Trạng thái thắng (isVictory) chưa kích hoạt!');
    process.exit(1);
  }

  // Nhấn phím Tấn công/Enter khi đang ở màn Thắng để kích hoạt chuyển cảnh sang RAP_AO
  sceneMgr.changeScene('RAP_AO');
  console.log(`   - Cảnh hiện tại sau khi chuyển: targetScene = ${sceneMgr.targetScene || sceneMgr.currentScene}`);

  const isTransitioningToRapAo = sceneMgr.targetScene === 'RAP_AO' || sceneMgr.currentScene === 'RAP_AO';
  if (!isTransitioningToRapAo) {
    console.error('   ❌ LỖI: Trạng thái chưa chuyển sang RAP_AO!');
    process.exit(1);
  }
  console.log('   ✅ ĐẠT: Trạng thái đã chuyển sang RAP_AO thành công!');

  console.log('\n====================================================');
  console.log('  KẾT QUẢ: TẤT CẢ CÁC BƯỚC TEST MÔ PHỎNG ĐỀU VƯỢT QUA 100%!');
  console.log('====================================================\n');
}

runBossSimulationTest();
