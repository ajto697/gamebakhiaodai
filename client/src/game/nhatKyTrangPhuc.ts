/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * NHẬT KÝ MẢNH GHÉP TRANG PHỤC (GARMENT JOURNAL & CULTURAL LORE)
 * Lưu trữ tiến độ giải cứu các mảnh cổ phục, chỉ số tăng cường và tư liệu lịch sử.
 */

export interface JournalPartEntry {
  id: string;
  name: string;
  unlocked: boolean;
  statBonus: string;
  lore: string;
  source: string;
}

export const CHAPTER_1_JOURNAL: JournalPartEntry[] = [
  {
    id: 'part_nguthan_than',
    name: 'Thân Áo & Năm Tà',
    unlocked: true,
    statBonus: '+1 Trái Tim Ký Ức Tối Đa',
    lore: 'Bốn thân ngoài tượng trưng cho công đức Tứ thân phụ mẫu (cha mẹ ruột và cha mẹ chồng/vợ). Thân thứ năm nằm kín đáo bên trong tượng trưng cho người mặc được gia đình nâng niu che chở.',
    source: 'CẦN KIỂM CHỨNG: [tài liệu nghiên cứu trang phục thời Nguyễn và tư liệu hiện vật bảo tàng]',
  },
  {
    id: 'part_nguthan_co',
    name: 'Cổ Đứng Lập Lĩnh',
    unlocked: true,
    statBonus: '+10% Kháng Sát Thương Khi Bị Đẩy Lùi',
    lore: 'Cổ đứng vuông góc hoặc lượn tròn ôm khít cổ ngay ngắn, giữ cho tư thế đầu luôn thẳng, toát lên phong thái đĩnh đạc, khiêm cung và chính trực.',
    source: 'CẦN KIỂM CHỨNG: [tư liệu hiện vật bảo tàng Cố đô]',
  },
  {
    id: 'part_nguthan_khuy',
    name: 'Bộ 5 Khuy Ngũ Thường',
    unlocked: true,
    statBonus: '+20 Chỉ Năng Lượng Chiêu Thức Tối Đa',
    lore: 'Năm chiếc khuy cài bên vạt phải tượng trưng cho Ngũ Thường răn dạy đạo lý làm người: Nhân (nhân ái), Nghĩa (ngay thẳng), Lễ (tôn kính), Trí (sáng suốt), Tín (trung thực).',
    source: 'CẦN KIỂM CHỨNG: [giáo trình và tư liệu trang phục cổ truyền]',
  },
  {
    id: 'part_nguthan_tay',
    name: 'Cánh Tay Chẽn',
    unlocked: true,
    statBonus: '+15% Tốc Độ Di Chuyển & Giảm Thời Gian Hồi Né',
    lore: 'Đôi tay chẽn thon gọn ôm dài kín đáo che trọn cánh tay, tạo nên cử chỉ đoan trang, lịch thiệp và đĩnh đạc trong mọi nghi thức truyền thống.',
    source: 'CẦN KIỂM CHỨNG: [châu bản và thư tịch cổ triều Nguyễn]',
  },
];
