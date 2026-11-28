/* =========================================================
   API/VNPAY-RETURN.JS - VNPAY CHUYỂN NGƯỜI DÙNG VỀ SAU KHI THANH TOÁN

   AI prompt: "Tích hợp cổng thanh toán VNPay ở chế độ test (sandbox)" –
   file này được viết với sự hỗ trợ của AI.

   GET /api/vnpay-return?vnp_Amount=...&vnp_ResponseCode=...&vnp_SecureHash=...
   -> kiểm tra chữ ký, cập nhật đơn, rồi chuyển về
      thanh-toan.html?ma=HC123456&ket-qua=thanh-cong | that-bai | loi
   (Bản thật nên dựa vào IPN; ở sandbox IPN cần cấu hình URL công khai
    trên trang quản trị VNPay, nên cập nhật luôn ở đây cho dễ chạy thử.)
   ========================================================= */

const { redirect, getQuery, handle } = require("./_lib/http");
const { applyVnpayResult } = require("./_lib/payment-result");

module.exports = handle(async function (req, res) {
  const outcome = await applyVnpayResult(getQuery(req));

  if (outcome.booking === null || outcome.code === "invalid-amount") {
    redirect(res, "/thanh-toan.html?ket-qua=loi");
    return;
  }

  const isPaid = outcome.booking.payment_status === "da-thanh-toan";
  redirect(res, "/thanh-toan.html?ma=" + encodeURIComponent(outcome.booking.code) +
    "&ket-qua=" + (isPaid ? "thanh-cong" : "that-bai"));
});
