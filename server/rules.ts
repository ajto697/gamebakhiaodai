/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Hệ thống Luật Dự Phòng (Fallback Rules Engine) cho Chấm Điểm Trang Phục (POST /api/judge)
 */

export interface OutfitInput {
  ao: string;
  quan_vay: string;
  phu_kien?: string[];
  mau_sac?: string;
  phong_cach?: string;
}

export type EventType = 'di_tich' | 'ky_yeu' | 'le_hoi' | 'pho_co' | 'ngay_tet';

export interface CanhBaoItem {
  van_de: string;
  ly_do: string;
  goi_y_thay: string;
}

export interface JudgeResult {
  diem_hoa_hop: number;
  diem_ton_trong: number;
  den: 'xanh' | 'vang' | 'do';
  co_du_lieu: boolean;
  diem_tot: string[];
  canh_bao: CanhBaoItem[];
  the_kien_thuc: {
    ten: string;
    y_nghia: string;
    nguon_id: string;
  };
}

export function evaluateOutfitRuleBased(event: string, outfit: OutfitInput): JudgeResult {
  let diem_hoa_hop = 75;
  let diem_ton_trong = 85;
  const diem_tot: string[] = [];
  const canh_bao: CanhBaoItem[] = [];

  const ao = (outfit.ao || '').toLowerCase();
  const quanVay = (outfit.quan_vay || '').toLowerCase();
  const phuKien = (outfit.phu_kien || []).map(p => p.toLowerCase());
  const mauSac = (outfit.mau_sac || '').toLowerCase();
  const eventClean = (event || 'di_tich').toLowerCase();

  const isDiTich = eventClean.includes('di_tich') || eventClean.includes('hoang_cung') || eventClean.includes('den_chua');
  const isKyYeu = eventClean.includes('ky_yeu') || eventClean.includes('hoc_duong');
  const isLeHoi = eventClean.includes('le_hoi') || eventClean.includes('festival') || eventClean.includes('pho_co');

  // 1. Kiểm tra Áo Ngũ Thân & Áo Dài + Quần lụa ống rộng
  const isTraditionalAo = ao.includes('ao_ngu_than') || ao.includes('ao_dai') || ao.includes('ngu_than');
  const hasQuanLua = quanVay.includes('quan_lua') || quanVay.includes('ong_rong');
  const hasShort = quanVay.includes('short') || quanVay.includes('quan_dui') || quanVay.includes('quan_ngan');
  const hasVayNgan = quanVay.includes('vay') && !quanVay.includes('vay_dai');

  if (isTraditionalAo && hasQuanLua) {
    diem_hoa_hop += 15;
    diem_ton_trong += 15;
    diem_tot.push('Phối áo tà dài cùng quần lụa suông rộng tạo phom dáng chuẩn mực, bước đi uyển chuyển thanh tao.');
  }

  // Phối áo truyền thống với short -> ĐỎ ở di tích, hoặc phạt nặng
  if (isTraditionalAo && hasShort) {
    diem_hoa_hop -= 35;
    diem_ton_trong -= 45;
    canh_bao.push({
      van_de: 'Mặc áo dài/ngũ thân với quần short',
      ly_do: 'Quần short làm phá vỡ hoàn toàn tỷ lệ thẩm mỹ của tà áo cổ truyền và gây phản cảm khi để lộ phần thân dưới dưới tà áo xẻ.',
      goi_y_thay: 'Nên thay bằng quần lụa trắng hoặc đen ống rộng mềm mại để giữ trọn vẻ đoan trang.'
    });
  }

  // Phối áo truyền thống với váy ngắn -> VÀNG
  if (isTraditionalAo && hasVayNgan) {
    diem_hoa_hop -= 15;
    diem_ton_trong -= 20;
    canh_bao.push({
      van_de: 'Mặc áo cổ phục với váy ngắn (chân váy ngắn)',
      ly_do: 'Cách tân này dễ làm mất đi cấu trúc tà áo rủ dài truyền thống, tạo cảm giác thiếu cân đối.',
      goi_y_thay: 'Nếu muốn cách điệu nhẹ, có thể phối với váy đụp dài chấm gót hoặc quần suông lụa tơ tằm.'
    });
  }

  // 2. Áo hai dây / Quần short ở di tích -> ĐÈN ĐỎ
  const isAoHaiDay = ao.includes('hai_day') || ao.includes('cup_nguc') || ao.includes('sat_nach');
  if (isDiTich && (isAoHaiDay || hasShort)) {
    diem_ton_trong -= 55;
    diem_hoa_hop -= 30;
    canh_bao.push({
      van_de: 'Y phục thiếu kín đáo tại di tích lịch sử / chốn tôn nghiêm',
      ly_do: 'Quy ước văn hóa di tích và nội quy Đại Nội Huế yêu cầu trang phục lịch sự, phủ vai và dài qua gối để tôn kính tiền nhân.',
      goi_y_thay: 'Mặc áo dài hoặc áo ngũ thân có cổ đứng kín đáo và quần lụa dài qua mắt cá chân.'
    });
  } else if (!isDiTich && (isAoHaiDay || hasShort)) {
    // Ở kỷ yếu hoặc lễ hội -> Cảnh báo nhẹ (VÀNG)
    diem_ton_trong -= 15;
    diem_hoa_hop -= 10;
    canh_bao.push({
      van_de: 'Phối phong cách hở vai hoặc quần ngắn trong sự kiện văn hóa',
      ly_do: 'Dù là kỷ yếu hay lễ hội dạo phố, nét đoan trang của văn hóa Việt vẫn nên được giữ gìn để hài hòa cùng bối cảnh chung.',
      goi_y_thay: 'Có thể khoác thêm áo ngũ thân tay chẽn hoặc áo khoác voan mỏng bên ngoài.'
    });
  }

  // 3. Khăn đóng hợp với Áo Ngũ Thân
  const hasKhanDong = phuKien.some(p => p.includes('khan_dong') || p.includes('khan_van'));
  if (ao.includes('ngu_than') && hasKhanDong) {
    diem_hoa_hop += 10;
    diem_ton_trong += 10;
    diem_tot.push('Khăn đóng chữ Nhân kết hợp hoàn hảo cùng áo ngũ thân tay chẽn, tôn vinh khí chất điềm đạm, đĩnh đạc.');
  }

  // 4. Nón bài thơ hợp với Áo Dài
  const hasNonBaiTho = phuKien.some(p => p.includes('non_bai_tho') || p.includes('non_hue'));
  if (ao.includes('ao_dai') && hasNonBaiTho) {
    diem_hoa_hop += 10;
    diem_ton_trong += 10;
    diem_tot.push('Chiếc nón bài thơ che nghiêng tôn trọn nét duyên ngầm e ấp của tà áo dài thướt tha.');
  }

  // 5. Nón quai thao, khăn mỏ quạ, áo tứ thân (nét Bắc Bộ)
  const isBacBoItem = ao.includes('tu_than') || phuKien.some(p => p.includes('quai_thao') || p.includes('mo_qua'));
  if (isBacBoItem) {
    if (isDiTich && eventClean.includes('hue')) {
      diem_hoa_hop -= 10;
      canh_bao.push({
        van_de: 'Giao thoa yếu tố văn hóa Bắc Bộ tại di tích Cố đô Huế',
        ly_do: 'Nón quai thao, khăn mỏ quạ và áo tứ thân là di sản trang phục rực rỡ của vùng đồng bằng Bắc Bộ (Kinh Bắc). Tại không gian Đại Nội Huế xưa, y phục quy chuẩn là áo ngũ thân lập lĩnh.',
        goi_y_thay: 'Nếu tham quan di tích Huế, áo ngũ thân hoặc áo dài kết hợp nón bài thơ sẽ đúng với lịch sử và thổ nhưỡng xứ Huế hơn.'
      });
    } else {
      diem_tot.push('Mang nét duyên dáng quan họ Bắc Bộ (áo tứ thân / nón quai thao / khăn mỏ quạ) vào bản phối sáng tạo.');
    }
  }

  // 6. Sneaker: khen là remix Gen Z ở kỷ yếu / lễ hội, nhắc nhẹ ở di tích
  const hasSneaker = phuKien.some(p => p.includes('sneaker') || p.includes('giay_the_thao'));
  if (hasSneaker) {
    if (isKyYeu || isLeHoi) {
      diem_hoa_hop += 10;
      diem_tot.push('Đôi sneaker hiện đại là điểm nhấn Remix Gen Z cá tính, tạo năng lượng trẻ trung, năng động cho bộ kỷ yếu mà không làm mất phom áo.');
    } else if (isDiTich) {
      diem_hoa_hop -= 5;
      canh_bao.push({
        van_de: 'Đi sneaker hầm hố tại di tích cung đình cổ kính',
        ly_do: 'Giày sneaker phong cách đường phố có thể hơi lạc nhịp với không gian cổ trang trang nghiêm.',
        goi_y_thay: 'Có thể chọn guốc mộc, hài thêu truyền thống hoặc sneaker tối giản màu trắng/đen để tổng thể nhã nhặn hơn.'
      });
    }
  }

  // 7. Thổ cẩm: nhắc dùng với sự hiểu biết và tôn trọng
  const hasThoCam = phuKien.some(p => p.includes('tho_cam')) || ao.includes('tho_cam');
  if (hasThoCam) {
    diem_tot.push('Họa tiết thổ cẩm thủ công mang đậm bản sắc văn hóa vùng cao, thể hiện sự trân trọng hoa văn đồng bào dân tộc.');
    canh_bao.push({
      van_de: 'Lưu ý khi ứng dụng họa tiết thổ cẩm',
      ly_do: 'Mỗi hoa văn thổ cẩm của đồng bào dân tộc (H\'Mông, Thái, Dao, Ê-đê...) đều gắn với huyền tích hoặc nghi lễ tâm linh riêng.',
      goi_y_thay: 'Hãy tìm hiểu rõ nguồn gốc hoa văn, tránh cắt xẻ họa tiết thiêng liêng ở các vị trí nhạy cảm.'
    });
  }

  // 8. Vàng tươi ở di tích: nhắc màu từng gắn với vua chúa
  const hasVangTuoi = mauSac.includes('vang_tuoi') || mauSac.includes('hoang_yen') || mauSac.includes('hoang_kim');
  if (hasVangTuoi && isDiTich) {
    diem_tot.push('Màu vàng hoàng yến mang sắc thái vương triều lộng lẫy, nổi bật trên nền tường gạch rêu phong của Cố đô.');
    canh_bao.push({
      van_de: 'Ý nghĩa lịch sử của màu vàng tươi tại di tích Hoàng cung Huế',
      ly_do: 'Thời phong kiến Nguyễn, sắc vàng tươi (hoàng yến, hoàng kim) là màu sắc độc quyền của Hoàng đế và Hoàng thái hậu, dân thường tuyệt đối không được dùng.',
      goi_y_thay: 'Bạn có thể chọn màu vàng mơ, cam đất, xanh cổ vịt hoặc màu tím Huế để vừa sang trọng vừa tinh tế.'
    });
  }

  // Guốc mộc cộng điểm
  const hasGuocMoc = phuKien.some(p => p.includes('guoc_moc') || p.includes('hai_theu'));
  if (hasGuocMoc) {
    diem_hoa_hop += 8;
    diem_tot.push('Đôi guốc mộc mộc mạc gợi nhắc tiếng gõ nhịp lóc cóc thân thương của phố phường xưa.');
  }

  // Chuẩn hóa điểm trong khoảng 10 - 100
  diem_hoa_hop = Math.max(15, Math.min(100, diem_hoa_hop));
  diem_ton_trong = Math.max(10, Math.min(100, diem_ton_trong));

  // Xác định Đèn Xanh / Vàng / Đỏ
  let den: 'xanh' | 'vang' | 'do' = 'xanh';
  const hasLoiNghiemTrong = canh_bao.some(c => 
    c.van_de.toLowerCase().includes('thiếu kín đáo') || 
    c.van_de.toLowerCase().includes('quần short') ||
    c.van_de.toLowerCase().includes('ba lỗ') ||
    c.van_de.toLowerCase().includes('biến tướng')
  );

  const hasLoiSaiLech = canh_bao.some(c => {
    const fullText = (c.van_de + ' ' + c.ly_do).toLowerCase();
    return (
      fullText.includes('giao thoa yếu tố') ||
      fullText.includes('chân váy ngắn') ||
      fullText.includes('phong cách hở vai') ||
      fullText.includes('lạc nhịp') ||
      fullText.includes('sneaker hầm hố') ||
      fullText.includes('màu vàng tươi')
    );
  });

  if (hasLoiNghiemTrong || diem_ton_trong < 50) {
    den = 'do';
  } else if (hasLoiSaiLech || diem_ton_trong < 75 || diem_hoa_hop < 70) {
    den = 'vang';
  } else {
    den = 'xanh';
  }

  // Thẻ kiến thức tương ứng
  let the_kien_thuc = {
    ten: 'Quy Chuẩn Cổ Phục & Văn Hóa Ứng Xử',
    y_nghia: 'Y phục truyền thống không chỉ là trang phục làm đẹp mà là tấm gương soi chiếu đạo lý gia phong và ý thức tôn kính di sản tiền nhân.',
    nguon_id: 'quy_uoc_di_tich'
  };

  if (ao.includes('ngu_than')) {
    the_kien_thuc = {
      ten: 'Áo Ngũ Thân & Đạo Lý Ngũ Thường',
      y_nghia: 'Năm thân áo tượng trưng cho tình thâm mẫu tử gia đình; năm hạt khuy nhắc nhở Nhân - Nghĩa - Lễ - Trí - Tín.',
      nguon_id: 'ao_ngu_than'
    };
  } else if (ao.includes('ao_dai')) {
    the_kien_thuc = {
      ten: 'Áo Dài Truyền Thống Việt Nam',
      y_nghia: 'Kế thừa tinh hoa áo ngũ thân, tà áo dài tôn vinh vẻ đẹp thuần hậu, trang nhã và cốt cách thanh cao của người Việt.',
      nguon_id: 'ao_dai_truyen_thong'
    };
  } else if (isBacBoItem) {
    the_kien_thuc = {
      ten: 'Nét Đẹp Dân Gian Kinh Bắc',
      y_nghia: 'Áo tứ thân, khăn mỏ quạ và nón quai thao là hiện thân của văn hóa quan họ Bắc Bộ tình nghĩa, đậm đà tình làng nghĩa xóm.',
      nguon_id: 'ao_tu_than'
    };
  }

  return {
    diem_hoa_hop,
    diem_ton_trong,
    den,
    co_du_lieu: true,
    diem_tot: diem_tot.length > 0 ? diem_tot : ['Bản phối có nét sáng tạo riêng trong việc kết hợp các mảnh ghép trang phục.'],
    canh_bao,
    the_kien_thuc
  };
}
