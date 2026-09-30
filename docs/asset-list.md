# BẢNG TẢI SẢN HÌNH ẢNH (ASSET LIST) - DỰ ÁN "TẦM PHỤC KÝ"
> **Quy chuẩn kỹ thuật chung:**
> - Phong cách: Pixel art 32-bit Arcade, viền nâu/tím đậm 1px (tuyệt đối không dùng đen thuần `#000000`).
> - Nguồn sáng: Trên - Trái (Top-Left 45°). Đổ bóng 3 tông màu ấm hoàng hôn.
> - Bảng màu: Tuân thủ nghiêm ngặt 32 màu trong `/client/src/art/palette.ts`.
> - Định dạng file: PNG trong suốt (RGBA 8-bit), không nén lossy, không khử răng cưa (Point filter / Nearest neighbor).
> - Độ phân giải logic hiển thị: Canvas 480x270 (tỷ lệ 16:9), nội suy số nguyên.

---

## 1. Nhân vật chính (Anh hùng Tầm Phục)
Tỷ lệ chibi arcade (đầu ~ 1/3 thân), chiều cao logic ~48px. Trang phục áo tấc cách tân gọn gàng màu chàm tím/teal, dải quấn đầu màu cam hổ phách.

| ID Tài sản | Kích thước ô | Số khung | Tốc độ (fps) | Điểm neo (Anchor) | Mô tả chi tiết & Hành vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hero_idle` | 48x48 | 2 | 4 | Chân: (24, 46) | Đứng thở nhẹ nhàng, nhấp nhô ngực và vạt áo theo nhịp thở. |
| `hero_run` | 48x48 | 4 | 10 | Chân: (24, 46) | Chạy nước rút cuộn ngang, vạt áo và dải buộc đầu bay phấp phới về sau. |
| `hero_jump` | 48x48 | 2 | 6 | Chân: (24, 46) | Khung 1: Bật nhảy thu gối lên cao; Khung 2: Buông chân tiếp đất. |
| `hero_attack_1` | 64x48 | 3 | 12 | Chân: (24, 46) | Đòn 1 trong combo: Cú đấm móc tay thuận kèm vệt gió vàng cam. |
| `hero_attack_2` | 64x48 | 3 | 12 | Chân: (24, 46) | Đòn 2 trong combo: Cú đá xoay quét thấp tạo luồng khí teal. |
| `hero_attack_3` | 64x48 | 3 | 10 | Chân: (24, 46) | Đòn kết thúc combo: Đấm chưởng song thủ bung sóng xung kích hình hoa sen. |
| `hero_dodge` | 48x48 | 1 | 1 | Chân: (24, 46) | Lướt nhanh về phía trước tạo bóng mờ dư ảnh (after-image), miễn nhiễm va chạm. |
| `hero_hit` | 48x48 | 1 | 1 | Chân: (24, 46) | Bị giật lùi, nhắm tịt mắt, cơ thể nhấp nháy trắng đỏ khi trúng đòn. |
| `hero_throw` | 48x48 | 2 | 8 | Chân: (24, 46), Tay: (36, 26) | Vung tay ném "Thẻ Sự Thật" hoặc phóng tia "Chỉ Năng Lượng" về phía boss. |

---

## 2. Quái thường (Hiện thân Lãng Quên & Hiểu Lầm nhỏ)
Kích thước từ 24px đến 32px. Hình tượng ngộ nghĩnh, biểu cảm ngờ nghệch, không có máu me hay bạo lực rùng rợn.

| ID Tài sản | Kích thước ô | Số khung | Mô tả & Chuyển động |
| :--- | :--- | :--- | :--- |
| `mob_chi_roi` | 32x32 | 4 | **Quái Chỉ Rối**: Búi len sợi màu hổ phách nhảy tưng tưng, hai mắt sợi thò ra ngơ ngác, thỉnh thoảng rụng vài sợi chỉ. |
| `mob_bui_mo` | 32x32 | 4 | **Bóng Bụi Mờ**: Đám mây bụi màu xám tro lơ lửng, mắt tròn to long lanh, thổi ra làn khói mờ ảo làm chậm bước chân. |
| `mob_khuy_meo` | 24x24 | 4 | **Quái Khuy Méo**: Hạt nút áo bốn lỗ màu ngọc bích lăn tròn trên mặt đất, khi dừng lại há miệng kêu chíp chíp. |
| `mob_la_ua` | 32x32 | 4 | **Quái Lá Úa**: Phiến lá nón khô vàng bay chập chờn hình sin trong không trung rồi lượn bổ nhào xuống. |

---

## 3. Mini-Boss các màn (Kèm Khiên Hiểu Lầm)
Chiều cao từ 64px đến 96px. Mỗi con đại diện cho một bộ phận bị hiểu sai của trang phục, có bóng bảo vệ dạng bong bóng năng lượng màu tím nhạt.

| ID Tài sản | Kích thước ô | Số khung | Mô tả chi tiết hình tượng |
| :--- | :--- | :--- | :--- |
| `miniboss_vat_ao` | 64x64 | 4 | **Bóng Mờ Vạt Áo (Chương 1)**: Cuộn vải gấm lớn bung xòe méo mó, quấn quanh cây kéo may cổ, miệng cười ngoác rộng. |
| `miniboss_co_veo` | 64x64 | 4 | **Yêu Cổ Vẹo (Chương 1)**: Cổ áo đứng bị xoắn vặn hình lò xo, mắt nháy lộn xộn, giơ hai dải nẹp áo quất gió. |
| `miniboss_khuy_lac` | 64x64 | 4 | **Bóng Khuy Lạc (Chương 1)**: Vòng xoay gồm 5 hạt ngọc khuy áo quay tít xung quanh một lõi năng lượng phát sáng màu tím. |
| `miniboss_meo_vanh` | 64x64 | 4 | **Bóng Méo Vành (Chương 2)**: 16 nan nón tre bị uốn cong thành hình quái vật sao biển nhảy bật tanh tách. |
| `miniboss_cat_ta` | 64x64 | 4 | **Bóng Cắt Tà (Chương 3)**: Chiếc kéo khổng lồ gắn hai dải lụa bay lượn trên không, múa may chực chờ cắt xẻ tà áo. |

---

## 4. Boss Cuối Chương: "Bóng Lãng Quên"
Kích thước cực đại: 160x160 đến 192x192 px. Quái vật khổng lồ hình cuộn chỉ rối bám đầy bụi thời gian và mạng nhện, hai mắt là hai chiếc khuy áo cổ bằng đồng cũ kỹ, miệng là đường kim may nguệch ngoạc. Ngộ nghĩnh, hài hước, không gây kinh sợ trẻ nhỏ.

| ID Tài sản | Kích thước ô | Số khung | Mô tả trạng thái hoạt ảnh |
| :--- | :--- | :--- | :--- |
| `boss_idle` | 160x160 | 4 | **Pha 1 - Đứng thở**: Cuộn chỉ phập phồng chậm rãi, mắt khuy chớp nháy, bụi bay li ti xung quanh. |
| `boss_attack_threads` | 192x160 | 6 | **Pha 2 - Phóng tơ chỉ**: Bắn ra hàng loạt cuộn chỉ con và mạng nhện vây hãm mặt đất. |
| `boss_slam` | 192x192 | 6 | **Pha 3 - Nện búa kéo**: Nhảy vút lên cao rồi dập cuộn chỉ xuống đất tạo sóng xung kích chấn động hai bên. |
| `boss_vanish` | 160x160 | 8 | **Đại thắng - Tỉnh ngộ & Tan biến**: Bóng tối tan rã thành muôn ngàn đốm sáng đom đóm vàng lấp lánh, cuộn chỉ biến thành lụa lành lặn. |

---

## 5. Mảnh ghép trang phục tách lớp (Phục vụ Màn Ráp Áo)
Hình chiếu phẳng 2D chính xác theo tỷ lệ giải phẫu trang phục thực tế, có điểm neo (Anchor points X, Y) để người chơi kéo thả ghép nối vào hình bóng mờ.

| ID Tài sản | Kích thước | Tọa độ điểm neo ghép | Mô tả bộ phận |
| :--- | :--- | :--- | :--- |
| `part_nguthan_than` | 128x160 | (64, 80) | Thân áo ngũ thân và năm tà ghép phẳng (tiền vạt, hậu vạt, tà con bên trong). |
| `part_nguthan_co` | 64x48 | (64, 28) | Cổ áo đứng lập lĩnh cắt may cong tròn ôm nhẹ. |
| `part_nguthan_khuy` | 48x48 | (78, 64) | Bộ 5 hạt nút khuy ngọc xếp theo thứ tự cổ -> nách -> sườn phải. |
| `part_nguthan_tay` | 128x96 | (64, 52) | Đôi tay chẽn dài ôm thon thả kèm đôi ống quần lụa trắng. |
| `part_non_nan` | 128x128 | (64, 64) | Bộ 16 vành nan nón tre tròn đều tăm tắp. |
| `part_non_la` | 128x128 | (64, 64) | Hai lớp lá kè trắng ngà ép phẳng. |
| `part_non_tho` | 128x128 | (64, 64) | Bản họa tiết cắt giấy câu thơ và bóng tháp chùa Thiên Mụ. |
| `part_non_quai` | 96x96 | (64, 90) | Dải lụa mềm thắt nơ màu tím Huế. |
| `part_aodai_ta` | 128x192 | (64, 96) | Hai tà trước sau buông dài thướt tha của áo dài truyền thống. |
| `part_aodai_co_khuy` | 64x64 | (64, 30) | Cổ đứng thanh tao và đường khuy bấm vai sườn. |
| `part_aodai_quan` | 96x160 | (64, 110) | Quần lụa suông rộng màu trắng ngà. |
| `part_aodai_khandong`| 64x48 | (64, 18) | Khăn đóng xếp nếp hình chữ Nhân (人) tinh xảo. |

---

## 6. Nền Parallax nhiều lớp (Xứ Huế & Xưởng May Boss)
Kích thước mỗi lớp 480x270 px (lặp ngang Seamless loopable).

| Tên lớp nền | Tốc độ trượt | Bảng màu & Chi tiết hiển thị |
| :--- | :--- | :--- |
| `bg_hue_sky` | 0.05x | Trời hoàng hôn chuyển tông mượt từ tím than hoàng cung sang cam hổ phách rực rỡ, vầng trăng khuyết mờ ảo. |
| `bg_hue_far_palace` | 0.2x | Mái ngói hoàng lưu ly, thanh lưu ly trùng điệp của Đại Nội, bóng tháp Phước Duyên xa xa trong sương. |
| `bg_hue_river` | 0.4x | Sông Hương lấp lánh sóng nước phản chiếu ánh hoàng hôn, vài rặng liễu rủ và thuyền rồng lướt nhẹ. |
| `bg_hue_ground` | 1.0x | Mặt đường lát đá hoa cương cổ thành Huế, thảm cỏ xanh thẫm, bệ gạch rêu phong để nhân vật chạy nhảy. |
| `bg_boss_atelier` | Cố định | **Xưởng May Cổ Điển**: Gian phòng ấm áp với các cuộn chỉ đa sắc, thước dây gỗ treo tường, giỏ kim chỉ tre, lò sưởi ấm than hồng. |

---

## 7. Giao diện người dùng (UI 9-Slice & Biểu tượng)

| ID Tài sản | Kích thước | Mô tả |
| :--- | :--- | :--- |
| `ui_panel_9slice` | 24x24 (slice 8,8,8,8) | Khung cửa sổ arcade nền xanh navy thẫm (`#181938`), viền chỉ vàng kim (`#f4af34`), 4 góc có hoa văn khuy áo cách điệu. |
| `ui_boss_bar` | 180x16 | Thanh đo "Lãng Quên" dài ở cạnh trên màn hình với hoa văn cung đình bao bọc. |
| `ui_heart_icon` | 16x16 | Trái tim "Ký Ức" màu hồng ngọc viền nâu đậm (biểu thị sinh lực người chơi). |
| `ui_thread_energy` | 16x16 | Biểu tượng ống chỉ phát sáng màu xanh teal (năng lượng tung chiêu đặc biệt). |
| `ui_card_truth` | 40x56 | Khung thẻ "Sự Thật" hoa văn cổ phong, có số thứ tự phím tắt 1 - 4 trên đầu. |
| `ui_npc_portrait` | 48x48 | Chân dung cụ nghệ nhân thợ may già hiền hậu, mắt cười phúc hậu, vấn khăn nhung đen. |

---

## 8. Hiệu ứng đồ họa (VFX Particles & Sparks)

| ID Tài sản | Kích thước ô | Số khung | Mô tả hiệu ứng |
| :--- | :--- | :--- | :--- |
| `vfx_hit_spark` | 32x32 | 4 | Tia lửa sao vàng bùng ra khi ra đòn trúng quái vật (kèm cảm giác hit-stop). |
| `vfx_thread_slash`| 48x32 | 4 | Vệt chém đường chỉ lụa óng ánh uốn lượn theo cú đánh của nhân vật. |
| `vfx_dust_puff` | 24x24 | 4 | Cụm bụi đất nhỏ bung ra khi nhân vật tiếp đất hoặc đổi hướng chạy nhanh. |
| `vfx_shield_crack`| 64x64 | 4 | Vết nứt pha lê vỡ vụn khi Khiên Hiểu Lầm của mini-boss bị phá giải bằng Thẻ Sự Thật. |
