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
