/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ROUTE: POST /api/npc
 */

import { Router, Request, Response } from 'express';
import { NpcRequestSchema } from '../validate/npcSchema.ts';
import { askArtisanNPC } from '../gemini/npc.ts';

const router = Router();

router.post('/npc', async (req: Request, res: Response) => {
  try {
    const parseResult = NpcRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Câu hỏi không hợp lệ',
        details: parseResult.error.format(),
      });
    }

    const answer = await askArtisanNPC(parseResult.data);
    return res.status(200).json(answer);
  } catch (err: any) {
    console.error('[API /api/npc] Lỗi server:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi đối thoại với nghệ nhân' });
  }
});

export default router;
