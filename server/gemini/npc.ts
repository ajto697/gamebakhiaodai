/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DỊCH VỤ ĐỐI THOẠI CỤ NGHỆ NHÂN CỐ ĐÔ TÍCH HỢP GEMINI (/api/npc)
 * Grounding 13 mục tri thức lịch sử từ knowledge.json, có bộ nhớ đệm và fallback ngoại tuyến.
 */

import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL } from './client.ts';
import { NpcRequest, NpcResponse } from '../validate/npcSchema.ts';
import { globalCache } from '../cache.ts';
import knowledgeData from '../../data/knowledge.json';

/**
 * Trả lời dự phòng bằng quy tắc nếu offline hoặc không có API key
 */
function getFallbackArtisanResponse(q: string): NpcResponse {
  const lower = q.toLowerCase();

  if (lower.includes('ngũ thân') || lower.includes('5 thân') || lower.includes('nam')) {
    return {
      answer:
        'Áo ngũ thân là chuẩn mực trang phục truyền thống của người Việt, được hoàn thiện quy củ dưới thời chúa Nguyễn Phúc Khoát và vua Minh Mạng. Bốn thân ngoài tượng trưng cho Tứ thân phụ mẫu, thân thứ năm nằm kín đáo bên trong tượng trưng cho người mặc được chở che. Năm chiếc khuy cài nhắc nhở đạo hiếu và Ngũ Thường (Nhân - Nghĩa - Lễ - Trí - Tín) đó con!',
      tone: 'am_ap',
      references: ['knowledge.json#ao_ngu_than', 'Nghiên cứu Trần Đình Sơn'],
      relatedKnowledgeId: 'ao_ngu_than',
      isFallback: true,
    };
  }

  if (lower.includes('nón bài thơ') || lower.includes('nón lá') || lower.includes('nón huế')) {
    return {
      answer:
        'Nón bài thơ xứ Huế là một kiệt tác thủ công độc đáo. Chiếc nón có đúng 16 vành tre uốn cong tinh tế. Giữa hai lớp lá nón mỏng trắng ngà, người nghệ nhân làng Chuồn hay Dạ Lê khéo léo chèn vào những câu thơ hoặc hình ảnh cầu Tràng Tiền, chùa Thiên Mụ; chỉ khi soi lên ánh mặt trời mới hiện rõ bóng thơ.',
      tone: 'am_ap',
      references: ['knowledge.json#non_bai_tho', 'Làng nón Tây Hồ, Huế'],
      relatedKnowledgeId: 'non_bai_tho',
      isFallback: true,
    };
  }

  if (lower.includes('áo dài') || lower.includes('lemur') || lower.includes('nữ sinh')) {
    return {
      answer:
        'Áo dài hiện đại chính là sự kế thừa và cách tân tuyệt đẹp từ áo ngũ thân lập lĩnh thế kỷ 18-19. Đến thập niên 1930, họa sĩ Le Mur Nguyễn Cát Tường và Lê Phổ đã tinh giản thành hai tà trước sau buông thướt tha, tôn vinh nét duyên dáng thanh lịch của người phụ nữ Việt Nam.',
      tone: 'am_ap',
      references: ['knowledge.json#ao_dai', 'Lịch sử trang phục Việt Nam'],
      relatedKnowledgeId: 'ao_dai',
      isFallback: true,
    };
  }

  if (lower.includes('di tích') || lower.includes('đại nội') || lower.includes('chùa') || lower.includes('ngắn')) {
    return {
      answer:
        'Chốn Hoàng thành, lăng tẩm và đền chùa là không gian tôn nghiêm của tiền nhân. Đến đây, con cần mặc trang phục kín đáo, có tay, quần hoặc váy dài quá gối, không mặc áo hai dây hay quần short ngắn để bày tỏ lòng trân trọng với di sản văn hóa tổ tiên.',
      tone: 'trang_trong',
      references: ['knowledge.json#quy_uoc_di_tich', 'Nội quy Trung tâm BTDTCĐ Huế'],
      relatedKnowledgeId: 'quy_uoc_di_tich',
      isFallback: true,
    };
  }

  if (lower.includes('sneaker') || lower.includes('giày') || lower.includes('remix') || lower.includes('gen z')) {
    return {
      answer:
        'Tuổi trẻ các con sáng tạo là điều rất đáng quý! Khi chụp kỷ yếu hay dạo phố, phối áo dài ngũ thân với giày sneaker trắng tối giản vừa năng động, vừa giữ được sự trang nhã. Miễn là con không cắt xẻ làm biến dạng phom dáng gốc là trang phục vẫn giữ được cái hồn cổ truyền.',
      tone: 'am_ap',
      references: ['knowledge.json#ao_dai', 'Xu hướng Việt phục trẻ'],
      relatedKnowledgeId: 'ao_dai',
      isFallback: true,
    };
  }

  // Câu trả lời tổng quát
  return {
    answer:
      'Cổ phục Việt Nam là cả một kho tàng tri thức và nhân sinh quan sâu sắc của tiền nhân. Mỗi nếp áo, đường kim, hạt khuy đều gắn liền với nếp sống văn minh và tinh thần hòa ái của dân tộc ta.',
    tone: 'am_ap',
    references: ['knowledge.json'],
    isFallback: true,
  };
}

export async function askArtisanNPC(req: NpcRequest): Promise<NpcResponse> {
  const cacheKey = `npc_${req.question.trim().toLowerCase()}`;
  const cached = globalCache.get<NpcResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const defaultFallback = getFallbackArtisanResponse(req.question);
  const ai = getGeminiClient();
  if (!ai) {
    return defaultFallback;
  }

  try {
    const knowledgeSummary = knowledgeData
      .map((k) => `[${k.id}] ${k.ten} (${k.vung}): ${k.mo_ta_ngan} | Ý nghĩa: ${k.y_nghia} | Lưu ý: ${k.luu_y_phoi}`)
      .join('\n');

    const prompt = `Bạn là "Cụ Nghệ Nhân May Đo Cổ Phục Cố Đô Huế" - một nghệ nhân lão thành 80 tuổi, hiền hậu, uyên bác về di sản trang phục triều Nguyễn và phong tục Việt Nam.
Giọng điệu: Thân mật, ấm áp, xưng "ta", gọi người hỏi là "con". Giảng giải cặn kẽ, nhẹ nhàng, không phán xét, đề cao sự trân trọng văn hóa.

Dữ liệu tri thức lịch sử đối chiếu bắt buộc:
${knowledgeSummary}

Câu hỏi của người chơi: "${req.question}"
${req.context ? `Bối cảnh: ${req.context}` : ''}

Quy tắc:
1. Trả lời đúng sự thật lịch sử dựa trên tài liệu cung cấp.
2. Nếu câu hỏi về phối đồ cách tân (Remix Gen Z): Tôn trọng sáng tạo trẻ nếu phù hợp hoàn cảnh, nhắc nhở giữ gìn phom dáng cốt lõi.
3. Nếu câu hỏi về mặc đồ phản cảm tại di tích: Khuyên răn nghiêm túc nhưng hòa nhã.
4. Trả về đúng định dạng JSON:
- answer: Câu trả lời của cụ nghệ nhân (2-4 câu ngắn gọn, ấm áp).
- tone: "am_ap" hoặc "trang_trong".
- references: Mảng tên nguồn tham chiếu ngắn.
- relatedKnowledgeId: ID mục tri thức liên quan nhất (ví dụ: ao_ngu_than, non_bai_tho, quy_uoc_di_tich, ao_dai).`;

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
            answer: { type: Type.STRING },
            tone: { type: Type.STRING, enum: ['am_ap', 'trang_trong'] },
            references: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedKnowledgeId: { type: Type.STRING },
          },
          required: ['answer', 'tone', 'references'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const result: NpcResponse = {
      answer: parsed.answer || defaultFallback.answer,
      tone: parsed.tone === 'trang_trong' ? 'trang_trong' : 'am_ap',
      references: parsed.references && parsed.references.length > 0 ? parsed.references : defaultFallback.references,
      relatedKnowledgeId: parsed.relatedKnowledgeId || defaultFallback.relatedKnowledgeId,
      isFallback: false,
    };

    globalCache.set(cacheKey, result, 1000 * 60 * 60);
    return result;
  } catch (err) {
    console.warn('[Gemini NPC API] Gặp lỗi hoặc offline, dùng lời thoại nghệ nhân dự phòng:', err);
    return defaultFallback;
  }
}
