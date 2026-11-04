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




/* ---------- 3. CÁC HÀM KIỂM TRA TỪNG Ô ----------
   Mỗi hàm trả về: true  = hợp lệ
                   false = có lỗi                        */

function checkFullname() {
  const value = fullnameInput.value.trim();

  if (value === "") {
    showError(fullnameInput, "fullname-error", "Họ và tên không được để trống");
    return false;
  }

  clearError(fullnameInput, "fullname-error");
  return true;
}


function checkEmail() {
  const value = emailInput.value.trim();

  // Biểu thức chính quy (regex) kiểm tra dạng: chu@ten-mien.duoi
  // Ví dụ hợp lệ: an.nguyen@gmail.com
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (value === "") {
    showError(emailInput, "email-error", "Email không được để trống");
    return false;
  }

  if (emailPattern.test(value) === false) {
    showError(emailInput, "email-error", "Email không hợp lệ");
    return false;
  }

  clearError(emailInput, "email-error");
  return true;
}



function checkPhone() {
  const value = phoneInput.value.trim();

  // Regex: bắt đầu bằng số 0, theo sau là đúng 9 chữ số -> tổng 10 số
  const phonePattern = /^0[0-9]{9}$/;

  if (phonePattern.test(value) === false) {
    showError(phoneInput, "phone-error", "Số điện thoại phải có 10 chữ số");
    return false;
  }

  clearError(phoneInput, "phone-error");
  return true;
}



function checkBirthday() {
  const value = birthdayInput.value;   // dạng "2003-05-20", rỗng nếu chưa chọn

  if (value === "") {
    showError(birthdayInput, "birthday-error", "Vui lòng chọn ngày sinh");
    return false;
  }

  // Ngày sinh không được lớn hơn ngày hôm nay
  const birthday = new Date(value);
  const today = new Date();

  if (birthday > today) {
    showError(birthdayInput, "birthday-error", "Ngày sinh không được ở tương lai");
    return false;
  }

  clearError(birthdayInput, "birthday-error");
  return true;
}


function checkCity() {
  // Lựa chọn đầu tiên "Chọn tỉnh/thành phố" có value="" (rỗng)
  if (citySelect.value === "") {
    showError(citySelect, "city-error", "Vui lòng chọn tỉnh/thành phố");
    return false;
  }

  clearError(citySelect, "city-error");
  return true;
}



function checkCertificate() {
  // Trang khách hàng không có ô này -> bỏ qua, coi như hợp lệ
  if (certificateGroup === null) {
    return true;
  }

  // Tìm các checkbox chứng chỉ ĐANG ĐƯỢC TÍCH
  const checkedBoxes = document.querySelectorAll('input[name="certificate"]:checked');

  if (checkedBoxes.length === 0) {
    showError(certificateGroup, "certificate-error", "Vui lòng chọn ít nhất 1 loại chứng chỉ");
    return false;
  }

  clearError(certificateGroup, "certificate-error");
  return true;
}



function checkTerms() {
  if (termsCheckbox.checked === false) {
    showError(termsCheckbox, "terms-error", "Bạn cần đồng ý với điều khoản dịch vụ");
    return false;
  }

  clearError(termsCheckbox, "terms-error");
  return true;
}




/* ---------- 4. KIỂM TRA NGAY KHI NGƯỜI DÙNG RỜI KHỎI Ô ----------
   "blur"   = khi bấm ra ngoài ô (ô mất con trỏ)
   "change" = khi giá trị thay đổi (dùng cho select, ngày, checkbox) */
fullnameInput.addEventListener("blur", checkFullname);
emailInput.addEventListener("blur", checkEmail);
phoneInput.addEventListener("blur", checkPhone);
birthdayInput.addEventListener("change", checkBirthday);
citySelect.addEventListener("change", checkCity);
termsCheckbox.addEventListener("change", checkTerms);

if (certificateGroup !== null) {
  certificateGroup.addEventListener("change", checkCertificate);
}




/* ---------- 5. TẢI FILE ---------- */
const MAX_FILE_SIZE = 10 * 1024 * 1024;               // 10MB đổi ra byte
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const DEFAULT_UPLOAD_TEXT = "Nhấn để tải lên hoặc kéo thả file";

// Đưa khung tải file về trạng thái ban đầu
function resetUpload() {
  fileInput.value = "";
  fileNameText.textContent = DEFAULT_UPLOAD_TEXT;
  uploadBox.classList.remove("has-file");
}

// Kiểm tra file người dùng chọn
function handleFile(file) {
  // Lấy đuôi file: "CCCD.PNG" -> tách theo dấu "." -> lấy phần cuối -> "png"
  const extension = file.name.split(".").pop().toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(extension) === false) {
    resetUpload();
    showError(uploadBox, "file-error", "Chỉ chấp nhận file PDF, JPG, PNG");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    resetUpload();
    showError(uploadBox, "file-error", "File quá lớn, tối đa 10MB");
    return;
  }

  // File hợp lệ -> hiện tên file
  clearError(uploadBox, "file-error");
  fileNameText.textContent = "Đã chọn: " + file.name;
  uploadBox.classList.add("has-file");
}

// Cách 1: bấm vào khung -> chọn file từ máy
fileInput.addEventListener("change", function () {
  // fileInput.files là danh sách file đã chọn, lấy file đầu tiên [0]
  if (fileInput.files.length > 0) {
    handleFile(fileInput.files[0]);
  }
});

// Cách 2: kéo file thả vào khung
// "dragover": file đang được kéo phía trên khung
uploadBox.addEventListener("dragover", function (event) {
  event.preventDefault();          // bắt buộc, nếu không trình duyệt sẽ mở file ra
  uploadBox.classList.add("dragover");
});

// "dragleave": kéo file ra khỏi khung
uploadBox.addEventListener("dragleave", function () {
  uploadBox.classList.remove("dragover");
});

// "drop": thả file xuống
uploadBox.addEventListener("drop", function (event) {
  event.preventDefault();
  uploadBox.classList.remove("dragover");

  const droppedFiles = event.dataTransfer.files;
  if (droppedFiles.length > 0) {
    fileInput.files = droppedFiles;  // gán file vào ô input để form có dữ liệu
    handleFile(droppedFiles[0]);
  }
});




/* ---------- 6. KHI BẤM "ĐĂNG KÝ NGAY" ---------- */
registerForm.addEventListener("submit", function (event) {
  event.preventDefault();          // chặn form tải lại trang

  // Gọi TẤT CẢ hàm kiểm tra (không dừng ở lỗi đầu tiên)
  // để người dùng thấy hết các ô bị sai cùng lúc
  let isValid = true;

  if (checkFullname() === false) isValid = false;
  if (checkEmail() === false) isValid = false;
  if (checkPhone() === false) isValid = false;
  if (checkBirthday() === false) isValid = false;
  if (checkCity() === false) isValid = false;
  if (checkCertificate() === false) isValid = false;
  if (checkTerms() === false) isValid = false;

  if (isValid === false) {
    // Cuộn tới ô bị lỗi đầu tiên cho người dùng dễ thấy
    const firstError = document.querySelector(".invalid");
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Đồ án chưa có máy chủ (backend) nên chỉ thông báo rồi chuyển trang
  alert("Đăng ký thành công! Chào mừng " + fullnameInput.value.trim() + " đến với HomeCare.");
  window.location.href = "dang-nhap.html";
});

