/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Test Runner for 25 cultural outfit evaluation test cases
 */

import fs from 'fs';
import path from 'path';
import { evaluateOutfitRuleBased } from '../server/rules.ts';
import { judgeResponseSchema } from '../server/validate/judgeSchema.ts';

interface TestCase {
  id: string;
  mo_ta: string;
  loai: string;
  input: {
    event: string;
    outfit: {
      ao: string;
      quan_vay: string;
      phu_kien: string[];
      mau_sac: string;
      phong_cach: string;
    };
  };
  mong_doi: {
    den: 'xanh' | 'vang' | 'do';
    diem_ton_trong_min?: number;
    diem_hoa_hop_min?: number;
  };
}

function runTests() {
  console.log('====================================================');
  console.log('  CHẠY KIỂM THỬ 25 CA ĐÁNH GIÁ TRANG PHỤC & VĂN HÓA');
  console.log('  (Game: Tầm Phục Ký - Việt Phục Remix)');
  console.log('====================================================\n');

  const casesPath = path.resolve(process.cwd(), 'tests/cases.json');
  if (!fs.existsSync(casesPath)) {
    console.error('Không tìm thấy file cases.json tại:', casesPath);
    process.exit(1);
  }

  const casesRaw = fs.readFileSync(casesPath, 'utf-8');
  const testCases: TestCase[] = JSON.parse(casesRaw);

  let passedCount = 0;
  let failedCount = 0;

  testCases.forEach((tc, index) => {
    const result = evaluateOutfitRuleBased(tc.input.event, tc.input.outfit);

    // 1. Kiểm tra Schema Validation với Zod
    const schemaValidation = judgeResponseSchema.safeParse(result);
    if (!schemaValidation.success) {
      console.error(`[FAIL SCHEMA] ${tc.id}: Schema validation thất bại:`, schemaValidation.error.format());
      failedCount++;
      return;
    }

    // 2. So sánh kết quả thực tế với mong đợi
    const passDen = result.den === tc.mong_doi.den;
    const passDiemTonTrong = !tc.mong_doi.diem_ton_trong_min || result.diem_ton_trong >= tc.mong_doi.diem_ton_trong_min;
    const passDiemHoaHop = !tc.mong_doi.diem_hoa_hop_min || result.diem_hoa_hop >= tc.mong_doi.diem_hoa_hop_min;

    if (passDen && passDiemTonTrong && passDiemHoaHop) {
      passedCount++;
      console.log(`[PASS] ${tc.id} (${tc.loai}): ${tc.mo_ta}`);
      console.log(`       -> Đèn: [${result.den.toUpperCase()}] | Hòa hợp: ${result.diem_hoa_hop} | Tôn trọng: ${result.diem_ton_trong}`);
    } else {
      failedCount++;
      console.log(`[FAIL] ${tc.id}: ${tc.mo_ta}`);
      console.log(`       -> Kỳ vọng đèn: ${tc.mong_doi.den}, Thực tế: ${result.den}`);
      if (!passDiemTonTrong) {
        console.log(`       -> Điểm tôn trọng kỳ vọng >= ${tc.mong_doi.diem_ton_trong_min}, Thực tế: ${result.diem_ton_trong}`);
      }
      if (!passDiemHoaHop) {
        console.log(`       -> Điểm hòa hợp kỳ vọng >= ${tc.mong_doi.diem_hoa_hop_min}, Thực tế: ${result.diem_hoa_hop}`);
      }
    }
  });

  console.log('\n----------------------------------------------------');
  console.log(`Tổng kết: ${passedCount}/${testCases.length} ca kiểm thử đạt chuẩn.`);
  if (failedCount > 0) {
    console.error(`Có ${failedCount} ca chưa đạt. Cần tinh chỉnh luật.`);
    process.exit(1);
  } else {
    console.log('Tất cả 25 ca kiểm thử đều VƯỢT QUA thành công 100%!');
  }
}

runTests();
