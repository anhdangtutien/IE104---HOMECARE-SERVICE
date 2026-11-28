/* =========================================================
   API/BOOKINGS.JS - LƯU VÀ ĐỌC LỊCH KHÁM TRONG DATABASE

   AI prompt: "Tạo database lưu thông tin đặt lịch khám; bắt buộc đăng nhập
   mới được đặt lịch" – file này được viết với sự hỗ trợ của AI.

   GET   /api/bookings?doctorId=1&slots=1  -> các khung giờ đã có người đặt (không cần đăng nhập,
                                              chỉ trả ngày + giờ, không lộ thông tin bệnh nhân)
   GET   /api/bookings?code=HC123456        -> 1 lịch hẹn của mình
   GET   /api/bookings                      -> lịch hẹn của mình (bác sĩ: lịch bệnh nhân đặt với mình)
   POST  /api/bookings   { ...thông tin }   -> tạo lịch hẹn mới (BẮT BUỘC đăng nhập)
   PATCH /api/bookings   { code, status }   -> hủy / xác nhận / hoàn thành lịch hẹn
   ========================================================= */

const crypto = require("crypto");
const db = require("./_lib/db");
const catalog = require("./_lib/catalog");
const { HttpError, sendJson, readJson, getQuery, handle } = require("./_lib/http");
const auth = require("./_lib/auth");

const ACTIVE_STATUSES = ["cho-xac-nhan", "sap-toi"];

const PAYMENT_STATUS_NAMES = {
  "chua-thanh-toan": "Chưa thanh toán",
  "cho-thanh-toan": "Đang chờ thanh toán",
  "da-thanh-toan": "Đã thanh toán",
  "that-bai": "Thanh toán thất bại"
};


/* ---------- 1. HÀM TIỆN ÍCH ---------- */

// Ngày hôm nay theo giờ Việt Nam (máy chủ Vercel chạy giờ UTC), cộng thêm dayCount ngày
function vnDateKey(dayCount) {
  const date = new Date(Date.now() + 7 * 60 * 60 * 1000 + dayCount * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

// Cắt chuỗi người dùng gửi lên: bỏ khoảng trắng thừa, giới hạn độ dài
function cleanText(value, maxLength) {
  return String(value === undefined || value === null ? "" : value).trim().slice(0, maxLength);
}

// Dòng trong database (tên cột snake_case) -> object gửi cho trình duyệt (camelCase)
function toClient(row) {
  const address = row.is_online
    ? "Tư vấn qua video (link gửi qua SMS)"
    : row.street + ", " + row.ward + ", TP. Thủ Đức";

  return {
    code: row.code,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    isOnline: row.is_online,
    date: row.booking_date,
    time: row.booking_time,
    patientName: row.patient_name,
    relation: row.relation,
    accountPhone: row.account_phone,
    contactPhone: row.contact_phone,
    symptoms: row.symptoms || [],
    symptomOther: row.symptom_other || "",
    ward: row.ward,
    street: row.street,
    address: address,
    note: row.note || "",
    servicePrice: row.service_price,
    travelFee: row.travel_fee,
    discount: row.discount,
    total: row.total,
    promoCode: row.promo_code,
    paymentMethod: row.payment_method,
    paymentName: catalog.PAYMENT_NAMES[row.payment_method] || row.payment_method,
    paymentStatus: row.payment_status,
    paymentStatusName: PAYMENT_STATUS_NAMES[row.payment_status] || row.payment_status,
    status: row.status,
    createdAt: row.created_at
  };
}

// Người này có được xem / sửa lịch hẹn này không
function canAccess(session, row) {
  if (session.role === "bac-si") {
    return row.doctor_id === catalog.DEMO_DOCTOR_ID || row.user_id === session.uid;
  }
  return row.user_id === session.uid;
}

async function findByCode(code) {
  const rows = await db.select("bookings", { code: code }, { limit: 1 });
  return rows[0] || null;
}


/* ---------- 2. ĐỌC DỮ LIỆU (GET) ---------- */

async function handleGet(req, res) {
  const query = getQuery(req);

  // 2.1. Khung giờ đã có người đặt của 1 bác sĩ (công khai)
  if (query.get("slots") !== null) {
    const doctor = catalog.findDoctor(query.get("doctorId"));
    if (doctor === null) {
      throw new HttpError(400, "Không tìm thấy bác sĩ");
    }
    const rows = await db.select("bookings", {
      doctor_id: doctor.id,
      status: { neq: "da-huy" },
      booking_date: { gte: vnDateKey(0) }
    });
    sendJson(res, 200, {
      slots: rows.map(function (row) { return { date: row.booking_date, time: row.booking_time }; })
    });
    return;
  }

  const session = auth.requireUser(req);

  // 2.2. Một lịch hẹn theo mã
  const code = query.get("code");
  if (code !== null) {
    const row = await findByCode(code);
    if (row === null || canAccess(session, row) === false) {
      throw new HttpError(404, "Không tìm thấy lịch hẹn " + code);
    }
    sendJson(res, 200, { booking: toClient(row) });
    return;
  }

  // 2.3. Danh sách lịch hẹn
  const filters = session.role === "bac-si" ? { doctor_id: catalog.DEMO_DOCTOR_ID } : { user_id: session.uid };
  const rows = await db.select("bookings", filters, { order: "created_at.desc", limit: 200 });
  sendJson(res, 200, { bookings: rows.map(toClient) });
}


/* ---------- 3. TẠO LỊCH HẸN (POST) ---------- */

async function handlePost(req, res) {
  // Bắt buộc đăng nhập
  const session = auth.requireUser(req);
  const body = await readJson(req);

  // Bác sĩ và dịch vụ phải có thật
  const doctor = catalog.findDoctor(body.doctorId);
  if (doctor === null) {
    throw new HttpError(400, "Không tìm thấy bác sĩ");
  }
  const service = catalog.findService(doctor, body.serviceId);
  if (service === null) {
    throw new HttpError(400, "Gói dịch vụ không hợp lệ");
  }

  // Ngày: từ ngày mai đến 7 ngày tới (giống trang đặt lịch). Giờ: dạng HH:mm
  const date = cleanText(body.date, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) === false || date < vnDateKey(1) || date > vnDateKey(7)) {
    throw new HttpError(400, "Ngày khám phải nằm trong 7 ngày tới");
  }
  const time = cleanText(body.time, 5);
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time) === false) {
    throw new HttpError(400, "Giờ khám không hợp lệ");
  }

  const patientName = cleanText(body.patientName, 100);
  if (patientName.length < 2) {
    throw new HttpError(400, "Vui lòng nhập họ tên người được khám");
  }

  // Số điện thoại liên hệ khác: KHÔNG bắt buộc, nhưng nếu nhập thì phải đúng 10 hoặc 11 số
  const contactPhone = auth.normalizePhone(body.contactPhone);
  if (contactPhone !== "" && auth.isValidPhone(contactPhone) === false) {
    throw new HttpError(400, "Số điện thoại liên hệ phải gồm đúng 10 hoặc 11 chữ số");
  }

  // Triệu chứng: mảng các chuỗi, "Khác" thì phải có mô tả
  const symptoms = Array.isArray(body.symptoms)
    ? body.symptoms.map(function (item) { return cleanText(item, 60); }).filter(Boolean).slice(0, 20)
    : [];
  const symptomOther = symptoms.includes("Khác") ? cleanText(body.symptomOther, 200) : "";
  if (symptoms.includes("Khác") && symptomOther === "") {
    throw new HttpError(400, "Vui lòng mô tả triệu chứng khác");
  }

  // Địa chỉ: bắt buộc khi khám tại nhà, bỏ qua khi tư vấn video
  const isOnline = service.online === true;
  const ward = isOnline ? "" : cleanText(body.ward, 100);
  const street = isOnline ? "" : cleanText(body.street, 200);
  if (isOnline === false && (ward === "" || street.length < 5)) {
    throw new HttpError(400, "Vui lòng nhập đầy đủ địa chỉ khám");
  }

  const paymentMethod = catalog.PAYMENT_NAMES[body.paymentMethod] ? body.paymentMethod : "cash";
  const promoCode = cleanText(body.promoCode, 20).toUpperCase();
  const money = catalog.calculateMoney(service, promoCode, paymentMethod);

  const row = {
    user_id: session.uid,
    account_phone: session.phone,
    doctor_id: doctor.id,
    doctor_name: doctor.name,
    service_id: service.id,
    service_name: service.name,
    is_online: isOnline,
    booking_date: date,
    booking_time: time,
    patient_name: patientName,
    relation: catalog.RELATIONS.includes(body.relation) ? body.relation : "Bản thân",
    contact_phone: contactPhone === "" ? null : contactPhone,
    symptoms: symptoms,
    symptom_other: symptomOther,
    ward: ward,
    street: street,
    note: cleanText(body.note, 500),
    service_price: money.servicePrice,
    travel_fee: money.travelFee,
    discount: money.discount,
    total: money.total,
    promo_code: money.promoCode,
    payment_method: paymentMethod,
    payment_status: "chua-thanh-toan",
    status: "cho-xac-nhan"
  };

  // Mã lịch hẹn HC + 6 số ngẫu nhiên. Trùng mã (rất hiếm) thì tạo lại.
  // Trùng khung giờ (đã có người đặt) thì database báo lỗi UNIQUE -> trả 409.
  for (let attempt = 0; attempt < 3; attempt++) {
    row.code = "HC" + crypto.randomInt(100000, 1000000);
    try {
      const saved = await db.insert("bookings", row);
      sendJson(res, 201, { booking: toClient(saved) });
      return;
    } catch (error) {
      if (error instanceof db.ConflictError && String(error.message).includes("code")) {
        continue;
      }
      if (error instanceof db.ConflictError) {
        throw new HttpError(409, "Khung giờ " + time + " ngày này vừa có người đặt, vui lòng chọn giờ khác");
      }
      throw error;
    }
  }
  throw new HttpError(500, "Không tạo được mã lịch hẹn, vui lòng thử lại");
}


/* ---------- 4. ĐỔI TRẠNG THÁI (PATCH) ---------- */

async function handlePatch(req, res) {
  const session = auth.requireUser(req);
  const body = await readJson(req);
  const row = await findByCode(cleanText(body.code, 20));

  if (row === null || canAccess(session, row) === false) {
    throw new HttpError(404, "Không tìm thấy lịch hẹn");
  }

  // Ai được đổi trạng thái nào:
  //   khách hàng: chỉ được hủy lịch đang chờ / sắp tới của mình
  //   bác sĩ: xác nhận (chờ -> sắp tới), từ chối (chờ -> hủy), hoàn thành (sắp tới -> xong)
  const newStatus = body.status;
  let allowed = false;
  if (session.role === "bac-si" && row.doctor_id === catalog.DEMO_DOCTOR_ID) {
    allowed = (row.status === "cho-xac-nhan" && (newStatus === "sap-toi" || newStatus === "da-huy")) ||
      (row.status === "sap-toi" && newStatus === "hoan-thanh");
  } else {
    allowed = newStatus === "da-huy" && ACTIVE_STATUSES.includes(row.status);
  }

  if (allowed === false) {
    throw new HttpError(400, "Không thể chuyển lịch hẹn sang trạng thái này");
  }

  const updated = await db.update("bookings", { code: row.code }, { status: newStatus });
  sendJson(res, 200, { booking: toClient(updated[0]) });
}


module.exports = handle(async function (req, res) {
  if (req.method === "GET") {
    await handleGet(req, res);
  } else if (req.method === "POST") {
    await handlePost(req, res);
  } else if (req.method === "PATCH") {
    await handlePatch(req, res);
  } else {
    throw new HttpError(405, "Phương thức không được hỗ trợ");
  }
});

// Cho api/payment.js, api/vnpay-*.js dùng lại
module.exports.toClient = toClient;
