/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCHEMA XÁC THỰC API /api/level
 */

import { z } from 'zod';

export const LevelRequestSchema = z.object({
  chapterId: z.string().default('chuong_1'),
  levelIndex: z.number().int().min(1).max(4).default(1),
  difficulty: z.enum(['de', 'thuong']).default('thuong'),
});

export const LevelResponseSchema = z.object({
  themeName: z.string(),
  ambiance: z.string(),
  artisanQuote: z.string(),
  miniBossGreeting: z.string(),
  historicalTrivia: z.string(),
  isFallback: z.boolean().default(false),
});

export type LevelRequest = z.infer<typeof LevelRequestSchema>;
export type LevelResponse = z.infer<typeof LevelResponseSchema>;
