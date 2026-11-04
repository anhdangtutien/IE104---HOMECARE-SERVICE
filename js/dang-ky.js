/* =========================================================
   DANG-KY.JS - KIỂM TRA FORM ĐĂNG KÝ
   Dùng chung cho dang-ky-khach-hang.html và dang-ky-bac-si.html
   Người phụ trách: THÀNH VIÊN 4

   Chức năng:
   1. Kiểm tra từng ô: họ tên, email, SĐT, ngày sinh, tỉnh/thành,
      loại chứng chỉ (chỉ trang bác sĩ), đồng ý điều khoản
   2. Hiện lỗi màu đỏ ngay dưới ô bị sai
   3. Tải file: bấm chọn hoặc kéo thả, kiểm tra loại file và dung lượng
   ========================================================= */


/* ---------- 1. LẤY CÁC PHẦN TỬ HTML ---------- */
const registerForm = document.getElementById("register-form");
const fullnameInput = document.getElementById("fullname");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const birthdayInput = document.getElementById("birthday");
const citySelect = document.getElementById("city");
const termsCheckbox = document.getElementById("terms");

// Ô này CHỈ có ở trang bác sĩ. Ở trang khách hàng sẽ là null (không tìm thấy)
const certificateGroup = document.getElementById("certificate-group");

// Phần tải file
const uploadBox = document.getElementById("upload-box");
const fileInput = document.getElementById("file-input");
const fileNameText = document.getElementById("file-name");


/* ---------- 2. HÀM HIỆN / XÓA LỖI ----------
   element: ô cần tô viền đỏ
   errorId: id của dòng <p> báo lỗi bên dưới ô đó          */
function showError(element, errorId, message) {
  element.classList.add("invalid");
  document.getElementById(errorId).textContent = message;
}

function clearError(element, errorId) {
  element.classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}