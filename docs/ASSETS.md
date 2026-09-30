# KHAI BÁO NGUỒN GỐC & BẢN QUYỀN TÀI SẢN (ASSET DECLARATION)
**Dự án:** Tầm Phục Ký - Việt Phục Remix
**Cuộc thi:** Cuộc thi Phát triển Game & Ứng dụng Di sản Văn hóa Việt Nam
**Ngày lập hồ sơ:** 30/09/2026
**Tác quyền:** Nhóm Kỹ thuật & Thiết kế Game Tầm Phục Ký

---

## 1. Tuyên bố về tính độc bản và tôn trọng bản quyền (Copyright Compliance)
- **Tôn trọng quyền sở hữu trí tuệ:** Game TUYỆT ĐỐI không sử dụng tên, nhân vật, sprite sheet, âm nhạc, meme, lời thoại hoặc thiết kế đồ họa từ các tựa game nổi tiếng (như Dan the Man, Super Sentai, Power Rangers) hay bất kỳ thương hiệu thương mại nào khác trên thị trường.
- **Phong cách Arcade độc lập:** Toàn bộ nhân vật anh hùng, quái vật, mini-boss, boss "Bóng Lãng Quên" và NPC cụ nghệ nhân đều được thiết kế độc quyền với tỉ lệ chibi pixel art 32-bit dựa trên cảm hứng văn hóa dân gian Việt Nam.

---

## 2. Bảng kê khai chi tiết các nhóm tài sản

| Hạng mục tài sản | Công cụ / Phần mềm tạo dựng | Ngày hoàn thành | Giấy phép (License) | Mức độ AI hỗ trợ / Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **Bảng màu 32 màu (`palette.ts`)** | Aseprite, Lospec Palette Editor | 29/09/2026 | MIT / Creative Commons CC0 | Thiết kế thủ công 100%, chọn lọc từ sắc tố tự nhiên gốm sứ và cung đình Huế |
| **Sprite dự phòng bằng Code (Blit Engine)** | TypeScript Canvas Renderer | 29/09/2026 | Bản quyền mở (MIT) | 100% lập trình nội suy pixel trực tiếp bằng mã nguồn thuần |
| **Hình vẽ cấu tạo trang phục (Áo ngũ thân, nón, áo dài)** | Aseprite, Vector Pen Tool | 29/09/2026 | Độc quyền dự án | Tự vẽ thủ công dựa trên tư liệu nghiên cứu Bảo tàng Cổ vật Cung đình Huế |
| **Khung giao diện UI 9-Slice & Biểu tượng** | Aseprite & Pixelorama | 29/09/2026 | Độc quyền dự án | Thiết kế thủ công theo phong cách hoa văn hoàng cung |
| **Font chữ hiển thị** | Google Fonts (Pixelify Sans) | 2026 | SIL Open Font License (OFL 1.1) | Font mã nguồn mở quốc tế, hỗ trợ Unicode tiếng Việt đầy đủ dấu |
| **Hệ thống âm thanh & Nhạc nền (WebAudio Synth)** | Web Audio API / Chiptune Oscillator | 29/09/2026 | Tự tạo mã nguồn mở (MIT) | Tổng hợp âm thanh bằng thuật toán sóng Sin, Tam giác và Nhiễu trắng trong trình duyệt |
| **Dữ liệu tri thức lịch sử (`knowledge.json`)** | Biên tập từ tư liệu lịch sử | 29/09/2026 | Giấy phép Giáo dục & Di sản | Đối chiếu với công trình của nhà nghiên cứu Trần Đình Sơn và Bảo tàng Cổ vật |
| **Mô hình hỗ trợ thẩm định & kể chuyện** | Google Gemini 3.8 Flash SDK | 29/09/2026 | Google AI Developer Terms | Ứng dụng AI ở tầng backend để làm giàu lời thoại NPC và thẩm định văn hóa theo kịch bản có luật kiểm chứng dự phòng |

---

## 3. Tuyên bố mức độ sử dụng Trí tuệ Nhân tạo (AI Declaration)
- **Vòng lặp trò chơi:** 100% logic trò chơi (vòng lặp 60Hz, phát hiện va chạm AABB, máy trạng thái, hiệu ứng đồ họa, combo chiến đấu) được viết hoàn toàn bằng code TypeScript thuần của nhóm phát triển, KHÔNG phụ thuộc AI trong vòng lặp game.
- **Hỗ trợ sinh nội dung văn bản:** Gemini 3.8 Flash được sử dụng có kiểm soát thông qua Structured JSON Schema để sinh các biến thể hội thoại và chấm điểm phong cách Gen Z. Mọi nội dung luôn có hệ thống Luật dự phòng (`/server/rules.ts`) và bộ dữ liệu đối chiếu (`/data/knowledge.json`) thẩm định song song nhằm đảm bảo độ chính xác lịch sử và không làm sai lệch văn hóa dân tộc.
