/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DỊCH VỤ SINH ĐOẠN KỂ LỊCH SỬ & ĐẠO LÝ TRANG PHỤC (/api/story)
 * Tổng kết ý nghĩa văn hóa khi hoàn thành màn chơi hoặc ráp xong bộ trang phục.
 */

import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL } from './client.ts';
import { StoryRequest, StoryResponse } from '../validate/storySchema.ts';
import { globalCache } from '../cache.ts';

const FALLBACK_STORY: StoryResponse = {
  title: 'Hồi Sinh Áo Ngũ Thân Cố Đô',
  narrative:
    'Khi mảnh ghép cuối cùng được ráp vào đúng vị trí, ánh hoàng hôn phủ lên tà áo ngũ thân một màu vàng óng ả. Tà áo buông rủ phẳng phiu, năm hạt khuy ngọc thẳng thớm soi bóng bên thềm rồng Điện Thái Hòa. Chiếc áo không chỉ là một kiệt tác dệt may của các nghệ nhân Thừa Thiên, mà còn là bản hòa ca về tình mẫu tử, lòng hiếu thảo và nếp sống đoan chính của tiền nhân.',
  moralLesson:
    'Bốn thân ngoài tượng trưng cho công ơn Tứ thân phụ mẫu; thân thứ năm bên trong tượng trưng cho người con được gia đình yêu thương chở che. Năm chiếc khuy nhắc nhở năm đạo lý làm người: Nhân, Nghĩa, Lễ, Trí, Tín.',
  modernRemixTip:
    'Khi mặc áo ngũ thân trong đời sống hiện đại hoặc sự kiện kỷ yếu, con có thể phối cùng quần lụa trắng hoặc đen, đi kèm giày sneaker tối giản màu trắng/be để vừa thoải mái vận động, vừa tôn vinh nét đẹp truyền thống.',
  historicalEra: 'Triều Nguyễn (Thế kỷ 18 - 19) dưới thời chúa Nguyễn Phúc Khoát và vua Minh Mạng',
  isFallback: true,
};

export async function generateCompletionStory(req: StoryRequest): Promise<StoryResponse> {
  const cacheKey = `story_${req.chapterId}_${req.assembledParts.sort().join('_')}`;
  const cached = globalCache.get<StoryResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const ai = getGeminiClient();
  if (!ai) {
    return FALLBACK_STORY;
  }

  try {
    const prompt = `Bạn là nhà nghiên cứu văn hóa kiêm người kể chuyện lịch sử cho game "Tầm Phục Ký".
Hãy viết một đoạn kết giàu cảm xúc khi người chơi phục dựng thành công trang phục truyền thống:
- Chương: ${req.chapterId} (Áo Ngũ Thân Huế)
- Các bộ phận đã phục dựng: ${req.assembledParts.join(', ') || 'Đầy đủ 4 bộ phận: Thân áo, Cổ đứng, 5 Khuy, Tay chẽn & Quần lụa'}

Yêu cầu định dạng JSON:
- title: Tiêu đề trang trọng, thi vị (ví dụ: "Hồi Sinh Áo Ngũ Thân Cố Đô").
- narrative: 1 đoạn văn kể chuyện hào hùng, giàu hình ảnh miêu tả chiếc áo hoàn thiện tỏa sáng trong hoàng hôn Huế (3-5 câu).
- moralLesson: Bài học đạo lý sâu sắc (Tứ thân phụ mẫu, Ngũ thường).
- modernRemixTip: Lời khuyên thiết thực cho bạn trẻ Gen Z khi mặc hoặc phối cổ phục ngày nay (kỷ yếu, dạo phố, lễ hội).
- historicalEra: Thời kỳ lịch sử và dấu mốc phát triển chính của trang phục này.`;

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
            title: { type: Type.STRING },
            narrative: { type: Type.STRING },
            moralLesson: { type: Type.STRING },
            modernRemixTip: { type: Type.STRING },
            historicalEra: { type: Type.STRING },
          },
          required: ['title', 'narrative', 'moralLesson', 'modernRemixTip', 'historicalEra'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const result: StoryResponse = {
      title: parsed.title || FALLBACK_STORY.title,
      narrative: parsed.narrative || FALLBACK_STORY.narrative,
      moralLesson: parsed.moralLesson || FALLBACK_STORY.moralLesson,
      modernRemixTip: parsed.modernRemixTip || FALLBACK_STORY.modernRemixTip,
      historicalEra: parsed.historicalEra || FALLBACK_STORY.historicalEra,
      isFallback: false,
    };

    globalCache.set(cacheKey, result, 1000 * 60 * 60 * 24); // Cache 24 giờ
    return result;
  } catch (err) {
    console.warn('[Gemini Story API] Gặp lỗi hoặc offline, dùng truyện kể dự phòng:', err);
    return FALLBACK_STORY;
  }
}
