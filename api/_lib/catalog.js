/* =========================================================
   API/_LIB/CATALOG.JS - BẢNG GIÁ PHÍA MÁY CHỦ

   AI prompt: "Máy chủ tự tính tiền lịch hẹn, không tin số tiền do
   trình duyệt gửi lên" – phần code này được viết với sự hỗ trợ của AI.

   Vì sao phải có file này? Nếu máy chủ lấy luôn số tiền trình duyệt gửi,
   người dùng có thể sửa thành 1.000đ rồi thanh toán VNPay. Nên máy chủ
   giữ một bản giá riêng (CHÉP TỪ js/du-lieu.js, sửa giá thì sửa cả 2 nơi)
   và tự tính lại.
   ========================================================= */

const DOCTORS = [
  { id: 1, name: "ThS. Trần Ngọc C", type: "bac-si", price: 300000 },
  { id: 2, name: "BS. Trần Lê Trung D", type: "bac-si", price: 350000 },
  { id: 3, name: "BS. Phạm Thị E", type: "bac-si", price: 280000 },
  { id: 4, name: "BS. Nguyễn Tuấn Đ", type: "bac-si", price: 300000 },
  { id: 5, name: "BS. Lê Hoàng G", type: "bac-si", price: 400000 },
  { id: 6, name: "BS. Đỗ Thu H", type: "bac-si", price: 250000 },
  { id: 7, name: "ThS. Bùi Quang K", type: "bac-si", price: 380000 },
  { id: 8, name: "BS. Phan Ngọc L", type: "bac-si", price: 320000 },
  { id: 9, name: "ĐD. Lê Thị M", type: "dieu-duong", price: 200000 },
  { id: 10, name: "ĐD. Võ Văn N", type: "dieu-duong", price: 220000 },
  { id: 11, name: "ĐD. Ngô Thị P", type: "dieu-duong", price: 250000 },
  { id: 12, name: "ĐD. Huỳnh Minh Q", type: "dieu-duong", price: 230000 }
];

const TRAVEL_FEE = 30000;

// Đồ án chưa có tài khoản bác sĩ riêng: mọi tài khoản bác sĩ đều xem như bác sĩ id = 1
// (giống DEMO_DOCTOR_ID trong js/ho-so.js)
const DEMO_DOCTOR_ID = 1;

const PAYMENT_NAMES = {
  cash: "Tiền mặt khi khám xong",
  bank: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay (sandbox)"
};

const RELATIONS = ["Bản thân", "Bố / mẹ", "Con", "Vợ / chồng", "Người thân khác"];

function findDoctor(id) {
  return DOCTORS.find(function (doctor) { return doctor.id === Number(id); }) || null;
}

// Giống hàm getServices() trong js/du-lieu.js
function getServices(doctor) {
  if (doctor.type === "dieu-duong") {
    return [
      { id: "cham-soc-2h", name: "Chăm sóc tại nhà (2 giờ)", price: doctor.price },
      { id: "cham-soc-4h", name: "Chăm sóc tại nhà (4 giờ)", price: doctor.price * 2 - 50000 },
      { id: "lay-mau", name: "Lấy mẫu xét nghiệm tại nhà", price: 120000 },
      { id: "tiem-truyen", name: "Tiêm / truyền dịch theo đơn", price: doctor.price + 80000 }
    ];
  }
  return [
    { id: "kham-tai-nha", name: "Khám bệnh tại nhà", price: doctor.price },
    { id: "tai-kham", name: "Tái khám tại nhà", price: Math.round(doctor.price * 0.7 / 1000) * 1000 },
    { id: "kham-xet-nghiem", name: "Khám + xét nghiệm máu cơ bản", price: doctor.price + 250000 },
    { id: "tu-van-video", name: "Tư vấn qua video", price: 150000, online: true }
  ];
}

function findService(doctor, serviceId) {
  return getServices(doctor).find(function (service) { return service.id === serviceId; }) || null;
}

// Giống hàm calculateMoney() trong js/thanh-toan.js
function calculateMoney(service, promoCode, paymentMethod) {
  const servicePrice = service.price;
  const travelFee = service.online === true ? 0 : TRAVEL_FEE;
  let discount = 0;
  let appliedPromo = null;

  if (promoCode === "HOMECARE10") {
    discount = Math.min(Math.round(servicePrice * 0.1), 50000);
    appliedPromo = promoCode;
  } else if (promoCode === "GIAM50K" && servicePrice + travelFee >= 300000) {
    discount = 50000;
    appliedPromo = promoCode;
  }

  if (paymentMethod === "momo") {
    discount += Math.min(Math.round(servicePrice * 0.05), 20000);
  }

  return {
    servicePrice: servicePrice,
    travelFee: travelFee,
    discount: discount,
    total: servicePrice + travelFee - discount,
    promoCode: appliedPromo
  };
}

module.exports = {
  TRAVEL_FEE,
  DEMO_DOCTOR_ID,
  PAYMENT_NAMES,
  RELATIONS,
  findDoctor,
  findService,
  calculateMoney
};
