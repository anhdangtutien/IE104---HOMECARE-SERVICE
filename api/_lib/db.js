/* =========================================================
   API/_LIB/DB.JS - ĐỌC / GHI CƠ SỞ DỮ LIỆU

   AI prompt: "Tạo database lưu thông tin đặt lịch khám (Supabase)" –
   phần code này được viết với sự hỗ trợ của AI.

   Có 2 chế độ, tự chọn theo biến môi trường:
   1. SUPABASE (khi có SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
      gọi REST API của Supabase (PostgreSQL). Dùng khi deploy lên Vercel.
   2. FILE JSON (khi chưa cấu hình Supabase, chỉ dùng lúc chạy thử trên máy):
      lưu vào file .data/homecare-db.json để cả nhóm chạy được ngay.

   Các hàm dùng chung cho cả 2 chế độ:
     select(bảng, điều_kiện, { order, limit })  -> mảng các dòng
     insert(bảng, dòng)                          -> dòng vừa thêm
     update(bảng, điều_kiện, phần_sửa)           -> mảng các dòng đã sửa
     upsert(bảng, dòng, cột_trùng)               -> thêm mới, trùng thì cập nhật

   Điều kiện viết dạng object:
     { phone: "0901234567" }                     -> phone = '0901234567'
     { status: { neq: "da-huy" } }               -> status <> 'da-huy'
     { booking_date: { gte: "2026-11-28" } }     -> booking_date >= '2026-11-28'
   ========================================================= */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { HttpError } = require("./http");

// Chấp nhận cả dạng "https://xxx.supabase.co" lẫn "https://xxx.supabase.co/rest/v1/"
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
const useSupabase = SUPABASE_URL !== "" && SUPABASE_KEY !== "";

// Khóa công khai (publishable / anon) không đọc/ghi được vì các bảng đã bật RLS và không mở quyền
// -> báo lỗi rõ ràng thay vì để API hỏng một cách khó hiểu
const isPublicKey = SUPABASE_KEY.startsWith("sb_publishable_") ||
  (SUPABASE_KEY.startsWith("eyJ") && SUPABASE_KEY.split(".").length === 3 &&
    Buffer.from(SUPABASE_KEY.split(".")[1], "base64").toString("utf8").includes('"role":"anon"'));

// Lỗi trùng dữ liệu (VD: khung giờ đã có người đặt) -> API trả mã 409
class ConflictError extends Error {}


/* ---------- 1. CHẾ ĐỘ SUPABASE ---------- */

// Đổi object điều kiện thành tham số PostgREST: { phone: "09" } -> phone=eq.09
function toFilterParams(filters, params) {
  for (const column of Object.keys(filters || {})) {
    const value = filters[column];
    if (value !== null && typeof value === "object") {
      for (const operator of Object.keys(value)) {
        params.append(column, operator + "." + value[operator]);
      }
    } else {
      params.append(column, "eq." + value);
    }
  }
}

async function supabaseRequest(method, table, options) {
  const params = new URLSearchParams();
  toFilterParams(options.filters, params);
  if (options.order) {
    params.append("order", options.order);
  }
  if (options.limit) {
    params.append("limit", String(options.limit));
  }
  if (options.onConflict) {
    params.append("on_conflict", options.onConflict);
  }

  const headers = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: options.prefer || "return=representation"
  };
  // Khóa kiểu cũ (JWT, bắt đầu bằng "eyJ") cần gửi thêm trong Authorization
  if (SUPABASE_KEY.startsWith("eyJ")) {
    headers.Authorization = "Bearer " + SUPABASE_KEY;
  }

  const response = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + params.toString(), {
    method: method,
    headers: headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text === "" ? null : JSON.parse(text);

  if (response.ok === false) {
    // 23505 = mã lỗi "vi phạm ràng buộc UNIQUE" của PostgreSQL
    if (data !== null && data.code === "23505") {
      throw new ConflictError(data.message);
    }
    console.error("Supabase error", response.status, data);
    // PGRST205 = chưa có bảng -> chưa chạy database/schema.sql
    if (data !== null && data.code === "PGRST205") {
      throw new HttpError(500, "Database chưa có bảng " + table + ". Hãy chạy file database/schema.sql trong Supabase SQL Editor");
    }
    throw new HttpError(500, "Không ghi/đọc được cơ sở dữ liệu");
  }

  return data;
}


/* ---------- 2. CHẾ ĐỘ FILE JSON (chạy thử trên máy) ---------- */

const LOCAL_FILE = path.join(process.cwd(), ".data", "homecare-db.json");

function loadLocal() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"));
  } catch (error) {
    return { users: [], otp_codes: [], bookings: [] };
  }
}

function saveLocal(database) {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(database, null, 2));
}

// Dòng có thỏa điều kiện không
function matches(row, filters) {
  for (const column of Object.keys(filters || {})) {
    const condition = filters[column];
    const value = row[column];

    if (condition !== null && typeof condition === "object") {
      if ("neq" in condition && String(value) === String(condition.neq)) return false;
      if ("gte" in condition && !(String(value) >= String(condition.gte))) return false;
      if ("lte" in condition && !(String(value) <= String(condition.lte))) return false;
      if ("eq" in condition && String(value) !== String(condition.eq)) return false;
    } else if (String(value) !== String(condition)) {
      return false;
    }
  }
  return true;
}

// Mô phỏng các ràng buộc UNIQUE giống file database/schema.sql
function checkUnique(table, rows, row) {
  for (const other of rows) {
    if (other === row) {
      continue;
    }
    if (table === "users" && other.phone === row.phone) {
      throw new ConflictError("users_phone_key");
    }
    if (table === "bookings") {
      if (other.code === row.code) {
        throw new ConflictError("bookings_code_key");
      }
      const sameSlot = other.doctor_id === row.doctor_id &&
        other.booking_date === row.booking_date &&
        other.booking_time === row.booking_time;
      if (sameSlot && other.status !== "da-huy" && row.status !== "da-huy") {
        throw new ConflictError("bookings_slot_unique");
      }
    }
  }
}

function sortRows(rows, order) {
  if (!order) {
    return rows;
  }
  const parts = order.split(".");
  const column = parts[0];
  const direction = parts[1] === "desc" ? -1 : 1;
  return rows.slice().sort(function (a, b) {
    if (a[column] === b[column]) return 0;
    return a[column] > b[column] ? direction : -direction;
  });
}

function localInsert(database, table, row) {
  const rows = database[table];
  const now = new Date().toISOString();
  const newRow = Object.assign({}, row);

  if (table === "users") {
    newRow.id = newRow.id || crypto.randomUUID();
  } else {
    newRow.id = rows.reduce(function (max, item) { return Math.max(max, item.id); }, 0) + 1;
  }
  newRow.created_at = newRow.created_at || now;

  checkUnique(table, rows, newRow);
  rows.push(newRow);
  return newRow;
}


/* ---------- 3. CÁC HÀM DÙNG CHUNG ---------- */

function ensureConfigured() {
  if (useSupabase && isPublicKey) {
    throw new HttpError(500, "SUPABASE_SERVICE_ROLE_KEY đang là khóa công khai (publishable/anon). Cần khóa bí mật: sb_secret_... hoặc service_role (xem README mục 4.4)");
  }
  // Trên Vercel ổ đĩa chỉ đọc -> bắt buộc phải có Supabase
  if (useSupabase === false && process.env.VERCEL) {
    throw new HttpError(500, "Máy chủ chưa cấu hình SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY (xem README)");
  }
}

async function select(table, filters, options) {
  ensureConfigured();
  const settings = options || {};
  if (useSupabase) {
    return supabaseRequest("GET", table, { filters: filters, order: settings.order, limit: settings.limit });
  }
  let rows = loadLocal()[table].filter(function (row) { return matches(row, filters); });
  rows = sortRows(rows, settings.order);
  return settings.limit ? rows.slice(0, settings.limit) : rows;
}

async function insert(table, row) {
  ensureConfigured();
  if (useSupabase) {
    const result = await supabaseRequest("POST", table, { body: row });
    return result[0];
  }
  const database = loadLocal();
  const newRow = localInsert(database, table, row);
  saveLocal(database);
  return newRow;
}

async function update(table, filters, changes) {
  ensureConfigured();
  if (useSupabase) {
    return supabaseRequest("PATCH", table, { filters: filters, body: changes });
  }
  const database = loadLocal();
  const updated = [];
  for (const row of database[table]) {
    if (matches(row, filters)) {
      const backup = Object.assign({}, row);
      Object.assign(row, changes);
      try {
        checkUnique(table, database[table], row);
      } catch (error) {
        Object.assign(row, backup);
        throw error;
      }
      updated.push(row);
    }
  }
  saveLocal(database);
  return updated;
}

async function upsert(table, row, conflictColumn) {
  ensureConfigured();
  if (useSupabase) {
    const result = await supabaseRequest("POST", table, {
      body: row,
      onConflict: conflictColumn,
      prefer: "resolution=merge-duplicates,return=representation"
    });
    return result[0];
  }
  const database = loadLocal();
  const existing = database[table].find(function (item) { return item[conflictColumn] === row[conflictColumn]; });
  let result;
  if (existing !== undefined) {
    Object.assign(existing, row);
    result = existing;
  } else {
    result = localInsert(database, table, row);
  }
  saveLocal(database);
  return result;
}

module.exports = {
  select,
  insert,
  update,
  upsert,
  ConflictError,
  storageName: useSupabase ? "supabase" : "local-json",
  SUPABASE_KEY
};
