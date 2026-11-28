/* =========================================================
   DEV-SERVER.JS - CHẠY WEBSITE + API TRÊN MÁY CÁ NHÂN

   AI prompt: "Tạo backend (Vercel Functions + Supabase)..." – file này
   được viết với sự hỗ trợ của AI.

   Cách chạy:  npm run dev   (hoặc: node dev-server.js)
   Rồi mở:     http://localhost:3000

   - Đường dẫn /api/ten-file  -> chạy file api/ten-file.js (giống Vercel)
   - Đường dẫn khác           -> trả về file HTML/CSS/JS/ảnh như Live Server
   - Đọc biến môi trường từ file .env (nếu có). Chưa có Supabase thì dữ liệu
     được lưu tạm vào file .data/homecare-db.json.
   (Trên Vercel không dùng file này: Vercel tự phục vụ file tĩnh và thư mục api/.)
   ========================================================= */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

// Đọc file .env (Node.js >= 20.12 có sẵn hàm này)
try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch (error) {
  // Không có file .env -> dùng cấu hình mặc định
}

const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function sendText(res, status, text) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(text);
}

const server = http.createServer(async function (req, res) {
  const url = new URL(req.url, "http://localhost");
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (error) {
    sendText(res, 400, "Bad request");
    return;
  }

  // 1. API: /api/bookings -> api/bookings.js
  if (pathname.startsWith("/api/")) {
    const name = pathname.slice(5).replace(/\/+$/, "");
    const file = path.join(ROOT, "api", name + ".js");
    if (/^[a-z0-9-]+$/.test(name) === false || fs.existsSync(file) === false) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Không có API " + pathname }));
      return;
    }
    await require(file)(req, res);
    return;
  }

  // 2. File tĩnh. Chặn file ẩn (.env, .data, .git) và không cho đi ra ngoài thư mục dự án
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  const filePath = path.normalize(path.join(ROOT, pathname));
  const isOutside = filePath.startsWith(ROOT + path.sep) === false;
  const isHidden = pathname.split("/").some(function (part) { return part.startsWith("."); });

  if (isOutside || isHidden) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, function (error, content) {
    if (error) {
      sendText(res, 404, "Không tìm thấy " + pathname);
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.end(content);
  });
});

server.listen(PORT, function () {
  const storage = require("./api/_lib/db").storageName;
  console.log("HomeCare đang chạy tại http://localhost:" + PORT);
  console.log("Lưu dữ liệu: " + (storage === "supabase" ? "Supabase" : "file .data/homecare-db.json (chưa cấu hình Supabase)"));
  console.log("VNPay sandbox: " + (require("./api/_lib/vnpay").isConfigured() ? "đã cấu hình" : "chưa cấu hình (xem .env.example)"));
});
