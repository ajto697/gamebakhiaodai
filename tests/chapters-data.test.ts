/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KIỂM THỬ DỮ LIỆU CÁC MÀN CHƠI (CHAPTERS DATA INTEGRITY TEST)
 * Yêu cầu:
 * 1. Mọi the_dung_id và cac_the_can tham chiếu tới thẻ tồn tại trong CÙNG màn.
 * 2. Mỗi màn có ít nhất 2 thẻ học và ít nhất 2 quan niệm sai.
 * 3. Mỗi thẻ học tối đa 140 ký tự, có do_chac_chan và nguon "CẦN KIỂM CHỨNG".
 * 4. Mỗi màn gồm id, dia_diem, manh_ghep, ly_do_trong_truyen, loai_ly_do = "hu_cau".
 */

import fs from 'fs';
import path from 'path';

interface TheHoc {
  id: string;
  noi_dung: string;
  do_chac_chan: string;
  nguon: string;
}

interface QuaiHieuLam {
  id: string;
  ten: string;
  quan_niem_sai: string;
  the_dung_id: string;
}

interface MiniBoss {
  ten: string;
  quan_niem_sai: string;
  cac_the_can: string[];
  khien_hieu_lam?: boolean;
}

interface ManChoi {
  id: string;
  dia_diem: string;
  manh_ghep: string;
  ly_do_trong_truyen: string;
  loai_ly_do: string;
  the_hoc: TheHoc[];
  quai_hieu_lam: QuaiHieuLam[];
  mini_boss: MiniBoss;
}

interface Chuong {
  id: string;
  ten_trang_phuc: string;
  mo_ta: string;
  cac_man: ManChoi[];
}

function runChaptersDataTests(): void {
  console.log('====================================================');
  console.log('  CHẠY KIỂM THỬ TÍNH TOÀN VẸN DỮ LIỆU CHAPTERS.JSON');
  console.log('====================================================\n');

  const chaptersPath = path.resolve(process.cwd(), 'data/chapters.json');
  if (!fs.existsSync(chaptersPath)) {
    console.error('❌ KHÔNG tìm thấy file data/chapters.json tại:', chaptersPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(chaptersPath, 'utf-8');
  const chapters: Chuong[] = JSON.parse(raw);

  let passedTests = 0;
  let failedTests = 0;

  if (!Array.isArray(chapters) || chapters.length === 0) {
    console.error('❌ chapters.json phải là mảng không rỗng');
    process.exit(1);
  }

  chapters.forEach((chuong) => {
    console.log(`Kiểm tra Chương [${chuong.id}]: ${chuong.ten_trang_phuc}`);

    if (!chuong.cac_man || !Array.isArray(chuong.cac_man) || chuong.cac_man.length === 0) {
      console.error(`❌ Chương ${chuong.id} không có danh sách các màn hợp lệ`);
      failedTests++;
      return;
    }

    chuong.cac_man.forEach((man) => {
      console.log(`  -> Kiểm tra Màn [${man.id}] tại [${man.dia_diem}] - Mảnh: [${man.manh_ghep}]`);

      // 1. Kiểm tra các trường bắt buộc
      if (!man.id || typeof man.id !== 'string') {
        console.error(`    ❌ [FAIL] Màn thiếu trường id`);
        failedTests++;
      } else {
        passedTests++;
      }

      if (!man.dia_diem || typeof man.dia_diem !== 'string') {
        console.error(`    ❌ [FAIL] ${man.id}: thiếu trường dia_diem`);
        failedTests++;
      } else {
        passedTests++;
      }

      const knownParts = ['part_nguthan_than', 'part_nguthan_co', 'part_nguthan_khuy', 'part_nguthan_tay'];
      if (!man.manh_ghep || typeof man.manh_ghep !== 'string') {
        console.error(`    ❌ [FAIL] ${man.id}: thiếu trường manh_ghep`);
        failedTests++;
      } else if (!knownParts.includes(man.manh_ghep)) {
        console.error(`    ❌ [FAIL] ${man.id}: manh_ghep "${man.manh_ghep}" không nằm trong danh sách cấu tạo đã có: ${knownParts.join(', ')}`);
        failedTests++;
      } else {
        passedTests++;
      }

      if (!man.ly_do_trong_truyen || typeof man.ly_do_trong_truyen !== 'string') {
        console.error(`    ❌ [FAIL] ${man.id}: thiếu trường ly_do_trong_truyen`);
        failedTests++;
      } else {
        passedTests++;
      }

      if (man.loai_ly_do !== 'hu_cau') {
        console.error(`    ❌ [FAIL] ${man.id}: loai_ly_do phải là "hu_cau", nhận: "${man.loai_ly_do}"`);
        failedTests++;
      } else {
        passedTests++;
      }

      // 2. Kiểm tra the_hoc (ít nhất 2 thẻ học, tối đa 140 ký tự, có do_chac_chan, nguon "CẦN KIỂM CHỨNG")
      if (!man.the_hoc || !Array.isArray(man.the_hoc) || man.the_hoc.length < 2) {
        console.error(`    ❌ [FAIL] ${man.id}: the_hoc phải có ít nhất 2 thẻ học (hiện có: ${man.the_hoc?.length})`);
        failedTests++;
      } else {
        passedTests++;
      }

      const validCardIds = new Set<string>();

      man.the_hoc.forEach((card, cIdx) => {
        if (!card.id) {
          console.error(`    ❌ [FAIL] ${man.id}: Thẻ học #${cIdx + 1} thiếu id`);
          failedTests++;
        } else {
          validCardIds.add(card.id);
          passedTests++;
        }

        if (!card.noi_dung || typeof card.noi_dung !== 'string') {
          console.error(`    ❌ [FAIL] ${man.id}: Thẻ [${card.id}] thiếu noi_dung`);
          failedTests++;
        } else if (card.noi_dung.length > 140) {
          console.error(`    ❌ [FAIL] ${man.id}: Thẻ [${card.id}] vượt quá 140 ký tự (${card.noi_dung.length} ký tự): "${card.noi_dung}"`);
          failedTests++;
        } else {
          passedTests++;
        }

        if (!card.do_chac_chan) {
          console.error(`    ❌ [FAIL] ${man.id}: Thẻ [${card.id}] thiếu do_chac_chan`);
          failedTests++;
        } else {
          passedTests++;
        }

        if (!card.nguon || !card.nguon.includes('CẦN KIỂM CHỨNG')) {
          console.error(`    ❌ [FAIL] ${man.id}: Thẻ [${card.id}] nguon phải có "CẦN KIỂM CHỨNG" (hiện tại: "${card.nguon}")`);
          failedTests++;
        } else {
          passedTests++;
        }
      });

      // 3. Kiểm tra quai_hieu_lam (mỗi quái có quan_niem_sai và the_dung_id tham chiếu tới thẻ học CÙNG màn)
      if (!man.quai_hieu_lam || !Array.isArray(man.quai_hieu_lam) || man.quai_hieu_lam.length < 2) {
        console.error(`    ❌ [FAIL] ${man.id}: quai_hieu_lam phải có ít nhất 2 quái (hiện có: ${man.quai_hieu_lam?.length})`);
        failedTests++;
      } else {
        passedTests++;
      }

      man.quai_hieu_lam.forEach((quai) => {
        if (!quai.quan_niem_sai) {
          console.error(`    ❌ [FAIL] ${man.id}: Quái [${quai.id}] thiếu quan_niem_sai`);
          failedTests++;
        } else {
          passedTests++;
        }

        if (!quai.the_dung_id) {
          console.error(`    ❌ [FAIL] ${man.id}: Quái [${quai.id}] thiếu the_dung_id`);
          failedTests++;
        } else if (!validCardIds.has(quai.the_dung_id)) {
          console.error(`    ❌ [FAIL] ${man.id}: Quái [${quai.id}] the_dung_id "${quai.the_dung_id}" KHÔNG tồn tại trong the_hoc của CÙNG màn!`);
          failedTests++;
        } else {
          passedTests++;
        }
      });

      // 4. Kiểm tra mini_boss (quan_niem_sai và cac_the_can tham chiếu tới thẻ CÙNG màn)
      if (!man.mini_boss) {
        console.error(`    ❌ [FAIL] ${man.id}: Thiếu mini_boss`);
        failedTests++;
      } else {
        if (!man.mini_boss.quan_niem_sai) {
          console.error(`    ❌ [FAIL] ${man.id}: mini_boss thiếu quan_niem_sai`);
          failedTests++;
        } else {
          passedTests++;
        }

        if (!man.mini_boss.cac_the_can || !Array.isArray(man.mini_boss.cac_the_can) || man.mini_boss.cac_the_can.length === 0) {
          console.error(`    ❌ [FAIL] ${man.id}: mini_boss cac_the_can phải là mảng id không rỗng`);
          failedTests++;
        } else {
          man.mini_boss.cac_the_can.forEach((cardId) => {
            if (!validCardIds.has(cardId)) {
              console.error(`    ❌ [FAIL] ${man.id}: mini_boss cac_the_can "${cardId}" KHÔNG tồn tại trong the_hoc của CÙNG màn!`);
              failedTests++;
            } else {
              passedTests++;
            }
          });
        }
      }

      // 5. Kiểm tra tổng số quan niệm sai >= 2
      const totalMisconceptions = (man.quai_hieu_lam?.length || 0) + (man.mini_boss ? 1 : 0);
      if (totalMisconceptions < 2) {
        console.error(`    ❌ [FAIL] ${man.id}: Tổng số quan niệm sai phải >= 2 (hiện có: ${totalMisconceptions})`);
        failedTests++;
      } else {
        passedTests++;
      }
    });
  });

  console.log(`\n====================================================`);
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passedTests} passed, ${failedTests} failed`);
  console.log(`====================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runChaptersDataTests();
