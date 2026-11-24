/* =========================================================
   LAYOUT.JS - CHÈN HEADER / FOOTER VÀO CÁC TRANG
   Người phụ trách: THÀNH VIÊN 1

   Chức năng:
   1. Khai báo dữ liệu menu (mảng object)
   2. Tạo HTML header, footer đầy đủ, footer rút gọn
   3. Thay thẻ giữ chỗ bằng outerHTML:
        #site-header        -> topbar + header
        #site-footer        -> footer đầy đủ
        #site-footer-simple -> footer rút gọn (trang đăng ký)
   4. Đọc data-page ở <body> để tô sáng (active) đúng mục menu
   5. Nút ☰ trên điện thoại: classList.toggle để đóng/mở menu
   ========================================================= */


/* Bọc TOÀN BỘ code trong một hàm tự chạy (IIFE).
   Lý do: các file JS (home.js, dang-ky.js, dat-kham.js...) dùng chung
   một phạm vi, nếu trùng tên biến const thì báo lỗi "already been declared".
   Biến khai báo bên trong hàm này không "rò ra ngoài" nên không đụng ai. */
(function () {

  /* ---------- 1. DỮ LIỆU MENU ----------
     page     : khớp với data-page ở <body> (trang nào có data-page này
                thì mục menu tương ứng sẽ được tô sáng)
     text     : chữ hiển thị
     link     : đường dẫn ("#" = trang chưa làm)
     children : (không bắt buộc) danh sách menu con
     extraPages : (không bắt buộc) các data-page khác cũng tô sáng mục này */
  /* Theo Figma: menu KHÔNG có "Trang chủ" (bấm logo để về trang chủ),
     nên trang chủ (data-page="home") không có mục nào được tô sáng. */
  const menuItems = [
    {
      page: "dat-kham",
      extraPages: ["dich-vu"],
      text: "Dịch vụ",
      link: "dich-vu.html",
      children: [
        { text: "Đặt khám tại nhà", link: "dat-kham.html" },
        { text: "Gọi video với bác sĩ", link: "dich-vu.html#goi-video" },
        { text: "Đặt lịch xét nghiệm", link: "dich-vu.html#xet-nghiem" },
        { text: "Gói chăm sóc định kỳ", link: "goi-cham-soc.html" }
      ]
    },
    { page: "bac-si", text: "Bác sĩ", link: "dat-kham.html" },
    { page: "goi-cham-soc", text: "Gói chăm sóc", link: "goi-cham-soc.html" },
    {
      page: "tin-tuc",
      text: "Tin tức",
      link: "tin-tuc.html",
      children: [
        { text: "Tin y tế", link: "tin-tuc.html?loai=tin-y-te" },
        { text: "Cẩm nang sức khỏe", link: "tin-tuc.html?loai=cam-nang" }
      ]
    },
    {
      page: "huong-dan",
      text: "Hướng dẫn",
      link: "huong-dan.html",
      children: [
        { text: "Cách đặt lịch khám", link: "huong-dan.html#dat-lich" },
        { text: "Câu hỏi thường gặp", link: "huong-dan.html#cau-hoi" },
        { text: "Chính sách hoàn tiền", link: "huong-dan.html#hoan-tien" }
      ]
    },
    {
      page: "lien-he",
      text: "Liên hệ hợp tác",
      link: "contact.html",
      children: [
        { text: "Giới thiệu HomeCare", link: "about.html" },
        { text: "Hợp tác cùng HomeCare", link: "contact.html#hop-tac" },
        { text: "Liên hệ", link: "contact.html" }
      ]
    }
  ];

  // data-page="..." ở thẻ <body> -> lấy bằng dataset.page
  // (trang không có data-page, VD trang đăng ký, thì kết quả là undefined)
  const currentPage = document.body.dataset.page;

  // Năm hiện tại, dùng cho dòng bản quyền
  const currentYear = new Date().getFullYear();

  // Tài khoản đang đăng nhập (js/dang-nhap.js lưu vào localStorage), chưa đăng nhập -> null.
  // try...catch: trình duyệt chặn localStorage (ẩn danh) thì coi như chưa đăng nhập
  let loggedInUser = null;
  try {
    loggedInUser = JSON.parse(localStorage.getItem("homecare_user"));
  } catch (error) {
    loggedInUser = null;
  }

  // Nút ở thanh trên cùng: chưa đăng nhập -> "Tài khoản" (sang trang đăng nhập),
  // đã đăng nhập -> hiện tên (sang trang hồ sơ). Tên được điền bằng textContent ở bước 3
  let accountButtonHTML = `
    <a href="dang-nhap.html" class="btn btn-outline btn-pill btn-small">
      <i class="fa-regular fa-user"></i> Tài khoản
    </a>`;
  if (loggedInUser !== null) {
    accountButtonHTML = `
      <a href="ho-so.html" class="btn btn-outline btn-pill btn-small" title="Hồ sơ của tôi">
        <i class="fa-regular fa-circle-user"></i> <span id="account-name"></span>
      </a>`;
  }


  /* ---------- 2. TẠO HTML ---------- */

  // Tạo các thẻ <li> của menu từ mảng menuItems
  function createMenuHTML() {
    let html = "";

    for (const item of menuItems) {
      // Mục nào có page trùng với data-page của trang hiện tại -> thêm class "active"
      let activeClass = "";
      const isExtraPage = item.extraPages !== undefined && item.extraPages.includes(currentPage);
      if (item.page === currentPage || isExtraPage) {
        activeClass = " active";
      }

      if (item.children === undefined) {
        // Mục thường (không có menu con)
        html += `
          <li class="nav-item">
            <a href="${item.link}" class="nav-link${activeClass}">${item.text}</a>
          </li>`;
      } else {
        // Mục có menu con: ghép các link con lại trước
        let subHTML = "";
        for (const child of item.children) {
          subHTML += `<li><a href="${child.link}">${child.text}</a></li>`;
        }

        html += `
          <li class="nav-item">
            <a href="${item.link}" class="nav-link${activeClass}">
              ${item.text} <i class="fa-solid fa-chevron-down"></i>
            </a>
            <ul class="submenu">${subHTML}</ul>
          </li>`;
      }
    }

    return html;
  }

  // --- Header: gồm 2 phần liền nhau là topbar (cuộn đi) và header (dính đầu trang) ---
  const headerHTML = `
    <div class="topbar">
      <div class="container topbar-inner">
        <p class="topbar-welcome">Chào mừng bạn đến với HomeCare – chăm sóc sức khỏe tại nhà</p>
        ${accountButtonHTML}
      </div>
    </div>

    <header class="main-header">
      <div class="container header-inner">

        <a href="index.html" class="site-logo">
          <span class="site-logo-icon"><i class="fa-solid fa-house-medical"></i></span>
          HomeCare
        </a>

        <a href="tel:19001234" class="header-hotline">
          <span class="header-hotline-icon"><i class="fa-solid fa-phone"></i></span>
          <span>
            <small>Tư vấn/Đặt lịch</small>
            <strong>1900 1234</strong>
          </span>
        </a>

        <!-- Nút ☰: chỉ hiện trên màn hình nhỏ (xem layout.css) -->
        <button type="button" class="menu-toggle" id="menu-toggle" aria-label="Mở menu" aria-expanded="false">
          <i class="fa-solid fa-bars" id="menu-icon"></i>
        </button>

        <nav class="main-nav" id="main-nav">
          <ul class="nav-list">${createMenuHTML()}</ul>
          <a href="dat-kham.html" class="btn btn-primary header-cta">
            <i class="fa-regular fa-calendar-check"></i> Đặt lịch khám
          </a>
        </nav>

      </div>
    </header>`;

  // --- Footer đầy đủ (trang chủ, trang đặt khám) ---
  const footerHTML = `
    <footer class="site-footer">
      <div class="container footer-top">

        <div class="footer-brand">
          <a href="index.html" class="footer-logo">
            <span class="footer-logo-icon"><i class="fa-solid fa-house-medical"></i></span>
            HomeCare
          </a>
          <p>
            Nền tảng đặt lịch chăm sóc sức khỏe tại nhà – kết nối gia đình bạn
            với đội ngũ bác sĩ và điều dưỡng chuyên nghiệp.
          </p>
        </div>

        <div>
          <h4 class="footer-title">Dịch vụ</h4>
          <ul class="footer-links">
            <li><a href="dat-kham.html">Khám tại nhà</a></li>
            <li><a href="dich-vu.html#goi-video">Gọi video với bác sĩ</a></li>
            <li><a href="dich-vu.html#xet-nghiem">Xét nghiệm tại nhà</a></li>
            <li><a href="goi-cham-soc.html">Gói chăm sóc định kỳ</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-title">Hỗ trợ</h4>
          <ul class="footer-links">
            <li><a href="huong-dan.html#dat-lich">Hướng dẫn đặt lịch</a></li>
            <li><a href="huong-dan.html#cau-hoi">Câu hỏi thường gặp</a></li>
            <li><a href="huong-dan.html#hoan-tien">Chính sách hoàn tiền</a></li>
            <li><a href="huong-dan.html#dieu-khoan">Điều khoản sử dụng</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-title">Liên hệ</h4>
          <ul class="footer-contact">
            <li><strong>Hotline:</strong> 1900 1234</li>
            <li><strong>Email:</strong> support@homecare.vn</li>
            <li><strong>Địa chỉ:</strong> Khu phố 6, P. Linh Trung, TP. Thủ Đức</li>
          </ul>
        </div>

      </div>

      <div class="footer-bottom">
        <div class="container">
          <p>© ${currentYear} HomeCare – Đồ án IE104, Nhóm 13, Trường ĐH Công nghệ Thông tin – ĐHQG TP.HCM</p>
        </div>
      </div>
    </footer>`;

  // --- Footer rút gọn (2 trang đăng ký) ---
  const footerSimpleHTML = `
    <footer class="footer-simple">
      <div class="container footer-simple-inner">
        <div>
          <a href="index.html" class="footer-simple-logo">HomeCare</a>
          <p>© ${currentYear} HomeCare. Đồ án môn Phát triển ứng dụng Web (IE104).</p>
        </div>
        <ul class="footer-simple-links">
          <li><a href="huong-dan.html#bao-mat">Chính sách bảo mật</a></li>
          <li><a href="huong-dan.html#dieu-khoan">Điều khoản</a></li>
          <li><a href="contact.html">Hỗ trợ</a></li>
        </ul>
      </div>
    </footer>`;


  /* ---------- 3. THAY THẺ GIỮ CHỖ BẰNG HTML THẬT ----------
     outerHTML = "toàn bộ thẻ, tính cả chính nó".
     Gán outerHTML nghĩa là THAY LUÔN thẻ giữ chỗ (<div id="site-header">)
     bằng HTML mới. Khác với innerHTML (chỉ đổi phần BÊN TRONG thẻ):
     nếu dùng innerHTML thì header sẽ nằm lọt trong thẻ div bọc ngoài,
     khiến position: sticky chỉ chạy được trong phạm vi cái div đó.     */
  function insertLayout(placeholderId, html) {
    const placeholder = document.getElementById(placeholderId);

    // Trang không có thẻ giữ chỗ này (VD: trang đăng ký không có header) -> bỏ qua
    if (placeholder === null) {
      return;
    }

    placeholder.outerHTML = html;
  }

  insertLayout("site-header", headerHTML);
  insertLayout("site-footer", footerHTML);
  insertLayout("site-footer-simple", footerSimpleHTML);

  // Điền tên tài khoản bằng textContent (an toàn hơn chèn thẳng vào HTML,
  // vì tên do người dùng tự gõ có thể chứa ký tự < >)
  const accountName = document.getElementById("account-name");
  if (accountName !== null) {
    accountName.textContent = loggedInUser.name || loggedInUser.username || "Tài khoản";
  }


  /* ---------- 4. NÚT ☰ ĐÓNG / MỞ MENU TRÊN ĐIỆN THOẠI ----------
     Phải lấy các phần tử SAU khi đã chèn header ở bước 3,
     vì trước đó nút ☰ chưa tồn tại trong trang.                    */
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");
  const menuIcon = document.getElementById("menu-icon");

  // Trang không có header thì menuToggle là null -> không làm gì
  if (menuToggle !== null) {
    menuToggle.addEventListener("click", function () {
      // classList.toggle("open"): chưa có class "open" thì THÊM, có rồi thì GỠ.
      // Hàm trả về true nếu sau khi toggle menu đang mở.
      const isOpen = mainNav.classList.toggle("open");

      // Đổi icon: đang mở -> dấu X, đang đóng -> 3 gạch
      if (isOpen) {
        menuIcon.className = "fa-solid fa-xmark";
      } else {
        menuIcon.className = "fa-solid fa-bars";
      }

      // Báo cho trình đọc màn hình biết menu đang mở hay đóng
      menuToggle.setAttribute("aria-expanded", isOpen);
    });
  }


  /* ---------- 5. LINK CHƯA LÀM (href="#") ----------
     Giống trang đăng nhập: bấm vào thì báo "đang phát triển"
     thay vì nhảy lên đầu trang. Chỉ áp dụng cho link trong
     header/footer, không đụng link "#" của form đăng ký.            */
  const unfinishedLinks = document.querySelectorAll(
    '.main-header a[href="#"], .site-footer a[href="#"], .footer-simple a[href="#"]'
  );

  for (const link of unfinishedLinks) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      alert("Chức năng này đang được phát triển!");
    });
  }

})();
