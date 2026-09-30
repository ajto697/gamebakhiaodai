/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Route handler for POST /api/judge
 */

import { Router, Request, Response } from 'express';
import { judgeRequestSchema } from '../validate/judgeSchema.ts';
import { judgeOutfitWithGemini } from '../gemini/judge.ts';

export const judgeRouter = Router();

judgeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = judgeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dữ liệu yêu cầu không hợp lệ',
        details: parseResult.error.format(),
      });
    }

    const { event, outfit } = parseResult.data;
    const evaluation = await judgeOutfitWithGemini(event, outfit);
    return res.json(evaluation);
  } catch (error) {
    console.error('Error in /api/judge:', error);
    return res.status(500).json({
      error: 'Lỗi máy chủ khi thẩm định trang phục',
    });
  }
});
