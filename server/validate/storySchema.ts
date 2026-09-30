/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCHEMA XÁC THỰC API /api/story (ĐOẠN KỂ LỊCH SỬ KHI HOÀN THÀNH MÀN / RÁP ÁO)
 */

import { z } from 'zod';

export const StoryRequestSchema = z.object({
  chapterId: z.string().default('chuong_1'),
  assembledParts: z.array(z.string()).default([]),
  completionTimeSeconds: z.number().optional(),
});

export const StoryResponseSchema = z.object({
  title: z.string(),
  narrative: z.string(),
  moralLesson: z.string(),
  modernRemixTip: z.string(),
  historicalEra: z.string(),
  isFallback: z.boolean().default(false),
});

export type StoryRequest = z.infer<typeof StoryRequestSchema>;
export type StoryResponse = z.infer<typeof StoryResponseSchema>;
