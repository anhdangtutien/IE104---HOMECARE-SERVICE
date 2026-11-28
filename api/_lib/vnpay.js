/* =========================================================
   API/_LIB/VNPAY.JS - CỔNG THANH TOÁN VNPAY (MÔI TRƯỜNG SANDBOX)

   AI prompt: "Tích hợp cổng thanh toán VNPay ở chế độ test (sandbox)" –
   phần code này được viết với sự hỗ trợ của AI, theo tài liệu
   VNPay Payment API v2.1.0.

   Luồng thanh toán:
   1. Máy chủ tạo link thanh toán: các tham số vnp_... sắp xếp theo
      tên, nối thành chuỗi, ký bằng HMAC-SHA512 với "Hash Secret".
   2. Trình duyệt chuyển sang trang VNPay, người dùng nhập thẻ test.
   3. VNPay chuyển người dùng về vnp_ReturnUrl (api/vnpay-return.js)
      và gọi ngầm IPN (api/vnpay-ipn.js), cả hai đều kèm chữ ký.
      Máy chủ ký lại để kiểm tra -> đúng mới cập nhật đơn.

   Lấy TMN Code + Hash Secret: đăng ký miễn phí tại
   https://sandbox.vnpayment.vn/devreg/ (VNPay gửi qua email).
   ========================================================= */

const crypto = require("crypto");

const TMN_CODE = process.env.VNP_TMN_CODE || "";
const HASH_SECRET = process.env.VNP_HASH_SECRET || "";
const PAY_URL = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

function isConfigured() {
  return TMN_CODE !== "" && HASH_SECRET !== "";
}

// Ngày giờ theo múi giờ Việt Nam, dạng yyyyMMddHHmmss (VD: 20261127153000)
function formatVnpDate(date) {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = function (number) { return String(number).padStart(2, "0"); };
  return vn.getUTCFullYear() + pad(vn.getUTCMonth() + 1) + pad(vn.getUTCDate()) +
    pad(vn.getUTCHours()) + pad(vn.getUTCMinutes()) + pad(vn.getUTCSeconds());
}

// Sắp xếp tham số theo tên rồi nối lại (cách VNPay quy định, khoảng trắng -> "+")
function buildSignData(params) {
  return Object.keys(params)
    .sort()
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]).replace(/%20/g, "+");
    })
    .join("&");
}

function signData(text) {
  return crypto.createHmac("sha512", HASH_SECRET).update(Buffer.from(text, "utf8")).digest("hex");
}

// Tạo link chuyển sang trang thanh toán VNPay
function createPaymentUrl(options) {
  const now = new Date();
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: options.txnRef,
    vnp_OrderInfo: options.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(options.amount * 100),   // VNPay tính theo đơn vị 1/100 đồng
    vnp_ReturnUrl: options.returnUrl,
    vnp_IpAddr: options.ipAddr,
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(new Date(now.getTime() + 15 * 60 * 1000))
  };

  const data = buildSignData(params);
  return PAY_URL + "?" + data + "&vnp_SecureHash=" + signData(data);
}

// Kiểm tra chữ ký trên dữ liệu VNPay gửi về. Trả về object các tham số vnp_...
function verifyResult(searchParams) {
  const params = {};
  let secureHash = "";

  for (const [key, value] of searchParams) {
    if (key === "vnp_SecureHash") {
      secureHash = value;
    } else if (key.startsWith("vnp_") && key !== "vnp_SecureHashType") {
      params[key] = value;
    }
  }

  const expected = signData(buildSignData(params));
  const isValid = secureHash !== "" &&
    expected.length === secureHash.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(secureHash.toLowerCase()));

  return {
    isValid: isValid,
    params: params,
    isSuccess: params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00",
    amount: Number(params.vnp_Amount) / 100
  };
}

module.exports = {
  isConfigured,
  createPaymentUrl,
  verifyResult
};
