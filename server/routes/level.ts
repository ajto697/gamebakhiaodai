/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ROUTE: POST /api/level
 */

import { Router, Request, Response } from 'express';
import { LevelRequestSchema } from '../validate/levelSchema.ts';
import { generateLevelAmbiance } from '../gemini/level.ts';

const router = Router();

router.post('/level', async (req: Request, res: Response) => {
  try {
    const parseResult = LevelRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dữ liệu đầu vào không hợp lệ',
        details: parseResult.error.format(),
      });
    }

    const levelData = await generateLevelAmbiance(parseResult.data);
    return res.status(200).json(levelData);
  } catch (err: any) {
    console.error('[API /api/level] Lỗi server:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo bối cảnh màn chơi' });
  }
});

export default router;
