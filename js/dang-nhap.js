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
