/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCHEMA XÁC THỰC API /api/npc (HỎI ĐÁP CỤ NGHỆ NHÂN CỐ ĐÔ)
 */

import { z } from 'zod';

export const NpcRequestSchema = z.object({
  question: z.string().min(1).max(300),
  context: z.string().max(200).optional(),
});

export const NpcResponseSchema = z.object({
  answer: z.string(),
  tone: z.enum(['am_ap', 'trang_trong']).default('am_ap'),
  references: z.array(z.string()).default([]),
  relatedKnowledgeId: z.string().optional(),
  isFallback: z.boolean().default(false),
});

export type NpcRequest = z.infer<typeof NpcRequestSchema>;
export type NpcResponse = z.infer<typeof NpcResponseSchema>;
