/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MÀN RÁP ÁO TRUYỀN THỐNG (GARMENT ASSEMBLY PUZZLE)
 * Cơ chế kéo-thả hoặc click-to-place ráp các bộ phận thật vào hình bóng mờ của áo ngũ thân.
 * Sai vị trí -> Nghệ nhân ân cần giải thích giải phẫu trang phục và cho thử lại.
 * Đúng 4/4 mảnh -> Áo hoàn thiện phát sáng hào quang, mở khóa thẻ kiến thức và câu chuyện di sản!
 */

export interface GarmentSlot {
  id: string;
  name: string;
  expectedPartId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  placedPartId: string | null;
  hint: string;
}

export interface GarmentPartItem {
  id: string;
  name: string;
  description: string;
  iconColor: string;
  assignedSlotId: string | null;
}

export class RapAoManager {
  public slots: GarmentSlot[] = [];
  public parts: GarmentPartItem[] = [];
  public selectedPartId: string | null = null;
  public artisanFeedback: string = 'Hãy kéo hoặc bấm chọn một mảnh ghép, rồi đặt vào đúng vị trí trên thân áo nhé con!';
  public isCompleted = false;

  constructor() {
    this.initChapter1AoNguThan();
  }

  public initChapter1AoNguThan(): void {
    this.isCompleted = false;
    this.selectedPartId = null;

    // 4 Vị trí gắn mảnh trên phom áo ngũ thân (Tọa độ logic trên khung 300x220)
    this.slots = [
      {
        id: 'slot_co',
        name: 'Vị Trí Cổ Áo',
        expectedPartId: 'part_nguthan_co',
        x: 120,
        y: 12,
        width: 60,
        height: 32,
        placedPartId: null,
        hint: 'Cổ đứng lập lĩnh nằm ở đỉnh cao nhất của thân áo, giữ tư thế đầu ngay ngắn.',
      },
      {
        id: 'slot_than',
        name: 'Vị Trí Thân Áo & Năm Tà',
        expectedPartId: 'part_nguthan_than',
        x: 95,
        y: 48,
        width: 110,
        height: 110,
        placedPartId: null,
        hint: 'Thân áo gồm 4 vạt ngoài bao bọc thân con bên trong, chiếm phần trung tâm trang phục.',
      },
      {
        id: 'slot_khuy',
        name: 'Vị Trí Khuy Ngũ Thường',
        expectedPartId: 'part_nguthan_khuy',
        x: 155,
        y: 50,
        width: 45,
        height: 65,
        placedPartId: null,
        hint: 'Năm hạt khuy cài từ cổ uốn qua nách xuống sườn phải răn dạy Ngũ Thường.',
      },
      {
        id: 'slot_tay',
        name: 'Vị Trí Cánh Tay Chẽn',
        expectedPartId: 'part_nguthan_tay',
        x: 55,
        y: 60,
        width: 190,
        height: 140,
        placedPartId: null,
        hint: 'Cánh tay chẽn thon gọn ôm dài hai bên thân áo, giữ vẻ đoan trang kín đáo.',
      },
    ];

    // 4 Mảnh ghép thật người chơi đã thu thập
    this.parts = [
      {
        id: 'part_nguthan_than',
        name: 'Mảnh 1: Thân Áo Năm Tà',
        description: 'Bốn vạt ngoài che chở thân con bên trong, tượng trưng đạo lý Tứ thân phụ mẫu.',
        iconColor: '#1c5e59',
        assignedSlotId: null,
      },
      {
        id: 'part_nguthan_co',
        name: 'Mảnh 2: Cổ Đứng Lập Lĩnh',
        description: 'Cổ đứng vuông góc kín đáo ngay ngắn, giữ cốt cách đĩnh đạc.',
        iconColor: '#268c7e',
        assignedSlotId: null,
      },
      {
        id: 'part_nguthan_khuy',
        name: 'Mảnh 3: Năm Khuy Ngũ Thường',
        description: 'Năm hạt khuy cài sườn phải răn dạy: Nhân, Nghĩa, Lễ, Trí, Tín.',
        iconColor: '#f7af34',
        assignedSlotId: null,
      },
      {
        id: 'part_nguthan_tay',
        name: 'Mảnh 4: Cánh Tay Chẽn',
        description: 'Hai ống tay áo thon gọn buông dài kín đáo của áo ngũ thân.',
        iconColor: '#f7edd7',
        assignedSlotId: null,
      },
    ];
  }

  /**
   * Chọn mảnh ghép
   */
  public selectPart(partId: string): void {
    if (this.isCompleted) return;
    this.selectedPartId = partId;
    const part = this.parts.find((p) => p.id === partId);
    if (part) {
      this.artisanFeedback = `Đang chọn [${part.name}]. Hãy bấm vào ô phù hợp trên hình áo để ráp vào!`;
    }
  }

  /**
   * Đặt mảnh ghép vào slot
   */
  public placeSelectedPartIntoSlot(slotId: string): boolean {
    if (!this.selectedPartId || this.isCompleted) return false;

    const slot = this.slots.find((s) => s.id === slotId);
    const part = this.parts.find((p) => p.id === this.selectedPartId);
    if (!slot || !part) return false;

    // Kiểm tra đúng vị trí
    if (slot.expectedPartId === part.id) {
      slot.placedPartId = part.id;
      part.assignedSlotId = slot.id;
      this.selectedPartId = null;

      // Kiểm tra hoàn thành tất cả
      const allDone = this.slots.every((s) => s.placedPartId !== null);
      if (allDone) {
        this.isCompleted = true;
        this.artisanFeedback =
          'TUYỆT TÁC CỔ PHỤC HOÀN THÀNH! Con đã khôi phục trọn vẹn vẻ tôn nghiêm và đạo lý của Áo Ngũ Thân Huế!';
      } else {
        this.artisanFeedback = `Chính xác! ${slot.hint} Hãy tiếp tục ráp các mảnh còn lại nhé!`;
      }
      return true;
    } else {
      // Đặt sai vị trí -> Nghệ nhân giải thích nhẹ nhàng
      this.artisanFeedback = `Chưa đúng vị trí rồi con ơi! ${slot.hint}`;
      return false;
    }
  }

  /**
   * Tháo mảnh ra để thử lại
   */
  public resetPart(partId: string): void {
    const part = this.parts.find((p) => p.id === partId);
    if (part && part.assignedSlotId) {
      const slot = this.slots.find((s) => s.id === part.assignedSlotId);
      if (slot) slot.placedPartId = null;
      part.assignedSlotId = null;
      this.isCompleted = false;
      this.artisanFeedback = `Đã gỡ [${part.name}]. Con có thể thử đặt lại!`;
    }
  }
}
