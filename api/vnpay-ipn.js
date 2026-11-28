/* =========================================================
   API/VNPAY-IPN.JS - VNPAY GỌI NGẦM BÁO KẾT QUẢ THANH TOÁN (IPN)

   AI prompt: "Tích hợp cổng thanh toán VNPay ở chế độ test (sandbox)" –
   file này được viết với sự hỗ trợ của AI.

   GET /api/vnpay-ipn?vnp_...  (máy chủ VNPay gọi, không phải người dùng)
   Phải trả về JSON { RspCode, Message } đúng quy định của VNPay.
   Muốn dùng: khai báo URL https://<ten-mien>/api/vnpay-ipn ở trang
   quản trị sandbox của VNPay.
   ========================================================= */

const { sendJson, getQuery, handle } = require("./_lib/http");
const { applyVnpayResult } = require("./_lib/payment-result");

const RESPONSES = {
  "success": { RspCode: "00", Message: "Confirm Success" },
  "failed": { RspCode: "00", Message: "Confirm Success" },
  "already-confirmed": { RspCode: "02", Message: "Order already confirmed" },
  "not-found": { RspCode: "01", Message: "Order not found" },
  "invalid-amount": { RspCode: "04", Message: "Invalid amount" },
  "invalid-signature": { RspCode: "97", Message: "Invalid signature" }
};

module.exports = handle(async function (req, res) {
  try {
    const outcome = await applyVnpayResult(getQuery(req));
    sendJson(res, 200, RESPONSES[outcome.code]);
  } catch (error) {
    console.error(error);
    sendJson(res, 200, { RspCode: "99", Message: "Unknown error" });
  }
});
