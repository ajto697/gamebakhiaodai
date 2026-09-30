/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ROUTE: POST /api/story
 */

import { Router, Request, Response } from 'express';
import { StoryRequestSchema } from '../validate/storySchema.ts';
import { generateCompletionStory } from '../gemini/story.ts';

const router = Router();

router.post('/story', async (req: Request, res: Response) => {
  try {
    const parseResult = StoryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: parseResult.error.format(),
      });
    }

    const story = await generateCompletionStory(parseResult.data);
    return res.status(200).json(story);
  } catch (err: any) {
    console.error('[API /api/story] Lỗi server:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi sinh đoạn kể lịch sử' });
  }
});

export default router;
