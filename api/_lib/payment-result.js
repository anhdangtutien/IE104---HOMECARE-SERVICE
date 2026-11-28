/* =========================================================
   API/_LIB/PAYMENT-RESULT.JS - GHI KẾT QUẢ THANH TOÁN VNPAY VÀO DATABASE

   AI prompt: "Tích hợp cổng thanh toán VNPay ở chế độ test (sandbox)" –
   phần code này được viết với sự hỗ trợ của AI.

   Dùng chung cho api/vnpay-return.js (người dùng quay về) và
   api/vnpay-ipn.js (VNPay gọi ngầm tới máy chủ).
   ========================================================= */

const db = require("./db");
const vnpay = require("./vnpay");

// Trả về { code: mã kết quả, booking } :
//   "invalid-signature" | "not-found" | "invalid-amount" | "already-confirmed" | "success" | "failed"
async function applyVnpayResult(searchParams) {
  const result = vnpay.verifyResult(searchParams);
  if (result.isValid === false) {
    return { code: "invalid-signature", booking: null };
  }

  const rows = await db.select("bookings", { vnp_txn_ref: result.params.vnp_TxnRef }, { limit: 1 });
  const booking = rows[0];
  if (booking === undefined) {
    return { code: "not-found", booking: null };
  }
  if (result.amount !== booking.total) {
    return { code: "invalid-amount", booking: booking };
  }
  if (booking.payment_status === "da-thanh-toan" || booking.payment_status === "that-bai") {
    return { code: "already-confirmed", booking: booking };
  }

  const changes = result.isSuccess
    ? {
      payment_status: "da-thanh-toan",
      vnp_transaction_no: result.params.vnp_TransactionNo || null,
      vnp_bank_code: result.params.vnp_BankCode || null,
      paid_at: new Date().toISOString()
    }
    : { payment_status: "that-bai" };

  const updated = await db.update("bookings", { code: booking.code }, changes);
  return { code: result.isSuccess ? "success" : "failed", booking: updated[0] || booking };
}

module.exports = { applyVnpayResult };
