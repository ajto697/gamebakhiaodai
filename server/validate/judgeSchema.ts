/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Zod Schemas for /api/judge request and response validation
 */

import { z } from 'zod';

export const outfitInputSchema = z.object({
  ao: z.string().min(1, 'Cần chỉ định loại áo'),
  quan_vay: z.string().min(1, 'Cần chỉ định quần hoặc váy'),
  phu_kien: z.array(z.string()).optional().default([]),
  mau_sac: z.string().optional().default('truyen_thong'),
  phong_cach: z.string().optional().default('hai_hoa'),
});

export const judgeRequestSchema = z.object({
  event: z.string().min(1, 'Cần chỉ định sự kiện hoặc bối cảnh (ví dụ: di_tich, ky_yeu, le_hoi)'),
  outfit: outfitInputSchema,
});

export const canhBaoItemSchema = z.object({
  van_de: z.string(),
  ly_do: z.string(),
  goi_y_thay: z.string(),
});

export const judgeResponseSchema = z.object({
  diem_hoa_hop: z.number().min(0).max(100),
  diem_ton_trong: z.number().min(0).max(100),
  den: z.enum(['xanh', 'vang', 'do']),
  co_du_lieu: z.boolean(),
  diem_tot: z.array(z.string()),
  canh_bao: z.array(canhBaoItemSchema),
  the_kien_thuc: z.object({
    ten: z.string(),
    y_nghia: z.string(),
    nguon_id: z.string(),
  }),
});

export type JudgeRequestBody = z.infer<typeof judgeRequestSchema>;
export type JudgeResponseBody = z.infer<typeof judgeResponseSchema>;
