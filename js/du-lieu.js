/* =========================================================
   DU-LIEU.JS - DỮ LIỆU MẪU VÀ HÀM DÙNG CHUNG CHO LUỒNG ĐẶT LỊCH
   Người phụ trách: THÀNH VIÊN 2

   Dùng ở: chi-tiet-bac-si.html, dat-lich.html, thanh-toan.html, ho-so.html
   (nạp file này TRƯỚC file JS riêng của từng trang)

   Nội dung:
   1. Danh sách bác sĩ / điều dưỡng (cùng id với js/dat-kham.js)
   2. Hàm định dạng: tiền, ngày, chống chèn mã HTML
   3. Dịch vụ và bảng giá của từng bác sĩ
   4. Lịch làm việc: 7 ngày tới và các khung giờ
   5. Lưu / đọc dữ liệu bằng localStorage (tài khoản, lịch hẹn)
   6. Áp dụng phần bác sĩ tự sửa ở trang hồ sơ
   ========================================================= */


/* ---------- 1. DANH SÁCH BÁC SĨ ----------
   workDays : các thứ trong tuần có làm việc (0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7)
              -> khớp với hàm getDay() của JavaScript
   startTime / endTime : giờ bắt đầu và kết thúc ca làm                      */
const doctorData = [
  {
    id: 1, name: "ThS. Trần Ngọc C", letter: "C", type: "bac-si",
    specialty: "Nội tổng quát & Lão khoa", rating: 4.9, visits: 128, experience: 12,
    workplace: "Bệnh viện Đại học Y Dược TP.HCM",
    treats: "Tăng huyết áp, Đái tháo đường, Bệnh lý tim mạch người cao tuổi",
    workDays: [1, 3, 5], startTime: "08:00", endTime: "17:00",
    price: 300000, area: "TP. Thủ Đức"
  },
  {
    id: 2, name: "BS. Trần Lê Trung D", letter: "D", type: "bac-si",
    specialty: "Cơ xương khớp & Phục hồi chức năng", rating: 4.8, visits: 94, experience: 9,
    workplace: "Bệnh viện Chấn thương Chỉnh hình TP.HCM",
    treats: "Thoát vị đĩa đệm, Đau thần kinh tọa, Tập vận động sau tai biến",
    workDays: [2, 4, 6], startTime: "07:30", endTime: "18:30",
    price: 350000, area: "TP. Thủ Đức"
  },
  {
    id: 3, name: "BS. Phạm Thị E", letter: "E", type: "bac-si",
    specialty: "Nhi khoa & Dinh dưỡng lâm sàng", rating: 5.0, visits: 150, experience: 10,
    workplace: "Bệnh viện Nhi Đồng 2",
    treats: "Viêm phế quản, Sốt virus trẻ em, Tư vấn dinh dưỡng trẻ biếng ăn",
    workDays: [1, 2, 3, 4, 5, 6], startTime: "16:30", endTime: "20:30",
    price: 280000, area: "TP. Thủ Đức"
  },
  {
    id: 4, name: "BS. Nguyễn Tuấn Đ", letter: "Đ", type: "bac-si",
    specialty: "Tai Mũi Họng & Hô hấp", rating: 4.9, visits: 82, experience: 8,
    workplace: "Bệnh viện Tai Mũi Họng TP.HCM",
    treats: "Viêm xoang cấp, Nội soi vệ sinh tai mũi họng, Dị ứng thời tiết",
    workDays: [1, 2, 4, 6], startTime: "08:00", endTime: "17:30",
    price: 300000, area: "TP. Thủ Đức"
  },
  {
    id: 5, name: "BS. Lê Hoàng G", letter: "G", type: "bac-si",
    specialty: "Tim mạch", rating: 4.7, visits: 66, experience: 15,
    workplace: "Viện Tim TP.HCM",
    treats: "Rối loạn nhịp tim, Suy tim, Theo dõi huyết áp định kỳ",
    workDays: [2, 5], startTime: "08:00", endTime: "16:00",
    price: 400000, area: "TP. Thủ Đức"
  },
  {
    id: 6, name: "BS. Đỗ Thu H", letter: "H", type: "bac-si",
    specialty: "Da liễu", rating: 4.6, visits: 58, experience: 7,
    workplace: "Bệnh viện Da liễu TP.HCM",
    treats: "Viêm da cơ địa, Mụn trứng cá, Nấm da, Dị ứng mẩn ngứa",
    workDays: [6, 0], startTime: "08:00", endTime: "12:00",
    price: 250000, area: "TP. Thủ Đức"
  },
  {
    id: 7, name: "ThS. Bùi Quang K", letter: "K", type: "bac-si",
    specialty: "Thần kinh", rating: 4.8, visits: 73, experience: 11,
    workplace: "Bệnh viện Nhân dân 115",
    treats: "Đau đầu kéo dài, Mất ngủ, Rối loạn tiền đình, Theo dõi sau đột quỵ",
    workDays: [1, 3], startTime: "13:30", endTime: "19:00",
    price: 380000, area: "TP. Thủ Đức"
  },
  {
    id: 8, name: "BS. Phan Ngọc L", letter: "L", type: "bac-si",
    specialty: "Sản phụ khoa", rating: 4.9, visits: 104, experience: 13,
    workplace: "Bệnh viện Từ Dũ",
    treats: "Khám thai định kỳ, Chăm sóc mẹ sau sinh, Tư vấn sức khỏe sinh sản",
    workDays: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00",
    price: 320000, area: "TP. Thủ Đức"
  },
  {
    id: 9, name: "ĐD. Lê Thị M", letter: "M", type: "dieu-duong",
    specialty: "Chăm sóc người cao tuổi", rating: 4.9, visits: 210, experience: 8,
    workplace: "Bệnh viện TP. Thủ Đức",
    treats: "Theo dõi sinh hiệu, Hỗ trợ vệ sinh cá nhân, Nhắc uống thuốc",
    workDays: [0, 1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "19:00",
    price: 200000, area: "TP. Thủ Đức"
  },
  {
    id: 10, name: "ĐD. Võ Văn N", letter: "N", type: "dieu-duong",
    specialty: "Chăm sóc vết thương", rating: 4.8, visits: 165, experience: 6,
    workplace: "Bệnh viện Lê Văn Thịnh",
    treats: "Thay băng, Rửa vết thương, Cắt chỉ sau phẫu thuật",
    workDays: [1, 2, 3, 4, 5, 6], startTime: "08:00", endTime: "18:00",
    price: 220000, area: "TP. Thủ Đức"
  },
  {
    id: 11, name: "ĐD. Ngô Thị P", letter: "P", type: "dieu-duong",
    specialty: "Tiêm truyền tại nhà", rating: 4.7, visits: 189, experience: 9,
    workplace: "Bệnh viện Quân dân y miền Đông",
    treats: "Truyền dịch, Tiêm thuốc theo đơn bác sĩ, Lấy máu xét nghiệm",
    workDays: [0, 1, 2, 3, 4, 5, 6], startTime: "06:30", endTime: "20:00",
    price: 250000, area: "TP. Thủ Đức"
  },
  {
    id: 12, name: "ĐD. Huỳnh Minh Q", letter: "Q", type: "dieu-duong",
    specialty: "Vật lý trị liệu", rating: 4.6, visits: 97, experience: 5,
    workplace: "Bệnh viện Phục hồi chức năng TP.HCM",
    treats: "Tập vận động, Xoa bóp phục hồi, Hướng dẫn bài tập tại nhà",
    workDays: [2, 4, 6], startTime: "14:00", endTime: "20:00",
    price: 230000, area: "TP. Thủ Đức"
  }
];

// Phí di chuyển cố định cho mỗi lượt đến nhà
const TRAVEL_FEE = 30000;

// Tên hiển thị của các trạng thái lịch hẹn
const STATUS_NAMES = {
  "cho-xac-nhan": "Chờ xác nhận",
  "sap-toi": "Sắp tới",
  "hoan-thanh": "Đã hoàn thành",
  "da-huy": "Đã hủy"
};


/* ---------- 2. HÀM ĐỊNH DẠNG ---------- */

// 300000 -> "300.000đ"
function formatMoney(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

// Tìm bác sĩ theo id. id lấy từ link (?id=3) là chuỗi "3" -> đổi sang số
function findDoctor(id) {
  const idNumber = Number(id);
  for (const doctor of doctorData) {
    if (doctor.id === idNumber) {
      return doctor;
    }
  }
  return null;              // không tìm thấy
}

// Đổi các ký tự đặc biệt của HTML thành dạng an toàn.
// Dùng khi đưa chữ NGƯỜI DÙNG GÕ vào innerHTML, tránh lỗi bảo mật XSS
// (VD: người dùng gõ <script> vào ô địa chỉ thì chỉ hiện ra chữ, không chạy).
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


/* ---------- 3. DỊCH VỤ CỦA TỪNG BÁC SĨ ----------
   Giá dịch vụ tính theo giá khám của bác sĩ đó.
   online: true -> dịch vụ qua video, không tính phí di chuyển */
function getServices(doctor) {
  if (doctor.type === "dieu-duong") {
    return [
      { id: "cham-soc-2h", name: "Chăm sóc tại nhà (2 giờ)", duration: "120 phút", price: doctor.price,
        desc: "Điều dưỡng đến nhà chăm sóc theo yêu cầu" },
      { id: "cham-soc-4h", name: "Chăm sóc tại nhà (4 giờ)", duration: "240 phút", price: doctor.price * 2 - 50000,
        desc: "Tiết kiệm hơn so với đặt 2 lần lẻ" },
      { id: "lay-mau", name: "Lấy mẫu xét nghiệm tại nhà", duration: "20 phút", price: 120000,
        desc: "Mẫu được gửi về phòng xét nghiệm đạt chuẩn ISO 15189" },
      { id: "tiem-truyen", name: "Tiêm / truyền dịch theo đơn", duration: "30 - 90 phút", price: doctor.price + 80000,
        desc: "Bắt buộc có đơn thuốc của bác sĩ" }
    ];
  }

  return [
    { id: "kham-tai-nha", name: "Khám bệnh tại nhà", duration: "45 - 60 phút", price: doctor.price,
      desc: "Bác sĩ đến tận nhà thăm khám, tư vấn và kê đơn" },
    { id: "tai-kham", name: "Tái khám tại nhà", duration: "30 phút", price: Math.round(doctor.price * 0.7 / 1000) * 1000,
      desc: "Dành cho người bệnh đã khám trong vòng 30 ngày" },
    { id: "kham-xet-nghiem", name: "Khám + xét nghiệm máu cơ bản", duration: "60 - 75 phút", price: doctor.price + 250000,
      desc: "Lấy mẫu tại nhà, trả kết quả online sau 24 giờ" },
    { id: "tu-van-video", name: "Tư vấn qua video", duration: "30 phút", price: 150000,
      desc: "Gọi video với bác sĩ, không mất phí di chuyển", online: true }
  ];
}

// Tìm 1 dịch vụ theo id trong danh sách dịch vụ của bác sĩ
function findService(doctor, serviceId) {
  for (const service of getServices(doctor)) {
    if (service.id === serviceId) {
      return service;
    }
  }
  return null;
}


/* ---------- 4. LỊCH LÀM VIỆC ---------- */
const WEEKDAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

// Cộng thêm số ngày vào ngày hôm nay (số âm = lùi về quá khứ)
function addDays(dayCount) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayCount);
  return date;
}

// Date -> "2026-11-25" (dạng dùng để lưu và gắn vào link)
// padStart(2, "0"): thêm số 0 phía trước cho đủ 2 chữ số (5 -> "05")
function toDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

// "2026-11-25" -> đối tượng Date
function fromDateKey(dateKey) {
  const parts = dateKey.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// "2026-11-25" -> "Thứ 4, 25/11/2026"
function formatDate(dateKey) {
  const date = fromDateKey(dateKey);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return WEEKDAY_NAMES[date.getDay()] + ", " + day + "/" + month + "/" + date.getFullYear();
}

// Lấy 7 ngày tới, bắt đầu từ NGÀY MAI (phải đặt trước ít nhất 1 ngày)
function getNextDays() {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    days.push(addDays(i));
  }
  return days;
}

// Bác sĩ có làm việc vào ngày này không?
function isWorkingDay(doctor, date) {
  return doctor.workDays.includes(date.getDay());
}

// "08:30" -> 510 (số phút tính từ 0 giờ), để dễ cộng trừ
function toMinutes(time) {
  const parts = time.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

// 510 -> "08:30"
function toTimeText(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return hour + ":" + minute;
}

// Chia ca làm thành các khung 1 tiếng. Ca 08:00 - 12:00 -> 08:00, 09:00, 10:00, 11:00
function getTimeSlots(doctor) {
  const slots = [];
  const end = toMinutes(doctor.endTime);
  for (let time = toMinutes(doctor.startTime); time + 60 <= end; time += 60) {
    slots.push(toTimeText(time));
  }
  return slots;
}

// Giả lập khung giờ đã có người đặt (chưa có máy chủ nên tính theo công thức cố định:
// cùng ngày, cùng giờ thì kết quả luôn giống nhau mỗi lần mở trang)
function isSlotBooked(doctor, dateKey, slotIndex) {
  const day = fromDateKey(dateKey).getDate();
  return (day + slotIndex * 3 + doctor.id) % 5 === 0;
}


/* ---------- 5. LƯU TRỮ BẰNG LOCALSTORAGE ----------
   localStorage lưu dữ liệu ngay trong trình duyệt, tắt máy mở lại vẫn còn.
   Chỉ lưu được CHUỖI -> dùng JSON.stringify để đổi mảng/object thành chuỗi,
   JSON.parse để đổi ngược lại.
   Bọc trong try...catch vì một số trình duyệt (chế độ ẩn danh) có thể chặn. */
function readStorage(key, defaultValue) {
  try {
    const text = localStorage.getItem(key);
    if (text === null) {
      return defaultValue;
    }
    return JSON.parse(text);
  } catch (error) {
    return defaultValue;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Không lưu được thì bỏ qua, trang vẫn chạy bình thường
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // bỏ qua
  }
}

// Tài khoản đang đăng nhập (do js/dang-nhap.js lưu), chưa đăng nhập thì null
function getCurrentUser() {
  return readStorage("homecare_user", null);
}

// Danh sách lịch hẹn của khách hàng.
// Lần đầu mở (chưa có gì) -> tạo sẵn 3 lịch hẹn mẫu để trang hồ sơ không bị trống.
function getAppointments() {
  let list = readStorage("homecare_appointments", null);

  if (list === null) {
    list = [
      {
        code: "HC204517", doctorId: 1, serviceId: "kham-tai-nha",
        date: toDateKey(addDays(3)), time: "09:00",
        patientName: "Nguyễn Văn A", phone: "0901234567",
        address: "12 Đường số 6, P. Linh Trung, TP. Thủ Đức",
        total: 330000, payment: "Tiền mặt khi khám xong", status: "sap-toi"
      },
      {
        code: "HC198342", doctorId: 3, serviceId: "kham-tai-nha",
        date: toDateKey(addDays(-12)), time: "17:30",
        patientName: "Nguyễn Minh K (con)", phone: "0901234567",
        address: "12 Đường số 6, P. Linh Trung, TP. Thủ Đức",
        total: 310000, payment: "Ví MoMo", status: "hoan-thanh"
      },
      {
        code: "HC187725", doctorId: 9, serviceId: "cham-soc-2h",
        date: toDateKey(addDays(-25)), time: "08:00",
        patientName: "Nguyễn Văn B (bố)", phone: "0901234567",
        address: "12 Đường số 6, P. Linh Trung, TP. Thủ Đức",
        total: 230000, payment: "Chuyển khoản ngân hàng", status: "da-huy"
      }
    ];
    writeStorage("homecare_appointments", list);
  }

  return list;
}

function saveAppointments(list) {
  writeStorage("homecare_appointments", list);
}


/* ---------- 6. ÁP DỤNG PHẦN BÁC SĨ TỰ SỬA ----------
   Bác sĩ sửa hồ sơ / lịch làm việc ở trang ho-so.html -> lưu vào localStorage.
   Mỗi lần nạp file này, chép phần đã sửa đè lên dữ liệu gốc,
   nhờ vậy trang hồ sơ công khai và trang đặt lịch hiện đúng thông tin mới. */
const doctorEdits = readStorage("homecare_doctor_profile", null);
if (doctorEdits !== null) {
  const editedDoctor = findDoctor(doctorEdits.id);
  if (editedDoctor !== null) {
    Object.assign(editedDoctor, doctorEdits);
  }
}
