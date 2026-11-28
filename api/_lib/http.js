/* =========================================================
   API/_LIB/HTTP.JS - HÀM TIỆN ÍCH CHO CÁC API (chạy trên máy chủ)

   AI prompt: "Tạo backend (Vercel Functions + Supabase) lưu thông tin
   đặt lịch khám, đăng nhập bằng số điện thoại + OTP, thanh toán VNPay
   sandbox" – toàn bộ thư mục api/ được viết với sự hỗ trợ của AI.

   Thư mục có dấu "_" ở đầu (api/_lib) KHÔNG bị Vercel biến thành API,
   chỉ là code dùng chung cho các file api/*.js.

   Các hàm chỉ dùng Node.js thuần (req, res), nên chạy được cả trên
   Vercel lẫn máy cá nhân (file dev-server.js).
   ========================================================= */

// Lỗi có kèm mã HTTP (400, 401, 404...) để trả về cho trình duyệt
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Trả về dữ liệu dạng JSON
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

// Chuyển hướng trình duyệt sang trang khác (dùng khi VNPay trả kết quả về)
function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

// Đọc thân (body) của request dạng JSON.
// Trên Vercel, req.body đã được đọc sẵn; chạy local thì tự đọc từ luồng dữ liệu.
async function readJson(req) {
  try {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") {
        return req.body === "" ? {} : JSON.parse(req.body);
      }
      if (Buffer.isBuffer(req.body)) {
        const text = req.body.toString("utf8");
        return text === "" ? {} : JSON.parse(text);
      }
      return req.body;
    }

    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 100 * 1024) {
        throw new HttpError(413, "Dữ liệu gửi lên quá lớn");
      }
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    return text === "" ? {} : JSON.parse(text);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(400, "Dữ liệu gửi lên không đúng định dạng JSON");
  }
}

// Tham số trên đường dẫn: /api/bookings?code=HC123456 -> getQuery(req).get("code")
function getQuery(req) {
  return new URL(req.url, "http://localhost").searchParams;
}

// Đọc cookie theo tên
function getCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

// Địa chỉ gốc của website (VD: https://homecare.vercel.app) để tạo link trả về cho VNPay
function getBaseUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || (req.socket && req.socket.encrypted ? "https" : "http");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return String(protocol).split(",")[0] + "://" + host;
}

function isHttps(req) {
  return getBaseUrl(req).startsWith("https://");
}

// IP của người dùng (VNPay yêu cầu gửi kèm)
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  const ip = ((req.socket && req.socket.remoteAddress) || "127.0.0.1").replace("::ffff:", "");
  return ip === "::1" ? "127.0.0.1" : ip;
}

// Bọc hàm xử lý: lỗi nào xảy ra cũng trả về JSON { error: "..." } thay vì làm sập máy chủ
function handle(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
      } else {
        console.error(error);
        sendJson(res, 500, { error: "Máy chủ gặp lỗi, vui lòng thử lại sau" });
      }
    }
  };
}

module.exports = {
  HttpError,
  sendJson,
  redirect,
  readJson,
  getQuery,
  getCookie,
  getBaseUrl,
  isHttps,
  getClientIp,
  handle
};
