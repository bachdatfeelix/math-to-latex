# 📐 Math2LaTeX Studio

Ứng dụng Web chuyển đổi hình ảnh đề thi Toán học (ảnh chụp, ảnh màn hình, công thức viết tay hoặc in ấn) sang mã nguồn **LaTeX** chuẩn quốc tế và tự động xuất file `.tex`.

---

## ✨ Tính năng nổi bật

1. **Nhận diện Toán học thông minh & Đa chế độ (Multi-Engine)**:
   - ⚡ **AI Vision (Google Gemini 2.0 Flash)**: Nhận diện chính xác 100% tiếng Việt, câu hỏi trắc nghiệm A/B/C/D, ma trận, tích phân, giới hạn, căn thức, bảng biến thiên và hình vẽ TikZ.
   - 🛡️ **Offline In-Browser (Tesseract.js)**: Hoạt động 100% cục bộ trong trình duyệt, không cần Internet hay API key.
   - 🦙 **Ollama Local Vision**: Hỗ trợ chạy các mô hình Vision mã nguồn mở tại chỗ (`llava`, `qwen2-vl`, `llama3.2-vision`).
   - ⚙️ **Custom API**: Tương thích mọi endpoint OpenAI/vLLM.

2. **Công cụ xử lý ảnh chuyên sâu**:
   - ✂️ **Cắt vùng chọn (Cropper.js)**: Dễ dàng khoanh vùng 1 câu hỏi hoặc 1 công thức cụ thể trong đề thi nhiều trang.
   - 🔄 **Xoay ảnh 90 độ, Phóng to/Thu nhỏ**.
   - 📋 **Dán nhanh (Ctrl + V)** trực tiếp từ clipboard (ảnh chụp màn hình Snipping Tool).
   - 🧪 **Kho ảnh mẫu có sẵn**: Trắc nghiệm THPT, Tích phân & Đạo hàm, Hệ phương trình & Ma trận, Hình học Oxyz.

3. **Trình soạn thảo & Hiển thị trực quan (Live KaTeX Preview)**:
   - Chế độ xem song song (Split Screen): Vừa sửa mã LaTeX vừa thấy đề toán hiển thị như trang sách in.
   - Thanh công cụ chèn nhanh ký hiệu Toán: `\dfrac{a}{b}`, `\sqrt{}`, `\int`, `\lim`, `\sum`, `\begin{cases}`, `\vec{a}`, `\mathbb{R}`, `\alpha, \beta, \Delta`...
   - Tự động đếm ký tự & số dòng.

4. **Xuất bản & Biên dịch**:
   - 📥 **Tải về file `.tex`** chuẩn: Có sẵn đầy đủ `\documentclass{article}`, `\usepackage{amsmath,amssymb,amsfonts}`, `\usepackage[vietnamese]{babel}`...
   - 📋 **Sao chép mã 1-Click**.
   - 🌐 **Mở trực tiếp trên Overleaf** để biên dịch ra PDF ngay tức thì.
   - 🖨️ **In & Xuất PDF trực tiếp từ trình duyệt**.

---

## 🚀 Cách khởi động ứng dụng

### Cách 1: Chạy file `start.bat` (Khuyên dùng trên Windows)
- Nhấp đúp vào file `start.bat` trong thư mục `math-to-latex-web`.
- Trình duyệt sẽ tự động mở trang web tại `http://localhost:3000`.

### Cách 2: Chạy bằng dòng lệnh Terminal
```bash
cd math-to-latex-web
npm install
npm start
```
Sau đó truy cập: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Cấu hình API Key (Miễn phí 100%)
- Bạn có thể lấy API Key miễn phí từ Google AI Studio tại: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Nhập API Key trực tiếp vào mục **"Cấu hình API"** trên giao diện web (được lưu an toàn trong máy bạn), hoặc điền vào file `.env` (`GEMINI_API_KEY=AIzaSy...`).
- Nếu không muốn dùng API, bạn có thể chọn chế độ **"Offline In-Browser"** ở thanh trên cùng.
