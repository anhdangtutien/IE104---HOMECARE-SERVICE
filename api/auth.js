/* =========================================================
   API/AUTH.JS - ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI + OTP

   AI prompt: "Có thể đăng nhập bằng số điện thoại kèm mã OTP" –
   file này được viết với sự hỗ trợ của AI.

   GET  /api/auth                      -> người đang đăng nhập + cấu hình máy chủ
   POST /api/auth?action=send-otp      { phone }               -> tạo và "gửi" mã OTP
   POST /api/auth?action=verify-otp    { phone, code, role }   -> kiểm tra mã, đăng nhập
   POST /api/auth?action=logout                                -> đăng xuất

   CHẾ ĐỘ DEMO: chưa thuê dịch vụ gửi SMS, nên mã OTP được trả về trong
   kết quả (demoCode) để trang đăng nhập hiện lên màn hình. Mã vẫn được
   tạo ngẫu nhiên, có hạn 5 phút, sai quá 5 lần phải gửi lại.
   ========================================================= */

const db = require("./_lib/db");
const vnpay = require("./_lib/vnpay");
const { HttpError, sendJson, readJson, getQuery, handle } = require("./_lib/http");
const auth = require("./_lib/auth");

const OTP_LIFETIME = 5 * 60 * 1000;      // mã có hạn 5 phút
const RESEND_WAIT = 60 * 1000;           // 60 giây mới được gửi lại
const MAX_ATTEMPTS = 5;                  // nhập sai tối đa 5 lần

// Chỉ trả về những thông tin cần thiết của tài khoản
function publicUser(user) {
  return { id: user.id || user.uid, phone: user.phone, role: user.role, name: user.name || null };
}

async function sendOtp(req, res) {
  const body = await readJson(req);
  const phone = auth.normalizePhone(body.phone);

  if (auth.isValidPhone(phone) === false) {
    throw new HttpError(400, "Số điện thoại phải gồm đúng 10 hoặc 11 chữ số");
  }

  // Chống spam: mỗi số chỉ được xin mã 1 lần / 60 giây
  const latest = await db.select("otp_codes", { phone: phone }, { order: "created_at.desc", limit: 1 });
  if (latest.length > 0) {
    const waited = Date.now() - Date.parse(latest[0].created_at);
    if (waited < RESEND_WAIT) {
      throw new HttpError(429, "Vui lòng chờ " + Math.ceil((RESEND_WAIT - waited) / 1000) + " giây rồi gửi lại mã");
    }
  }

  const code = auth.createOtpCode();
  await db.insert("otp_codes", {
    phone: phone,
    code_hash: auth.hashOtp(phone, code),
    expires_at: new Date(Date.now() + OTP_LIFETIME).toISOString(),
    attempts: 0,
    used: false
  });

  // Bản thật: gọi dịch vụ SMS (eSMS, Twilio...) để gửi `code` tới `phone` tại đây.
  const result = { ok: true, expiresIn: OTP_LIFETIME / 1000, resendIn: RESEND_WAIT / 1000 };
  if (auth.OTP_DEMO) {
    result.demoCode = code;
  }
  sendJson(res, 200, result);
}

async function verifyOtp(req, res) {
  const body = await readJson(req);
  const phone = auth.normalizePhone(body.phone);
  const code = String(body.code || "").trim();
  const role = body.role === "bac-si" ? "bac-si" : "khach-hang";

  if (auth.isValidPhone(phone) === false) {
    throw new HttpError(400, "Số điện thoại phải gồm đúng 10 hoặc 11 chữ số");
  }
  if (/^\d{6}$/.test(code) === false) {
    throw new HttpError(400, "Mã OTP gồm 6 chữ số");
  }

  const found = await db.select("otp_codes", { phone: phone, used: false }, { order: "created_at.desc", limit: 1 });
  const otp = found[0];

  if (otp === undefined) {
    throw new HttpError(400, "Bạn chưa yêu cầu mã OTP hoặc mã đã được sử dụng");
  }
  if (Date.parse(otp.expires_at) < Date.now()) {
    throw new HttpError(400, "Mã OTP đã hết hạn, vui lòng gửi lại mã mới");
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, "Bạn đã nhập sai quá " + MAX_ATTEMPTS + " lần, vui lòng gửi lại mã mới");
  }
  if (auth.safeEqual(otp.code_hash, auth.hashOtp(phone, code)) === false) {
    await db.update("otp_codes", { id: otp.id }, { attempts: otp.attempts + 1 });
    const left = MAX_ATTEMPTS - otp.attempts - 1;
    throw new HttpError(400, left > 0 ? "Mã OTP không đúng (còn " + left + " lần thử)" : "Mã OTP không đúng, vui lòng gửi lại mã mới");
  }

  // Đúng mã: đánh dấu đã dùng, tạo tài khoản nếu là lần đầu (upsert theo số điện thoại)
  await db.update("otp_codes", { id: otp.id }, { used: true });
  const user = await db.upsert("users", { phone: phone, role: role, last_login_at: new Date().toISOString() }, "phone");

  auth.setSessionCookie(req, res, auth.createSessionToken(user));
  sendJson(res, 200, { user: publicUser(user) });
}

async function register(req, res) {
  const body = await readJson(req);
  const phone = auth.normalizePhone(body.phone);
  const password = String(body.password || "");
  const name = body.name ? String(body.name).trim() : null;
  const role = body.role === "bac-si" ? "bac-si" : "khach-hang";

  if (auth.isValidPhone(phone) === false) {
    throw new HttpError(400, "Số điện thoại phải gồm đúng 10 hoặc 11 chữ số");
  }
  if (password.length < 6) {
    throw new HttpError(400, "Mật khẩu phải có ít nhất 6 ký tự");
  }

  const password_hash = auth.hashPassword(password);
  const user = await db.upsert("users", {
    phone: phone,
    name: name,
    role: role,
    password_hash: password_hash,
    last_login_at: new Date().toISOString()
  }, "phone");

  auth.setSessionCookie(req, res, auth.createSessionToken(user));
  sendJson(res, 200, { ok: true, user: publicUser(user) });
}

async function loginPassword(req, res) {
  const body = await readJson(req);
  const phone = auth.normalizePhone(body.username);
  const password = String(body.password || "");
  const role = body.role === "bac-si" ? "bac-si" : "khach-hang";

  if (auth.isValidPhone(phone) === false) {
    throw new HttpError(400, "Vui lòng nhập số điện thoại hợp lệ (10 hoặc 11 chữ số)");
  }
  if (password === "") {
    throw new HttpError(400, "Vui lòng nhập mật khẩu");
  }

  const found = await db.select("users", { phone: phone }, { limit: 1 });
  const user = found[0];

  if (user === undefined) {
    throw new HttpError(400, "Số điện thoại này chưa được đăng ký trong hệ thống");
  }

  if (!user.password_hash) {
    throw new HttpError(400, "Tài khoản chưa cài đặt mật khẩu. Vui lòng đăng nhập bằng mã OTP.");
  }

  if (auth.safeEqual(user.password_hash, auth.hashPassword(password)) === false) {
    throw new HttpError(400, "Mật khẩu không chính xác");
  }

  // Cập nhật vai trò và thời gian đăng nhập
  const updated = await db.update("users", { id: user.id }, {
    role: role,
    last_login_at: new Date().toISOString()
  });
  const currentUser = updated[0] || user;
  currentUser.role = role;

  auth.setSessionCookie(req, res, auth.createSessionToken(currentUser));
  sendJson(res, 200, { ok: true, user: publicUser(currentUser) });
}

module.exports = handle(async function (req, res) {
  const action = getQuery(req).get("action");

  if (req.method === "GET") {
    const session = auth.getSessionUser(req);
    sendJson(res, 200, {
      user: session === null ? null : publicUser(session),
      config: { otpDemo: auth.OTP_DEMO, storage: db.storageName, vnpay: vnpay.isConfigured() }
    });
    return;
  }

  if (req.method !== "POST") {
    throw new HttpError(405, "Phương thức không được hỗ trợ");
  }

  if (action === "send-otp") {
    await sendOtp(req, res);
  } else if (action === "verify-otp") {
    await verifyOtp(req, res);
  } else if (action === "register") {
    await register(req, res);
  } else if (action === "login-password") {
    await loginPassword(req, res);
  } else if (action === "logout") {
    auth.clearSessionCookie(req, res);
    sendJson(res, 200, { ok: true });
  } else {
    throw new HttpError(400, "Tham số action không hợp lệ");
  }
});
