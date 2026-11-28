/* =========================================================
   API/PAYMENT.JS - TẠO LINK THANH TOÁN VNPAY CHO 1 LỊCH HẸN

   AI prompt: "Tích hợp cổng thanh toán VNPay ở chế độ test (sandbox)" –
   file này được viết với sự hỗ trợ của AI.

   POST /api/payment  { code: "HC123456" }  -> { url: "https://sandbox.vnpayment.vn/..." }
   Trình duyệt nhận url rồi chuyển sang trang VNPay.
   ========================================================= */

const db = require("./_lib/db");
const vnpay = require("./_lib/vnpay");
const { HttpError, sendJson, readJson, getBaseUrl, getClientIp, handle } = require("./_lib/http");
const auth = require("./_lib/auth");

module.exports = handle(async function (req, res) {
  if (req.method !== "POST") {
    throw new HttpError(405, "Phương thức không được hỗ trợ");
  }

  const session = auth.requireUser(req);

  if (vnpay.isConfigured() === false) {
    throw new HttpError(503, "Máy chủ chưa cấu hình VNPay sandbox (VNP_TMN_CODE, VNP_HASH_SECRET). Vui lòng chọn phương thức khác.");
  }

  const body = await readJson(req);
  const rows = await db.select("bookings", { code: String(body.code || "") }, { limit: 1 });
  const booking = rows[0];

  if (booking === undefined || booking.user_id !== session.uid) {
    throw new HttpError(404, "Không tìm thấy lịch hẹn");
  }
  if (booking.payment_status === "da-thanh-toan") {
    throw new HttpError(400, "Lịch hẹn này đã được thanh toán");
  }
  if (booking.status === "da-huy") {
    throw new HttpError(400, "Lịch hẹn đã bị hủy");
  }

  // Mỗi lần thanh toán cần 1 mã giao dịch (vnp_TxnRef) khác nhau -> ghép mã lịch hẹn + thời gian
  const txnRef = booking.code + String(Date.now()).slice(-6);
  await db.update("bookings", { code: booking.code }, {
    vnp_txn_ref: txnRef,
    payment_method: "vnpay",
    payment_status: "cho-thanh-toan"
  });

  const url = vnpay.createPaymentUrl({
    txnRef: txnRef,
    amount: booking.total,
    orderInfo: "Thanh toan lich hen " + booking.code,   // VNPay khuyên viết không dấu
    ipAddr: getClientIp(req),
    returnUrl: getBaseUrl(req) + "/api/vnpay-return"
  });

  sendJson(res, 200, { url: url });
});
