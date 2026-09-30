/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ROUTE: GET /api/status (TRẠNG THÁI HỆ THỐNG & HUY HIỆU NGOẠI TUYẾN)
 */

import { Router, Request, Response } from 'express';
import { getGeminiClient, GEMINI_MODEL } from '../gemini/client.ts';
import { globalCache } from '../cache.ts';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  const hasClient = getGeminiClient() !== null;
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    online: true,
    geminiAvailable: hasClient && hasKey,
    model: GEMINI_MODEL,
    mode: hasClient && hasKey ? 'online_ai' : 'offline_fallback',
    badgeText: hasClient && hasKey ? 'AI Trực Tuyến (Gemini 3.8 Flash)' : 'Chế Độ Ngoại Tuyến (Dữ Liệu Dự Phòng Chuẩn Hóa)',
    cachedEntries: globalCache.size(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
