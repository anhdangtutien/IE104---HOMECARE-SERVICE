/* =========================================================
   DANG-NHAP.JS - XU LY TRANG DANG NHAP
   Nguoi phu trach: THANH VIEN 3

   Chuc nang:
   1. Chon vai tro Khach hang / Bac si (doi mau the duoc chon)
   2. Bam con mat de hien / an mat khau
   3. Kiem tra du lieu khi bam "Dang nhap"
   4. Cac nut chua lam (Facebook, Zalo, OTP...) -> bao "dang phat trien"
   ========================================================= */


/* ---------- 1. LAY CAC PHAN TU HTML ---------- */
const loginForm = document.getElementById("login-form");
const roleCards = document.querySelectorAll(".role-card");
const registerLink = document.getElementById("register-link");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");


/* ---------- 2. CHON VAI TRO ----------
   Moi the vai tro chua 1 nut radio. Khi radio thay doi:
   - Xoa class "active" o TAT CA the
   - Them class "active" cho the vua chon
   - Doi link "Dang ky ngay" sang dung trang dang ky */
for (const card of roleCards) {
  const radio = card.querySelector("input");

  radio.addEventListener("change", function () {
    // Buoc 1: bo chon tat ca
    for (const otherCard of roleCards) {
      otherCard.classList.remove("active");
    }

    // Buoc 2: to mau the dang chon
    card.classList.add("active");

    // Buoc 3: doi link dang ky
    if (radio.value === "bac-si") {
      registerLink.href = "dang-ky-bac-si.html";
    } else {
      registerLink.href = "dang-ky-khach-hang.html";
    }
  });
}


/* ---------- 3. HIEN / AN MAT KHAU ----------
   O mat khau co type="password" (hien dau ***).
   Doi sang type="text" thi se thay chu that. */
togglePasswordButton.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "fa-regular fa-eye";        // icon mat mo
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "fa-regular fa-eye-slash";  // icon mat gach
  }
});


/* ---------- 4. HAM HIEN / XOA LOI ----------
   boxId:   id cua khung .input-box (de to vien do)
   errorId: id cua dong chu bao loi */
function showError(boxId, errorId, message) {
  document.getElementById(boxId).classList.add("invalid");
  document.getElementById(errorId).textContent = message;
}

function clearError(boxId, errorId) {
  document.getElementById(boxId).classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}


/* ---------- 5. KIEM TRA KHI BAM "DANG NHAP" ---------- */
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();   // chan form tai lai trang

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  let isValid = true;       // gia su ban dau la hop le

  // Kiem tra ten dang nhap
  if (username === "") {
    showError("username-box", "username-error", "Vui long nhap so dien thoai hoac ten dang nhap");
    isValid = false;
  } else {
    clearError("username-box", "username-error");
  }

  // Kiem tra mat khau
  if (password === "") {
    showError("password-box", "password-error", "Vui long nhap mat khau");
    isValid = false;
  } else if (password.length < 6) {
    showError("password-box", "password-error", "Mat khau phai co it nhat 6 ky tu");
    isValid = false;
  } else {
    clearError("password-box", "password-error");
  }

  // Co loi thi dung lai
  if (isValid === false) {
    return;
  }

  // Lay vai tro dang chon: tim radio name="role" dang duoc tich (:checked)
  const selectedRole = document.querySelector('input[name="role"]:checked').value;

  let roleName = "Khach hang";
  if (selectedRole === "bac-si") {
    roleName = "Bac si";
  }

  // Do an chua co may chu (backend) nen chi thong bao roi ve trang chu
  alert("Dang nhap thanh cong voi vai tro: " + roleName);
  window.location.href = "index.html";
});
