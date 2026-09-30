/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DỊCH VỤ SINH BỐI CẢNH MÀN CHƠI TÍCH HỢP GEMINI & BỘ NHỚ ĐỆM (/api/level)
 */

import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL } from './client.ts';
import { LevelRequest, LevelResponse } from '../validate/levelSchema.ts';
import { globalCache } from '../cache.ts';
import chaptersData from '../../data/chapters.json';

const FALLBACK_LEVEL_META: Record<string, LevelResponse> = {
  'chuong_1_1': {
    themeName: 'Cung Điện Ngọ Môn - Tà Áo Che Chở',
    ambiance: 'Mái ngói lưu ly phủ rêu phong, nắng chiều buông trên Kỳ Đài Huế.',
    artisanQuote: 'Áo ngũ thân không chỉ là manh áo che thân, mà là đạo lý làm người hiếu thảo với mẹ cha.',
    miniBossGreeting: 'Bóng Mờ Vạt Áo: Ngươi nghĩ cổ nhân rảnh rỗi may thêm thân áo thứ năm à?',
    historicalTrivia: 'Áo ngũ thân thời Nguyễn có 4 thân ngoài tượng trưng cho Tứ thân phụ mẫu, 1 thân con bên trong.',
    isFallback: true,
  },
  'chuong_1_2': {
    themeName: 'Bến Đò Sông Hương - Cổ Đứng Ngay Ngắn',
    ambiance: 'Rặng liễu rủ bên dòng Hương giang êm đềm, tiếng chuông chùa Thiên Mụ ngân nga.',
    artisanQuote: 'Cổ áo lập lĩnh cao chừng hai ngón tay, giữ cho đầu cổ luôn ngay ngắn chính trực.',
    miniBossGreeting: 'Yêu Cổ Vẹo: Cổ đứng cứng nhắc quá, bẻ cong đi cho thoải mái chứ!',
    historicalTrivia: 'Cổ đứng lập lĩnh của triều Nguyễn thể hiện sự đoan trang, nghiêm cẩn của người quân tử.',
    isFallback: true,
  },
  'chuong_1_3': {
    themeName: 'Điện Thái Hòa - Đạo Lý Ngũ Thường',
    ambiance: 'Thềm rồng uy nghiêm, hoa văn rồng mây dát vàng rực rỡ.',
    artisanQuote: 'Năm chiếc khuy áo cài sườn phải là lời nhắc nhở hằng ngày về Nhân, Nghĩa, Lễ, Trí, Tín.',
    miniBossGreeting: 'Bóng Khuy Lạc: Nút nào chẳng là nút, cài lộn xộn thì có sao đâu!',
    historicalTrivia: 'Khuy áo ngũ thân thường làm bằng ngọc, bạc, đồng hoặc gỗ quý, cài về bên vạt phải.',
    isFallback: true,
  },
  'chuong_1_4': {
    themeName: 'Lăng Tự Đức - Cánh Tay Chẽn & Quần Lụa',
    ambiance: 'Hồ Lưu Khiêm tĩnh lặng, cầu gạch cổ kính soi bóng tùng bách.',
    artisanQuote: 'Áo ngũ thân phối với quần lụa trắng buông rủ tạo nên dáng vẻ thanh thoát khi di chuyển.',
    miniBossGreeting: 'Quỷ Ống Lệch: Mặc quần short ngắn đi lại ở chốn tôn nghiêm mới phá cách chứ!',
    historicalTrivia: 'Quy ước ăn mặc tại di tích Huế yêu cầu trang phục kín đáo, lịch sự, tôn trọng tiền nhân.',
    isFallback: true,
  },
};

export async function generateLevelAmbiance(req: LevelRequest): Promise<LevelResponse> {
  const cacheKey = `level_${req.chapterId}_${req.levelIndex}_${req.difficulty}`;
  const cached = globalCache.get<LevelResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const fallbackKey = `${req.chapterId}_${req.levelIndex}`;
  const defaultFallback = FALLBACK_LEVEL_META[fallbackKey] || FALLBACK_LEVEL_META['chuong_1_1'];

  const ai = getGeminiClient();
  if (!ai) {
    return defaultFallback;
  }

  try {
    const chapter = chaptersData.find((c) => c.id === req.chapterId);
    const stage = chapter?.cac_man[req.levelIndex - 1];

    const prompt = `Bạn là trợ lý thiết kế bối cảnh cho game pixel art 2D "Tầm Phục Ký".
Hãy tạo không khí, lời dặn của cụ nghệ nhân và câu thoại ngỗ nghịch của mini-boss cho:
- Chương: ${chapter?.ten_trang_phuc || 'Áo Ngũ Thân Huế'}
- Bối cảnh: ${chapter?.boi_canh || 'Cố đô Huế'}
- Màn chơi: ${stage?.ten_manh || 'Màn ' + req.levelIndex}
- Bộ phận trang phục: ${stage?.bo_phan_that || 'Thân áo'}
- Quan niệm sai của mini-boss: ${stage?.mini_boss.quan_niem_sai || 'Áo may lung tung'}
- Độ khó: ${req.difficulty}

Yêu cầu xuất ra JSON với các trường:
- themeName: Tên mỹ miều của màn chơi (tiếng Việt có dấu).
- ambiance: 1 câu văn miêu tả không khí hoàng hôn Cố đô Huế giàu chất thơ.
- artisanQuote: 1 câu dặn dò hiền từ, sâu sắc của cụ nghệ nhân xứ Huế về đạo lý của bộ phận này.
- miniBossGreeting: 1 câu chào khiêu khích hài hước của mini-boss có chứa quan niệm sai.
- historicalTrivia: 1 mẩu tri thức lịch sử ngắn gọn đã được kiểm chứng.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: 'MEDIUM' as any,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeName: { type: Type.STRING },
            ambiance: { type: Type.STRING },
            artisanQuote: { type: Type.STRING },
            miniBossGreeting: { type: Type.STRING },
            historicalTrivia: { type: Type.STRING },
          },
          required: ['themeName', 'ambiance', 'artisanQuote', 'miniBossGreeting', 'historicalTrivia'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const result: LevelResponse = {
      themeName: parsed.themeName || defaultFallback.themeName,
      ambiance: parsed.ambiance || defaultFallback.ambiance,
      artisanQuote: parsed.artisanQuote || defaultFallback.artisanQuote,
      miniBossGreeting: parsed.miniBossGreeting || defaultFallback.miniBossGreeting,
      historicalTrivia: parsed.historicalTrivia || defaultFallback.historicalTrivia,
      isFallback: false,
    };

    globalCache.set(cacheKey, result, 1000 * 60 * 60); // Cache 1 giờ
    return result;
  } catch (err) {
    console.warn('[Gemini Level API] Gặp lỗi hoặc offline, kích hoạt nội dung văn hóa dự phòng:', err);
    return defaultFallback;
  }
}
