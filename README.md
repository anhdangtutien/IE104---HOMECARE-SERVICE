# IE104---HOMECARE-SERVICE

# IE104 - HOMECARE SERVICE

Website **chăm sóc sức khỏe tại nhà HomeCare** - đồ án môn *Phát triển ứng dụng Web (IE104)*.

Xây dựng bằng **HTML, CSS, JavaScript thuần** (không dùng framework, không cần cài đặt gì).

## 1. Các trang của website

| Trang | File | Mô tả |
|-------|------|-------|
| Trang chủ | `index.html` | Banner, tìm kiếm, dịch vụ nhanh, bác sĩ tiêu biểu, đối tác |
| Đăng nhập | `dang-nhap.html` | Chọn vai trò, kiểm tra form, hiện/ẩn mật khẩu |
| Đăng ký khách hàng | `dang-ky-khach-hang.html` | Form đăng ký + kiểm tra dữ liệu + tải file |
| Đăng ký bác sĩ | `dang-ky-bac-si.html` | Giống trang khách hàng, thêm ô chứng chỉ và chuyên môn |
| Đặt khám | `dat-kham.html` | Danh sách bác sĩ, tìm kiếm, lọc, sắp xếp, phân trang |

## 2. Cấu trúc thư mục

```
homecare/
├── index.html                Trang chủ
├── dang-nhap.html            Đăng nhập
├── dang-ky-khach-hang.html   Đăng ký khách hàng
├── dang-ky-bac-si.html       Đăng ký bác sĩ
├── dat-kham.html             Đặt khám theo bác sĩ
├── css/
│   ├── base.css              Màu, reset, nút bấm (dùng chung)
│   ├── layout.css            Header, footer (dùng chung)
│   ├── home.css
│   ├── dang-nhap.css
│   ├── dang-ky.css
│   └── dat-kham.css
├── js/
│   ├── layout.js             Chèn header/footer vào các trang (dùng chung)
│   ├── home.js
│   ├── dang-nhap.js
│   ├── dang-ky.js
│   └── dat-kham.js
└── images/
    ├── hero-bac-si.png
    └── doi-tac/              Logo đối tác
```

## 3. Phân công

Mỗi người **chỉ sửa file của mình**, vì vậy khi commit sẽ không bao giờ bị conflict.

| Thành viên | Phần | File phụ trách | Kiến thức chính (để thuyết trình) |
|------------|------|----------------|-----------------------------------|
| TV1 | Phần chung | `README.md`, `css/base.css`, `css/layout.css`, `js/layout.js` | Biến CSS `:root`, reset CSS, header `sticky`, menu con khi rê chuột, `@media`; JS chèn HTML bằng `outerHTML`, `classList.toggle` |
| TV2 | Trang chủ | `index.html`, `css/home.css`, `js/home.js`, thư mục `images/` | Flexbox, Grid, margin âm, hiệu ứng `hover`; JS bắt sự kiện `submit`, `preventDefault`, chuyển trang kèm tham số `?q=` |
| TV3 | Đăng nhập | `dang-nhap.html`, `css/dang-nhap.css`, `js/dang-nhap.js` | Bố cục 2 cột, `::before` / `::after`, `:focus-within`; JS chọn vai trò, hiện/ẩn mật khẩu, kiểm tra form |
| TV4 | Đăng ký (2 trang) | `dang-ky-khach-hang.html`, `dang-ky-bac-si.html`, `css/dang-ky.css`, `js/dang-ky.js` | Form 2 cột bằng Grid, `:has()`; JS kiểm tra email/SĐT bằng regex, sự kiện `blur` / `change`, kéo thả file |
| TV5 | Đặt khám | `dat-kham.html`, `css/dat-kham.css`, `js/dat-kham.js` | Grid + cột `sticky`; JS mảng object, template string, tìm kiếm không dấu, sắp xếp, phân trang, `URLSearchParams` |

## 4. Cách chạy

Không cần cài đặt gì. Chọn một trong hai cách:

1. Mở file `index.html` bằng trình duyệt (nhấp đúp vào file).
2. Dùng VS Code + tiện ích **Live Server**: chuột phải vào `index.html` -> *Open with Live Server*
   (trang tự tải lại mỗi khi lưu file).

> Cần có mạng để tải font **Be Vietnam Pro** và bộ icon **Font Awesome**.

## 5. Quy ước dùng chung (TV1)

### 5.1. Thứ tự nạp CSS và JS

Trong thẻ `<head>`, luôn nạp **base.css trước**, rồi layout.css, cuối cùng là CSS riêng của trang
(file sau có thể ghi đè file trước):

```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/ten-trang.css">
```

Ở cuối `<body>`, nạp `layout.js` **trước** JS riêng của trang:

```html
<script src="js/layout.js"></script>
<script src="js/ten-trang.js"></script>
```

> Trang đăng nhập không có header/footer nên chỉ cần `base.css` và không nạp `layout.js`.

### 5.2. Chèn header / footer

Đặt thẻ giữ chỗ vào HTML, `js/layout.js` sẽ thay thế bằng header/footer thật:

| Thẻ giữ chỗ | Được thay bằng | Dùng ở trang |
|-------------|----------------|--------------|
| `<div id="site-header"></div>` | Header (logo, menu, hotline, nút đăng nhập) | Trang chủ, Đặt khám |
| `<div id="site-footer"></div>` | Footer đầy đủ 4 cột | Trang chủ, Đặt khám |
| `<div id="site-footer-simple"></div>` | Footer rút gọn 1 dòng | 2 trang đăng ký |

### 5.3. Tô sáng menu bằng `data-page`

Khai báo tên trang ở thẻ `<body>`, `layout.js` sẽ tự gạch chân mục tương ứng trên menu:

| Trang | Thẻ body |
|-------|----------|
| Trang chủ | `<body data-page="home">` |
| Đặt khám (sáng mục "Dịch vụ") | `<body data-page="dat-kham">` |
| Giới thiệu (nếu làm thêm) | `<body data-page="about">` |
| Liên hệ (nếu làm thêm) | `<body data-page="contact">` |

### 5.4. Biến CSS trong `:root` (file `base.css`)

Dùng bằng cú pháp `var(--ten-bien)`, ví dụ `color: var(--primary);`.
**Không tự gõ mã màu** trong file của mình, hãy dùng biến để cả website đồng bộ màu.

| Biến | Ý nghĩa |
|------|---------|
| `--primary` | Xanh chính (nút, icon, viền khi chọn) |
| `--primary-dark` | Xanh đậm (tiêu đề, nút khi rê chuột) |
| `--primary-darker` | Xanh đậm nhất (header trang đăng ký, footer) |
| `--primary-light` | Xanh rất nhạt (nền banner) |
| `--white` | Trắng |
| `--text` / `--text-light` | Chữ chính / chữ phụ |
| `--bg-light` | Nền xám nhạt |
| `--border` | Màu đường viền |
| `--error` | Đỏ báo lỗi |
| `--star` / `--accent` | Màu sao đánh giá / màu cam nhấn (hotline) |
| `--radius` / `--radius-lg` | Bo góc vừa / bo góc lớn |
| `--shadow` | Đổ bóng cho thẻ |
| `--header-height` | Chiều cao header (72px), dùng làm giá trị `top` cho cột `sticky` |

### 5.5. Class dùng chung (file `base.css`)

| Class | Công dụng | Ví dụ |
|-------|-----------|-------|
| `.container` | Khung nội dung căn giữa, rộng tối đa 1200px | `<div class="container">` |
| `.btn` | Nút bấm cơ bản (dùng cho cả `<a>` và `<button>`) | `<a class="btn btn-primary">` |
| `.btn-primary` | Nút xanh đặc | |
| `.btn-outline` | Nút viền xanh, nền trắng | |
| `.btn-small` | Nút nhỏ | `class="btn btn-outline btn-small"` |
| `.btn-block` | Nút rộng hết chiều ngang | |
| `.btn-pill` | Nút bo tròn hai đầu | |
| `.avatar` | Ảnh đại diện hình tròn hiện chữ cái đầu | `<div class="avatar">C</div>` |
| `.rating` | Dòng đánh giá sao | `<p class="rating">★ 4.9 · 142 đánh giá</p>` |
| `.badge` | Nhãn nhỏ dạng viên thuốc, chữ in hoa | |
| `.badge-green` | Nhãn nền xanh đặc, chữ trắng | `class="badge badge-green"` |

## 6. Quy trình làm việc với Git

```bash
git pull                         # 1. luôn lấy code mới nhất trước khi làm
# ... sửa file của mình ...
git add .
git commit -m "TV2: thêm phần bác sĩ tiêu biểu"   # 2. ghi rõ ai làm gì
git push                         # 3. đẩy lên GitHub
```

Quy tắc chung:

- **Chỉ sửa file của mình** (xem bảng phân công). Cần sửa file của người khác thì nhắn cho người đó.
- Commit nhỏ, thường xuyên, nội dung commit bắt đầu bằng tên thành viên (`TV1:`, `TV2:`...).
- Cần thêm màu hoặc class dùng chung -> nhắn TV1 bổ sung vào `base.css`, không tự tạo riêng.
