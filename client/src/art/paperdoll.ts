/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BỘ RENDER AVATAR & THỬ ĐỒ VISUAL (PAPERDOLL CANVAS RENDERER)
 * Vẽ trực quan người mẫu khoác các lớp trang phục truyền thống và hiện đại (áo, quần, phụ kiện, giày).
 */

export interface OutfitSelection {
  ao: string;
  aoColor: string;
  quan: string;
  quanColor: string;
  headwear: string;
  accessory: string;
  footwear: string;
}

export class PaperdollRenderer {
  public static drawAvatar(
    ctx: CanvasRenderingContext2D,
    outfit: OutfitSelection,
    centerX = 150,
    baseY = 280
  ): void {
    ctx.save();

    // 1. Thân người mẫu mannequin (da ngà sáng #eedbc5 có đổ bóng khối)
    ctx.fillStyle = '#eedbc5';
    // Đầu
    ctx.beginPath();
    ctx.arc(centerX, baseY - 210, 22, 0, Math.PI * 2);
    ctx.fill();
    // Đổ bóng cằm & cổ ngà
    ctx.fillStyle = '#dbcca9';
    ctx.fillRect(centerX - 6, baseY - 192, 12, 4);
    // Cổ
    ctx.fillStyle = '#eedbc5';
    ctx.fillRect(centerX - 6, baseY - 190, 12, 16);
    // Vai và thân
    ctx.fillRect(centerX - 24, baseY - 176, 48, 65);
    // Chân mannequin
    ctx.fillRect(centerX - 16, baseY - 110, 12, 100);
    ctx.fillRect(centerX + 4, baseY - 110, 12, 100);

    // Khuôn mặt thanh tú phong cách pixel-art Cố Đô
    ctx.fillStyle = '#63534b';
    ctx.fillRect(centerX - 9, baseY - 212, 3, 3);
    ctx.fillRect(centerX + 6, baseY - 212, 3, 3);
    // Điểm sáng mắt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 8, baseY - 213, 1, 1);
    ctx.fillRect(centerX + 7, baseY - 213, 1, 1);
    // Môi son đỏ thắm cung đình
    ctx.fillStyle = '#bf363b';
    ctx.fillRect(centerX - 4, baseY - 200, 8, 2);
    ctx.fillStyle = '#e85a53';
    ctx.fillRect(centerX - 2, baseY - 201, 4, 1);

    // Tóc đen búi cao cài trâm ngọc
    ctx.fillStyle = '#161426';
    ctx.beginPath();
    ctx.arc(centerX, baseY - 216, 23, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, baseY - 238, 12, 0, Math.PI * 2);
    ctx.fill();
    // Trâm cài tóc vàng kim chạm ngọc bích
    ctx.fillStyle = '#fedb5b';
    ctx.fillRect(centerX + 6, baseY - 242, 14, 2);
    ctx.fillStyle = '#40bfa3';
    ctx.fillRect(centerX + 18, baseY - 243, 3, 4);

    // 2. LỚP QUẦN HOẶC VÁY (TẦNG DƯỚI CỦA ÁO)
    if (outfit.quan === 'quan_lua_ong_rong') {
      // Quần lụa ống rộng dài buông rủ
      ctx.fillStyle = outfit.quanColor || '#f7edd7';
      ctx.beginPath();
      ctx.moveTo(centerX - 22, baseY - 130);
      ctx.lineTo(centerX - 26, baseY - 20);
      ctx.lineTo(centerX - 4, baseY - 20);
      ctx.lineTo(centerX - 2, baseY - 115);
      ctx.lineTo(centerX + 2, baseY - 115);
      ctx.lineTo(centerX + 4, baseY - 20);
      ctx.lineTo(centerX + 26, baseY - 20);
      ctx.lineTo(centerX + 22, baseY - 130);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#161426';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (outfit.quan === 'quan_short') {
      // Quần short ngắn (test lỗi)
      ctx.fillStyle = '#268c7e';
      ctx.fillRect(centerX - 20, baseY - 125, 40, 30);
      ctx.strokeStyle = '#161426';
      ctx.strokeRect(centerX - 20, baseY - 125, 40, 30);
    } else if (outfit.quan === 'vay_ngan') {
      // Chân váy xòe ngắn
      ctx.fillStyle = '#bf363b';
      ctx.beginPath();
      ctx.moveTo(centerX - 16, baseY - 130);
      ctx.lineTo(centerX - 30, baseY - 80);
      ctx.lineTo(centerX + 30, baseY - 80);
      ctx.lineTo(centerX + 16, baseY - 130);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#161426';
      ctx.stroke();
    }

    // 3. LỚP ÁO CHÍNH
    if (outfit.ao === 'ao_ngu_than') {
      // Áo ngũ thân tay chẽn truyền thống
      ctx.fillStyle = outfit.aoColor || '#4f3547';
      // Thân áo dài phủ quá gối
      ctx.beginPath();
      ctx.moveTo(centerX - 24, baseY - 176);
      ctx.lineTo(centerX - 34, baseY - 45);
      ctx.lineTo(centerX + 34, baseY - 45);
      ctx.lineTo(centerX + 24, baseY - 176);
      ctx.closePath();
      ctx.fill();

      // Đổ bóng nếp lụa thân áo
      ctx.fillStyle = 'rgba(22, 20, 38, 0.25)';
      ctx.fillRect(centerX - 28, baseY - 140, 8, 90);
      ctx.fillRect(centerX + 18, baseY - 120, 8, 70);

      // Cánh tay chẽn ôm dài
      ctx.fillStyle = outfit.aoColor || '#4f3547';
      ctx.beginPath();
      ctx.moveTo(centerX - 24, baseY - 176);
      ctx.lineTo(centerX - 42, baseY - 115);
      ctx.lineTo(centerX - 32, baseY - 110);
      ctx.lineTo(centerX - 18, baseY - 160);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + 24, baseY - 176);
      ctx.lineTo(centerX + 42, baseY - 115);
      ctx.lineTo(centerX + 32, baseY - 110);
      ctx.lineTo(centerX + 18, baseY - 160);
      ctx.closePath();
      ctx.fill();

      // Viền cửa tay thêu chỉ vàng kim hoàng gia
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(centerX - 42, baseY - 116, 11, 2);
      ctx.fillRect(centerX + 32, baseY - 111, 11, 2);

      // Cổ đứng lập lĩnh cao 2-3cm có cổ nội trắng bên trong
      ctx.fillStyle = '#f7edd7'; // Cổ nội trắng
      ctx.fillRect(centerX - 10, baseY - 190, 20, 16);
      ctx.fillStyle = outfit.aoColor || '#4f3547'; // Cổ đứng lập lĩnh
      ctx.fillRect(centerX - 9, baseY - 188, 18, 14);
      ctx.strokeStyle = '#fedb5b';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - 9, baseY - 188, 18, 14);

      // Đường cài khuy cong sang sườn phải viền kim tuyến
      ctx.strokeStyle = '#fedb5b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, baseY - 174);
      ctx.quadraticCurveTo(centerX + 14, baseY - 160, centerX + 18, baseY - 135);
      ctx.lineTo(centerX + 18, baseY - 48);
      ctx.stroke();

      // Viền gấu vạt áo thêu hoa văn mây vàng kim
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(centerX - 34, baseY - 47, 68, 2.5);

      // 5 Hạt khuy ngọc vàng kim (Ngũ Thường: Nhân, Nghĩa, Lễ, Trí, Tín)
      ctx.fillStyle = '#fedb5b';
      const buttonPoints = [
        { x: centerX, y: baseY - 180 },
        { x: centerX + 8, y: baseY - 168 },
        { x: centerX + 17, y: baseY - 150 },
        { x: centerX + 18, y: baseY - 130 },
        { x: centerX + 18, y: baseY - 110 },
      ];
      buttonPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a3d13';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Ánh sáng ngọc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pt.x - 1, pt.y - 1, 1.5, 1.5);
        ctx.fillStyle = '#fedb5b';
      });
    } else if (outfit.ao === 'ao_dai_truyen_thong') {
      // Áo dài truyền thống 2 tà mềm mại
      ctx.fillStyle = outfit.aoColor || '#f7edd7';
      ctx.beginPath();
      ctx.moveTo(centerX - 20, baseY - 176);
      ctx.lineTo(centerX - 28, baseY - 35);
      ctx.lineTo(centerX + 28, baseY - 35);
      ctx.lineTo(centerX + 20, baseY - 176);
      ctx.closePath();
      ctx.fill();

      // Cổ đứng nhỏ
      ctx.fillStyle = outfit.aoColor || '#f7edd7';
      ctx.fillRect(centerX - 8, baseY - 186, 16, 12);
      ctx.strokeStyle = '#161426';
      ctx.strokeRect(centerX - 8, baseY - 186, 16, 12);
    } else if (outfit.ao === 'ao_tu_than') {
      // Áo tứ thân Bắc Bộ buộc vạt trước
      ctx.fillStyle = outfit.aoColor || '#7a3d13';
      ctx.fillRect(centerX - 24, baseY - 176, 48, 85);
      // Yếm đào bên trong
      ctx.fillStyle = '#bf363b';
      ctx.beginPath();
      ctx.moveTo(centerX, baseY - 182);
      ctx.lineTo(centerX - 14, baseY - 155);
      ctx.lineTo(centerX + 14, baseY - 155);
      ctx.closePath();
      ctx.fill();
    } else if (outfit.ao === 'ao_ba_ba') {
      // Áo bà ba Nam Bộ cổ tròn xẻ giữa
      ctx.fillStyle = outfit.aoColor || '#268c7e';
      ctx.fillRect(centerX - 22, baseY - 176, 44, 75);
      // Hàng nút giữa ngực
      ctx.fillStyle = '#fedb5b';
      for (let y = baseY - 165; y < baseY - 110; y += 12) {
        ctx.beginPath();
        ctx.arc(centerX, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (outfit.ao === 'ao_tac') {
      // Áo Tấc (Áo ngũ thân tay thụng buông dài quá một tấc)
      ctx.fillStyle = outfit.aoColor || '#1c3b5e';
      // Thân áo thụng buông dài
      ctx.beginPath();
      ctx.moveTo(centerX - 24, baseY - 176);
      ctx.lineTo(centerX - 36, baseY - 40);
      ctx.lineTo(centerX + 36, baseY - 40);
      ctx.lineTo(centerX + 24, baseY - 176);
      ctx.closePath();
      ctx.fill();

      // Tay áo thụng rộng rủ xuống quá bàn tay
      ctx.beginPath();
      ctx.moveTo(centerX - 24, baseY - 176);
      ctx.lineTo(centerX - 52, baseY - 110);
      ctx.lineTo(centerX - 38, baseY - 80);
      ctx.lineTo(centerX - 18, baseY - 145);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + 24, baseY - 176);
      ctx.lineTo(centerX + 52, baseY - 110);
      ctx.lineTo(centerX + 38, baseY - 80);
      ctx.lineTo(centerX + 18, baseY - 145);
      ctx.closePath();
      ctx.fill();

      // Cửa tay thụng lót lụa trắng
      ctx.strokeStyle = '#f7edd7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 52, baseY - 110);
      ctx.lineTo(centerX - 38, baseY - 80);
      ctx.moveTo(centerX + 52, baseY - 110);
      ctx.lineTo(centerX + 38, baseY - 80);
      ctx.stroke();

      // Cổ đứng lập lĩnh cao & cổ nội trắng
      ctx.fillStyle = '#f7edd7';
      ctx.fillRect(centerX - 10, baseY - 190, 20, 16);
      ctx.fillStyle = outfit.aoColor || '#1c3b5e';
      ctx.fillRect(centerX - 9, baseY - 188, 18, 14);
      ctx.strokeStyle = '#fedb5b';
      ctx.strokeRect(centerX - 9, baseY - 188, 18, 14);

      // Đường cài khuy vạt phải & 5 hạt khuy ngọc vàng kim
      ctx.strokeStyle = '#fedb5b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, baseY - 174);
      ctx.quadraticCurveTo(centerX + 14, baseY - 160, centerX + 18, baseY - 135);
      ctx.lineTo(centerX + 18, baseY - 50);
      ctx.stroke();

      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#fedb5b';
        ctx.fillRect(centerX + 8 + (i > 1 ? 9 : i * 4), baseY - 176 + i * 16, 3, 3);
      }
    } else if (outfit.ao === 'ao_nhat_binh') {
      // Áo Nhật Bình cung đình triều Nguyễn (Cổ chữ nhật thêu phượng, tay áo ngũ sắc)
      ctx.fillStyle = outfit.aoColor || '#a62424';
      ctx.beginPath();
      ctx.moveTo(centerX - 24, baseY - 176);
      ctx.lineTo(centerX - 36, baseY - 42);
      ctx.lineTo(centerX + 36, baseY - 42);
      ctx.lineTo(centerX + 24, baseY - 176);
      ctx.closePath();
      ctx.fill();

      // Ống tay xòe nhẹ
      ctx.fillRect(centerX - 46, baseY - 176, 22, 65);
      ctx.fillRect(centerX + 24, baseY - 176, 22, 65);

      // Cửa tay áo ngũ sắc đại diện Ngũ Hành
      const nhatBinhRainbow = ['#268c7e', '#fedb5b', '#ffffff', '#bf363b', '#40bfa3'];
      nhatBinhRainbow.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(centerX - 46, baseY - 120 + idx * 3, 22, 3);
        ctx.fillRect(centerX + 24, baseY - 120 + idx * 3, 22, 3);
      });

      // Cổ áo hình chữ nhật to bản viền vàng kim
      ctx.fillStyle = '#fedb5b';
      ctx.fillRect(centerX - 14, baseY - 188, 28, 45);
      ctx.fillStyle = '#161426';
      ctx.fillRect(centerX - 8, baseY - 188, 16, 36);

      // Thêu hoa văn phượng mây xanh ngọc trên cổ áo
      ctx.fillStyle = '#40bfa3';
      ctx.fillRect(centerX - 12, baseY - 184, 3, 36);
      ctx.fillRect(centerX + 9, baseY - 184, 3, 36);

      // Cúc ngọc cài ngực kim hoàn
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, baseY - 150, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fedb5b';
      ctx.stroke();
    } else if (outfit.ao === 'ao_hai_day') {
      // Áo hai dây / cúp ngực (test vi phạm lăng tẩm)
      ctx.fillStyle = '#a83b6f';
      ctx.fillRect(centerX - 18, baseY - 155, 36, 40);
      ctx.strokeStyle = '#161426';
      ctx.strokeRect(centerX - 18, baseY - 155, 36, 40);
    }

    // 4. LỚP PHỤ KIỆN ĐẦU (HEADWEAR)
    if (outfit.headwear === 'khan_dong') {
      // Khăn đóng đen hoặc xanh chàm xếp nếp chữ Nhất
      ctx.fillStyle = '#161426';
      ctx.beginPath();
      ctx.ellipse(centerX, baseY - 226, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7a3d13';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (outfit.headwear === 'non_bai_tho') {
      // Nón bài thơ hình chóp nón
      ctx.fillStyle = '#f7edd7';
      ctx.beginPath();
      ctx.moveTo(centerX, baseY - 250);
      ctx.lineTo(centerX - 35, baseY - 220);
      ctx.lineTo(centerX + 35, baseY - 220);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ba5e1b';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Quai nón lụa mềm
      ctx.strokeStyle = '#bf363b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 25, baseY - 220);
      ctx.quadraticCurveTo(centerX, baseY - 195, centerX + 25, baseY - 220);
      ctx.stroke();
    } else if (outfit.headwear === 'non_quai_thao') {
      // Nón quai thao Bắc Bộ tròn rộng vành
      ctx.fillStyle = '#e88827';
      ctx.beginPath();
      ctx.ellipse(centerX, baseY - 225, 45, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7a3d13';
      ctx.stroke();
    }

    // 5. LỚP GIÀY DÉP (FOOTWEAR)
    if (outfit.footwear === 'sneaker') {
      // Giày sneaker trắng Gen Z tối giản
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 20, baseY - 15, 14, 12);
      ctx.fillRect(centerX + 6, baseY - 15, 14, 12);
      ctx.strokeStyle = '#161426';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - 20, baseY - 15, 14, 12);
      ctx.strokeRect(centerX + 6, baseY - 15, 14, 12);
    } else if (outfit.footwear === 'guoc_moc') {
      // Guốc mộc gỗ quai nhung
      ctx.fillStyle = '#7a3d13';
      ctx.fillRect(centerX - 18, baseY - 10, 12, 8);
      ctx.fillRect(centerX + 6, baseY - 10, 12, 8);
      ctx.fillStyle = '#bf363b';
      ctx.fillRect(centerX - 18, baseY - 13, 12, 3);
      ctx.fillRect(centerX + 6, baseY - 13, 12, 3);
    }

    // 6. PHỤ KIỆN ĐÍNH KÈM (ACCESSORIES)
    if (outfit.accessory === 'tui_tote') {
      // Túi tote vải canvas bên vai
      ctx.fillStyle = '#f7edd7';
      ctx.fillRect(centerX + 26, baseY - 130, 24, 30);
      ctx.strokeStyle = '#161426';
      ctx.strokeRect(centerX + 26, baseY - 130, 24, 30);
      // Quai túi
      ctx.beginPath();
      ctx.moveTo(centerX + 24, baseY - 165);
      ctx.lineTo(centerX + 30, baseY - 130);
      ctx.stroke();
    } else if (outfit.accessory === 'kinh_ram') {
      // Kính râm đen sành điệu
      ctx.fillStyle = '#161426';
      ctx.fillRect(centerX - 12, baseY - 215, 10, 6);
      ctx.fillRect(centerX + 2, baseY - 215, 10, 6);
      ctx.strokeStyle = '#f7af34';
      ctx.strokeRect(centerX - 12, baseY - 215, 10, 6);
      ctx.strokeRect(centerX + 2, baseY - 215, 10, 6);
    } else if (outfit.accessory === 'hoa_sen') {
      // Hoa sen hồng cầm trên tay
      ctx.fillStyle = '#268c7e';
      ctx.fillRect(centerX + 32, baseY - 135, 2, 30);
      ctx.fillStyle = '#f29ec0';
      ctx.beginPath();
      ctx.arc(centerX + 33, baseY - 140, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
