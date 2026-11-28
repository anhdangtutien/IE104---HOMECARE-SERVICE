/* =========================================================
   API/_LIB/AUTH.JS - PHIÊN ĐĂNG NHẬP VÀ MÃ OTP

   AI prompt: "Đăng nhập bằng số điện thoại kèm mã OTP (chế độ demo,
   chưa gửi SMS thật)" – phần code này được viết với sự hỗ trợ của AI.

   Cách hoạt động:
   - Đăng nhập thành công -> máy chủ tạo "vé" (token) gồm số điện thoại,
     vai trò, hạn dùng + chữ ký HMAC, lưu vào cookie HttpOnly
     (JavaScript trên trang không đọc được -> khó bị đánh cắp).
   - Mỗi request sau đó, máy chủ kiểm tra chữ ký để biết ai đang gọi.
   - Mã OTP không lưu nguyên văn trong database mà lưu dạng băm (hash).
   ========================================================= */

const crypto = require("crypto");
const { HttpError, getCookie, isHttps } = require("./http");
const { SUPABASE_KEY } = require("./db");

const COOKIE_NAME = "hc_session";
const SESSION_DAYS = 7;

// Khóa bí mật để ký token. Không đặt SESSION_SECRET thì suy ra từ khóa Supabase
// (cũng là bí mật, chỉ máy chủ biết). Chạy thử trên máy thì dùng khóa mặc định.
const SECRET = process.env.SESSION_SECRET ||
  (SUPABASE_KEY ? crypto.createHash("sha256").update("homecare-session:" + SUPABASE_KEY).digest("hex") : "homecare-dev-secret");

// Mặc định bật chế độ demo (hiện mã OTP trên màn hình). Đặt OTP_DEMO=false để tắt.
const OTP_DEMO = process.env.OTP_DEMO !== "false";


/* ---------- 1. SỐ ĐIỆN THOẠI ---------- */

// Bỏ khoảng trắng, dấu chấm, gạch ngang: "0901 234.567" -> "0901234567"
function normalizePhone(value) {
  return String(value || "").replace(/[\s.\-]/g, "");
}

// Đúng 10 hoặc 11 chữ số (theo góp ý của thầy)
function isValidPhone(phone) {
  return /^\d{10,11}$/.test(phone);
}


/* ---------- 2. KÝ VÀ KIỂM TRA TOKEN ---------- */

function toBase64Url(text) {
  return Buffer.from(text).toString("base64url");
}

function sign(text) {
  return crypto.createHmac("sha256", SECRET).update(text).digest("base64url");
}

// So sánh 2 chuỗi mà không để lộ thời gian so sánh (chống dò mã)
function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

function createSessionToken(user) {
  const payload = toBase64Url(JSON.stringify({
    uid: user.id,
    phone: user.phone,
    role: user.role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  }));
  return payload + "." + sign(payload);
}

function verifySessionToken(token) {
  if (typeof token !== "string" || token.indexOf(".") === -1) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2 || safeEqual(sign(parts[0]), parts[1]) === false) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.exp > Date.now() ? payload : null;
  } catch (error) {
    return null;
  }
}


/* ---------- 3. COOKIE ---------- */

function setSessionCookie(req, res, token) {
  const parts = [
    COOKIE_NAME + "=" + token,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + SESSION_DAYS * 24 * 60 * 60
  ];
  if (isHttps(req)) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(req, res) {
  res.setHeader("Set-Cookie", COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

// Người đang đăng nhập (đọc từ cookie), chưa đăng nhập -> null
function getSessionUser(req) {
  return verifySessionToken(getCookie(req, COOKIE_NAME));
}

// Bắt buộc đăng nhập: chưa đăng nhập thì báo lỗi 401
function requireUser(req) {
  const user = getSessionUser(req);
  if (user === null) {
    throw new HttpError(401, "Bạn cần đăng nhập bằng số điện thoại để tiếp tục");
  }
  return user;
}


/* ---------- 4. MÃ OTP ---------- */

// Tạo mã 6 chữ số ngẫu nhiên (crypto.randomInt an toàn hơn Math.random)
function createOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// Băm mã OTP kèm số điện thoại trước khi lưu
function hashOtp(phone, code) {
  return crypto.createHmac("sha256", SECRET).update(phone + ":" + code).digest("hex");
}

module.exports = {
  OTP_DEMO,
  normalizePhone,
  isValidPhone,
  safeEqual,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
  requireUser,
  createOtpCode,
  hashOtp
};
