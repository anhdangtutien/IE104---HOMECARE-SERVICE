/* =========================================================
   DANG-NHAP.JS - XỬ LÝ TRANG ĐĂNG NHẬP
   Người phụ trách: THÀNH VIÊN 3

   Chức năng:
   1. Chọn vai trò Khách hàng / Bác sĩ (đổi màu thẻ được chọn)
   2. Bấm con mắt để hiện / ẩn mật khẩu
   3. Kiểm tra dữ liệu khi bấm "Đăng nhập"
   4. Các nút chưa làm (Facebook, Zalo, OTP...) -> báo "đang phát triển"
   ========================================================= */


/* ---------- 1. LẤY CÁC PHẦN TỬ HTML ---------- */
const loginForm = document.getElementById("login-form");
const roleCards = document.querySelectorAll(".role-card");
const registerLink = document.getElementById("register-link");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");


/* ---------- 2. CHỌN VAI TRÒ ----------
   Mỗi thẻ vai trò chứa 1 nút radio. Khi radio thay đổi:
   - Xóa class "active" ở TẤT CẢ thẻ
   - Thêm class "active" cho thẻ vừa chọn
   - Đổi link "Đăng ký ngay" sang đúng trang đăng ký */
for (const card of roleCards) {
  const radio = card.querySelector("input");

  radio.addEventListener("change", function () {
    // Bước 1: bỏ chọn tất cả
    for (const otherCard of roleCards) {
      otherCard.classList.remove("active");
    }

    // Bước 2: tô màu thẻ đang chọn
    card.classList.add("active");

    // Bước 3: đổi link đăng ký
    if (radio.value === "bac-si") {
      registerLink.href = "dang-ky-bac-si.html";
    } else {
      registerLink.href = "dang-ky-khach-hang.html";
    }
  });
}


/* ---------- 3. HIỆN / ẨN MẬT KHẨU ----------
   Ô mật khẩu có type="password" (hiện dấu •••).
   Đổi sang type="text" thì sẽ thấy chữ thật. */
togglePasswordButton.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "fa-regular fa-eye";        // icon mắt mở
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "fa-regular fa-eye-slash";  // icon mắt gạch
  }
});


/* ---------- 4. HÀM HIỆN / XÓA LỖI ----------
   boxId:   id của khung .input-box (để tô viền đỏ)
   errorId: id của dòng chữ báo lỗi */
function showError(boxId, errorId, message) {
  document.getElementById(boxId).classList.add("invalid");
  document.getElementById(errorId).textContent = message;
}

function clearError(boxId, errorId) {
  document.getElementById(boxId).classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}


/* ---------- 5. KIỂM TRA KHI BẤM "ĐĂNG NHẬP" ---------- */
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();   // chặn form tải lại trang

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  let isValid = true;       // giả sử ban đầu là hợp lệ

  // Kiểm tra tên đăng nhập
  if (username === "") {
    showError("username-box", "username-error", "Vui lòng nhập số điện thoại hoặc tên đăng nhập");
    isValid = false;
  } else {
    clearError("username-box", "username-error");
  }

  // Kiểm tra mật khẩu
  if (password === "") {
    showError("password-box", "password-error", "Vui lòng nhập mật khẩu");
    isValid = false;
  } else if (password.length < 6) {
    showError("password-box", "password-error", "Mật khẩu phải có ít nhất 6 ký tự");
    isValid = false;
  } else {
    clearError("password-box", "password-error");
  }

  // Có lỗi thì dừng lại
  if (isValid === false) {
    return;
  }

  // Lấy vai trò đang chọn: tìm radio name="role" đang được tích (:checked)
  const selectedRole = document.querySelector('input[name="role"]:checked').value;

  let roleName = "Khách hàng";
  if (selectedRole === "bac-si") {
    roleName = "Bác sĩ";
  }

  // Đồ án chưa có máy chủ (backend) nên chỉ thông báo rồi về trang chủ
  alert("Đăng nhập thành công với vai trò: " + roleName);
  window.location.href = "index.html";
});


/* ---------- 6. ĐANG GÕ -> XÓA LỖI CỦA Ô ĐÓ ---------- */
usernameInput.addEventListener("input", function () {
  clearError("username-box", "username-error");
});

passwordInput.addEventListener("input", function () {
  clearError("password-box", "password-error");
});


/* ---------- 7. CÁC CHỨC NĂNG CHƯA LÀM ----------
   Các nút/link có class "coming-soon" chỉ hiện thông báo */
const comingSoonItems = document.querySelectorAll(".coming-soon");

for (const item of comingSoonItems) {
  item.addEventListener("click", function (event) {
    event.preventDefault();   // link "#" không nhảy lên đầu trang
    alert("Chức năng này đang được phát triển!");
  });
}
