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
  public bouncingPartId: string | null = null;
  public bounceTimer = 0;
  public highlightSlotId: string | null = null;
  public highlightTimer = 0;
  public artisanFeedback: string = 'Hãy chọn một mảnh ghép bên trái, rồi ráp vào đúng vị trí nét đứt trên thân áo nhé con!';
  public isCompleted = false;

  constructor() {
    this.initChapter1AoNguThan();
  }

  public initChapter1AoNguThan(): void {
    this.isCompleted = false;
    this.selectedPartId = null;
    this.bouncingPartId = null;
    this.bounceTimer = 0;
    this.highlightSlotId = null;
    this.highlightTimer = 0;

    // 4 Vị trí gắn mảnh trên phom áo ngũ thân (Tọa độ logic trung tâm màn hình x:156..472, y:30..190)
    this.slots = [
      {
        id: 'slot_co',
        name: 'Cổ đứng',
        expectedPartId: 'part_nguthan_co',
        x: 284,
        y: 34,
        width: 60,
        height: 26,
        placedPartId: null,
        hint: 'Cổ đứng lập lĩnh giữ phong thái chính trực đĩnh đạc và kín đáo.',
      },
      {
        id: 'slot_than',
        name: 'Thân áo',
        expectedPartId: 'part_nguthan_than',
        x: 254,
        y: 62,
        width: 120,
        height: 98,
        placedPartId: null,
        hint: 'Năm thân áo tượng trưng tứ thân phụ mẫu và thân con bên trong.',
      },
      {
        id: 'slot_khuy',
        name: 'Hàng khuy',
        expectedPartId: 'part_nguthan_khuy',
        x: 326,
        y: 60,
        width: 48,
        height: 64,
        placedPartId: null,
        hint: 'Năm chiếc khuy nhắc nhở đạo lý Ngũ Thường Nhân Nghĩa Lễ Trí Tín.',
      },
      {
        id: 'slot_tay',
        name: 'Tay chẽn',
        expectedPartId: 'part_nguthan_tay',
        x: 184,
        y: 64,
        width: 68,
        height: 92,
        placedPartId: null,
        hint: 'Cánh tay chẽn thon gọn ôm dài giữ vẻ đoan trang mực thước.',
      },
    ];

    // 4 Mảnh ghép thật người chơi đã thu thập
    this.parts = [
      {
        id: 'part_nguthan_than',
        name: 'Thân Áo Năm Tà',
        description: 'Năm thân áo tượng trưng tứ thân phụ mẫu và thân con.',
        iconColor: '#1c5e59',
        assignedSlotId: null,
      },
      {
        id: 'part_nguthan_co',
        name: 'Cổ Đứng Lập Lĩnh',
        description: 'Cổ đứng lập lĩnh giữ phong thái chính trực đĩnh đạc.',
        iconColor: '#268c7e',
        assignedSlotId: null,
      },
      {
        id: 'part_nguthan_khuy',
        name: 'Hàng Khuy Ngũ Thường',
        description: 'Năm chiếc khuy nhắc nhở đạo lý Ngũ Thường Nhân Nghĩa Lễ Trí Tín.',
        iconColor: '#f7af34',
        assignedSlotId: null,
      },
      {
        id: 'part_nguthan_tay',
        name: 'Cánh Tay Chẽn',
        description: 'Cánh tay chẽn thon gọn ôm dài cử động khoan thai.',
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
    this.bouncingPartId = null;
    const part = this.parts.find((p) => p.id === partId);
    if (part) {
      this.artisanFeedback = `Đang chọn [${part.name}]. Hãy bấm vào vùng nét đứt tương ứng trên thân áo để ráp vào nhé!`;
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
      this.bouncingPartId = null;
      this.highlightSlotId = null;

      // Kiểm tra hoàn thành tất cả 4 mảnh
      const allDone = this.slots.every((s) => s.placedPartId !== null);
      if (allDone) {
        this.isCompleted = true;
        this.artisanFeedback =
          'TUYỆT TÁC ÁO NGŨ THÂN HOÀN THÀNH! Con đã khôi phục trọn vẹn vẻ tôn nghiêm và đạo lý truyền thống của cổ phục xứ Huế!';
      } else {
        this.artisanFeedback = `Chính xác! Mảnh đã khớp vào áo. ${slot.hint} Hãy tiếp tục ráp các mảnh còn lại nhé!`;
      }
      return true;
    } else {
      // ẢNH C: Đặt sai -> Mảnh nảy lại, hiện bảng nghệ nhân với lời giải thích vị trí đúng của bộ phận đó (đọc được trọn câu) và vùng đúng nhấp sáng nhẹ
      this.bouncingPartId = part.id;
      this.bounceTimer = 24;

      const correctSlot = this.slots.find((s) => s.expectedPartId === part.id);
      this.highlightSlotId = correctSlot ? correctSlot.id : null;
      this.highlightTimer = 240; // Nhấp sáng nhẹ trong 4 giây

      // Lời giải thích dùng thẻ học liên quan kèm dòng Nhớ lại
      let explanation = '';
      let recall = '';
      if (part.id === 'part_nguthan_co') {
        explanation = `Nghệ Nhân May Đo: "Chưa đúng vị trí rồi con! [Cổ Đứng] phải ở trên đỉnh cổ áo. Cổ đứng lập lĩnh giữ phong thái chính trực đĩnh đạc và đoan trang mực thước."`;
        recall = `Nhớ lại: Cổ đứng cài khuy kín đáo biểu trưng cho sự tôn nghiêm chuẩn mực.`;
      } else if (part.id === 'part_nguthan_than') {
        explanation = `Nghệ Nhân May Đo: "Chưa đúng vị trí rồi con! [Thân Áo] phải ở trung tâm. Năm thân áo tượng trưng tứ thân phụ mẫu và thân con che chở bên trong."`;
        recall = `Nhớ lại: Cấu trúc ngũ thân thể hiện lòng hiếu thảo và sự gắn kết gia đình truyền thống.`;
      } else if (part.id === 'part_nguthan_khuy') {
        explanation = `Nghệ Nhân May Đo: "Chưa đúng vị trí rồi con! [Hàng Khuy] phải cài ở sườn phải. Năm chiếc khuy nhắc nhở đạo lý Ngũ Thường Nhân Nghĩa Lễ Trí Tín."`;
        recall = `Nhớ lại: Năm khuy cài biểu trưng cho năm đức tính Nhân, Nghĩa, Lễ, Trí, Tín.`;
      } else {
        explanation = `Nghệ Nhân May Đo: "Chưa đúng vị trí rồi con! [Tay Chẽn] phải buông hai bên. Cánh tay chẽn thon gọn ôm dài giữ vẻ đoan trang mực thước."`;
        recall = `Nhớ lại: Tay chẽn gọn gàng tôn lên vóc dáng thanh tao kín đáo của cổ phục.`;
      }

      this.artisanFeedback = explanation + (recall ? `\nNhớ lại: ${recall.replace('Nhớ lại: ', '')}` : '');
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

  /**
   * Dựng trạng thái ẢNH C: Ráp áo lúc đang có 1 mảnh đã ráp đúng và 1 mảnh đặt sai để thấy cả thao tác lẫn phản hồi
   */
  public triggerWrongPlacementDemo(): void {
    this.initChapter1AoNguThan();
    // 1. Ráp đúng mảnh Thân Áo vào slot Thân Áo (hiện rõ chi tiết đã ráp trên áo)
    this.selectedPartId = 'part_nguthan_than';
    this.placeSelectedPartIntoSlot('slot_than');

    // 2. Thử đặt sai mảnh Cổ Đứng vào vùng Hàng Khuy
    this.selectedPartId = 'part_nguthan_co';
    this.placeSelectedPartIntoSlot('slot_khuy');
  }
}
