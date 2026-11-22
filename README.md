# IE104---HOMECARE-SERVICE

HomeCare – Website chăm sóc sức khỏe tại nhà.
Đồ án môn **Internet và Công nghệ Web (IE104)**.
HomeCare kết nối khách hàng với bác sĩ, điều dưỡng đến tận nhà: đặt lịch khám, xem hồ sơ sức khỏe, thanh toán minh bạch.

---

## 1. Cách chạy dự án

1. Tải (clone) dự án về máy:
   ```bash
   git clone <link-repo-cua-nhom>
   ```
2. Mở thư mục bằng **VS Code**, cài tiện ích **Live Server**, bấm chuột phải vào `index.html` → **Open with Live Server**.
   (Hoặc mở thẳng file `index.html` bằng trình duyệt.)
3. Cần có mạng Internet để tải **font Be Vietnam Pro** (Google Fonts) và **icon Font Awesome**.

---

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

---

## 3. Phân công

Mỗi người **chỉ sửa file của mình**, vì vậy khi commit sẽ không bao giờ bị conflict.

| Thành viên | Phần | File phụ trách | Kiến thức chính (để thuyết trình) |
|:---:|---|---|---|
| **TV1** | Phần chung | `README.md`, `css/base.css`, `css/layout.css`, `js/layout.js` | Biến CSS `:root`, reset CSS, header `sticky`, menu con khi rê chuột, `@media`; JS chèn HTML bằng `outerHTML`, `classList.toggle` |
| **TV2** | Trang chủ | `index.html`, `css/home.css`, `js/home.js`, thư mục `images/` | Flexbox, Grid, margin âm, hiệu ứng `hover`; JS bắt sự kiện `submit`, `preventDefault`, chuyển trang kèm tham số `?q=` |
| **TV3** | Đăng nhập | `dang-nhap.html`, `css/dang-nhap.css`, `js/dang-nhap.js` | Bố cục 2 cột, `::before` / `::after`, `:focus-within`; JS chọn vai trò, hiện/ẩn mật khẩu, kiểm tra form |
| **TV4** | Đăng ký (2 trang) | `dang-ky-khach-hang.html`, `dang-ky-bac-si.html`, `css/dang-ky.css`, `js/dang-ky.js` | Form 2 cột bằng Grid, `:has()`; JS kiểm tra email/SĐT bằng regex, sự kiện `blur` / `change`, kéo thả file |
| **TV5** | Đặt khám | `dat-kham.html`, `css/dat-kham.css`, `js/dat-kham.js` | Grid + cột `sticky`; JS mảng object, template string, tìm kiếm không dấu, sắp xếp, phân trang, `URLSearchParams` |

Đầu mỗi file đều có dòng `Người phụ trách: THÀNH VIÊN X`.

---

## 4. Quy ước dùng chung (phần của TV1)

### 4.1. Thứ tự nhúng file CSS

Trong `<head>` của mỗi trang, **luôn** nhúng theo thứ tự: file chung trước, file riêng sau.
Nhờ vậy CSS riêng của từng trang có thể ghi đè CSS chung khi cần.

```html
<link rel="stylesheet" href="css/base.css">     <!-- 1. chung: biến, reset, nút -->
<link rel="stylesheet" href="css/layout.css">   <!-- 2. chung: header, footer (trừ trang đăng nhập) -->
<link rel="stylesheet" href="css/ten-trang.css"> <!-- 3. riêng của trang -->
```

### 4.2. Biến CSS (khai báo trong `css/base.css`)

Không gõ thẳng mã màu vào CSS riêng, hãy dùng `var(--ten-bien)`. Muốn đổi màu cả website chỉ cần sửa trong `:root`.

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--primary` | `#1ba075` | Xanh chính: nút, icon, viền khi focus |
| `--primary-dark` | `#0f6e56` | Xanh đậm: tiêu đề, chữ nhấn, nút khi hover |
| `--primary-darker` | `#0f7c5c` | Xanh rất đậm: đầu form đăng ký, nền footer |
| `--primary-light` | `#e1f5ee` | Xanh nhạt: nền banner, nền huy hiệu |
| `--white` | `#ffffff` | Nền thẻ, nền ô nhập |
| `--text` | `#1f2937` | Chữ thường |
| `--text-light` | `#6b7280` | Chữ phụ, mô tả |
| `--bg-light` | `#f5f9f7` | Nền khu vực nhạt (VD: đối tác) |
| `--border` | `#e5e7eb` | Màu viền |
| `--error` | `#dc2626` | Báo lỗi form |
| `--star` | `#f59e0b` | Ngôi sao đánh giá |
| `--accent` / `--accent-light` | `#e9962b` / `#fdf1e0` | Màu cam vàng phụ: viền dưới header, hotline, huy hiệu |
| `--radius` | `10px` | Bo góc nhỏ (ô nhập, nút) |
| `--radius-lg` | `16px` | Bo góc lớn (thẻ, khung) |
| `--shadow` | `0 6px 22px rgba(13, 60, 45, 0.1)` | Đổ bóng thẻ |
| `--font` | Be Vietnam Pro | Font chữ |

### 4.3. Class dùng chung (khai báo trong `css/base.css`)

| Class | Công dụng |
|---|---|
| `.container` | Khung nội dung rộng tối đa 1200px, tự căn giữa |
| `.btn` | Kiểu chung của nút (luôn đi kèm một kiểu bên dưới) |
| `.btn-primary` | Nút nền xanh, chữ trắng |
| `.btn-outline` | Nút viền xanh, nền trắng |
| `.btn-small` | Nút nhỏ hơn |
| `.btn-block` | Nút rộng hết một dòng |
| `.btn-pill` | Nút bo tròn 2 đầu |
| `.avatar` | Hình tròn chứa chữ cái đầu tên bác sĩ |
| `.rating` | Dòng đánh giá `★ 4.9 · 142 đánh giá` |
| `.badge` / `.badge-green` | Huy hiệu nhỏ (cam / xanh) |

Ví dụ: `<a href="#" class="btn btn-outline btn-small">Đặt lịch</a>`

### 4.4. Cách dùng header và footer (`js/layout.js`)

Header/footer **không viết trong HTML của từng trang**. Mỗi trang chỉ đặt thẻ giữ chỗ, `layout.js` sẽ thay thế bằng nội dung thật:

| Thẻ giữ chỗ | Được thay bằng | Dùng ở trang |
|---|---|---|
| `<div id="site-header"></div>` | Topbar + header + menu | Trang chủ, đặt khám |
| `<div id="site-footer"></div>` | Footer đầy đủ 4 cột | Trang chủ, đặt khám |
| `<div id="site-footer-simple"></div>` | Footer rút gọn | 2 trang đăng ký |

Trang đăng nhập **không** có header/footer nên không nhúng `layout.css` và `layout.js`.

Đặt `<script src="js/layout.js"></script>` ở cuối `<body>`, **trước** file JS riêng của trang:

```html
<script src="js/layout.js"></script>
<script src="js/ten-trang.js"></script>
```

### 4.5. Tô sáng mục menu bằng `data-page`

Ghi `data-page` vào thẻ `<body>`, `layout.js` sẽ tự tô sáng đúng mục trên menu:

```html
<body data-page="dat-kham">
```

| Giá trị `data-page` | Mục menu được tô sáng |
|---|---|
| `dat-kham` | Dịch vụ |
| `bac-si` | Bác sĩ |
| `goi-cham-soc` | Gói chăm sóc |
| `tin-tuc` | Tin tức |
| `huong-dan` | Hướng dẫn |
| `lien-he` | Liên hệ hợp tác |
| `home` (hoặc không ghi) | Không mục nào – theo Figma, menu không có "Trang chủ", bấm logo để về trang chủ |

Muốn thêm hoặc sửa mục menu: chỉ cần sửa mảng `menuItems` ở đầu file `js/layout.js`.

### 4.6. Điểm cần lưu ý khi viết JS riêng

Các file JS đều chạy chung một phạm vi, nên **không khai báo `const` / `let` trùng tên** giữa các file (VD: hai file cùng có `const searchInput` sẽ báo lỗi và file sau không chạy). `layout.js` đã được bọc trong một hàm tự chạy nên không ảnh hưởng đến các file khác.

---

## 5. Làm việc nhóm với Git

```bash
git pull                          # luôn lấy code mới nhất trước khi làm
git add .
git commit -m "TV1: viet header sticky"   # ghi rõ ai làm, làm gì
git push
```

- Chỉ sửa **file của mình** (xem bảng phân công ở trên).
- Cần thêm biến màu hoặc class dùng chung? Nhờ **TV1** thêm vào `base.css`, đừng tự sửa.
- Commit thường xuyên, mỗi lần một việc nhỏ.
