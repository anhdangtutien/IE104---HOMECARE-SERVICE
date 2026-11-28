/* =========================================================
   THANH-TOAN.JS - TRANG THANH TOÁN & XÁC NHẬN
   Người phụ trách: THÀNH VIÊN 2
   Cần nạp js/du-lieu.js trước file này.

   Chức năng:
   1. Đọc đơn tạm (do dat-lich.js lưu) và hiện thông tin lịch hẹn
   2. Đổi phương thức thanh toán -> hiện hướng dẫn tương ứng
   3. Áp dụng mã giảm giá, tính lại tổng tiền
   4. Xác nhận: tạo mã lịch hẹn, lưu vào danh sách lịch hẹn, hiện màn hình thành công
   ========================================================= */


/* ---------- 1. ĐỌC ĐƠN TẠM ---------- */
const pendingBooking = readStorage("homecare_pending", null);

let payDoctor = null;
let payService = null;
if (pendingBooking !== null) {
  payDoctor = findDoctor(pendingBooking.doctorId);
  if (payDoctor !== null) {
    payService = findService(payDoctor, pendingBooking.serviceId);
  }
}

// Mã lịch hẹn: "HC" + 6 chữ số ngẫu nhiên. Tạo sẵn để dùng làm nội dung chuyển khoản
const bookingCode = "HC" + Math.floor(100000 + Math.random() * 900000);

const PAYMENT_NAMES = {
  cash: "Tiền mặt khi khám xong",
  bank: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  card: "Thẻ ATM / Visa / Mastercard"
};

// Mã giảm giá đang áp dụng (null = chưa có)
let appliedPromo = null;


/* ---------- 2. LẤY CÁC PHẦN TỬ HTML ---------- */
const paymentForm = document.getElementById("payment-form");
const payDetail = document.getElementById("pay-detail");
const promoInput = document.getElementById("promo-input");
const promoButton = document.getElementById("promo-button");
const promoMessage = document.getElementById("promo-message");
const agreeCheckbox = document.getElementById("agree-checkbox");
const agreeError = document.getElementById("agree-error");
const confirmButton = document.getElementById("confirm-button");


/* ---------- 3. CÁC HÀM TÍNH TOÁN ---------- */

// Phương thức đang chọn: tìm radio name="payment" đang được tích
function getPaymentMethod() {
  return document.querySelector('input[name="payment"]:checked').value;
}

// Địa chỉ đầy đủ (tư vấn video thì không có địa chỉ)
function getFullAddress(booking) {
  if (!booking.street) {         // chuỗi rỗng hoặc không có -> là tư vấn video
    return "Tư vấn qua video (link gửi qua SMS)";
  }
  return booking.street + ", " + booking.ward + ", TP. Thủ Đức";
}

// Tính tất cả các khoản tiền, trả về 1 object
function calculateMoney() {
  const subtotal = pendingBooking.servicePrice + pendingBooking.travelFee;
  let discount = 0;

  if (appliedPromo === "HOMECARE10") {
    // Giảm 10% phí dịch vụ, tối đa 50.000đ. Math.min lấy số nhỏ hơn
    discount = Math.min(Math.round(pendingBooking.servicePrice * 0.1), 50000);
  } else if (appliedPromo === "GIAM50K") {
    discount = 50000;
  }

  // Ví MoMo giảm thêm 5%, tối đa 20.000đ
  if (getPaymentMethod() === "momo") {
    discount += Math.min(Math.round(pendingBooking.servicePrice * 0.05), 20000);
  }

  return {
    subtotal: subtotal,
    discount: discount,
    total: subtotal - discount
  };
}

// Danh sách triệu chứng để hiển thị: ["Sốt", "Khác"] + "đau vai" -> "Sốt, đau vai"
function getSymptomText(symptoms, otherText) {
  const list = (symptoms || []).filter(function (item) { return item !== "Khác"; });
  if (otherText) {
    list.push(otherText);
  }
  return list.join(", ");
}


/* ---------- 4. HIỆN THÔNG TIN LỊCH HẸN ---------- */
function renderAppointmentInfo() {
  document.getElementById("edit-link").href = "dat-lich.html?id=" + payDoctor.id;

  // Chữ do người dùng gõ (tên, địa chỉ, ghi chú) phải qua escapeHTML trước khi đưa vào innerHTML
  let extraRows = "";
  if (pendingBooking.contactPhone) {
    extraRows += `<dt>SĐT liên hệ khác</dt><dd>${escapeHTML(pendingBooking.contactPhone)}</dd>`;
  }
  const symptomText = getSymptomText(pendingBooking.symptoms, pendingBooking.symptomOther);
  if (symptomText !== "") {
    extraRows += `<dt>Triệu chứng</dt><dd>${escapeHTML(symptomText)}</dd>`;
  }
  if (pendingBooking.note) {
    extraRows += `<dt>Ghi chú</dt><dd>${escapeHTML(pendingBooking.note)}</dd>`;
  }

  document.getElementById("appointment-info").innerHTML = `
    <div class="info-doctor">
      <div class="avatar">${escapeHTML(payDoctor.letter)}</div>
      <div>
        <strong>${escapeHTML(payDoctor.name)}</strong>
        <small>${escapeHTML(payDoctor.specialty)}</small>
      </div>
    </div>
    <dl class="info-list">
      <dt>Dịch vụ</dt><dd>${payService.name}</dd>
      <dt>Thời gian</dt><dd>${pendingBooking.time} · ${formatDate(pendingBooking.date)}</dd>
      <dt>Địa điểm</dt><dd>${escapeHTML(getFullAddress(pendingBooking))}</dd>
      <dt>Người được khám</dt><dd>${escapeHTML(pendingBooking.patientName)} (${escapeHTML(pendingBooking.relation)})</dd>
      <dt>Tài khoản đặt lịch</dt><dd>${escapeHTML(pendingBooking.accountPhone || "")}</dd>
      ${extraRows}
    </dl>`;
}


/* ---------- 5. CẬP NHẬT TIỀN Ở CỘT PHẢI ---------- */
function updateMoney() {
  const money = calculateMoney();
  document.getElementById("pay-price").textContent = formatMoney(pendingBooking.servicePrice);
  document.getElementById("pay-travel").textContent = formatMoney(pendingBooking.travelFee);
  document.getElementById("pay-discount").textContent = "-" + formatMoney(money.discount);
  document.getElementById("pay-total").textContent = formatMoney(money.total);
}


/* ---------- 6. HƯỚNG DẪN THEO PHƯƠNG THỨC THANH TOÁN ---------- */
function renderPayDetail() {
  const method = getPaymentMethod();
  const total = formatMoney(calculateMoney().total);

  if (method === "bank") {
    payDetail.innerHTML = `
      <div class="qr-box"><i class="fa-solid fa-qrcode"></i></div>
      <div>
        <p><strong>Ngân hàng:</strong> Vietcombank – CN Thủ Đức</p>
        <p><strong>Số tài khoản:</strong> 1023 4567 89</p>
        <p><strong>Chủ tài khoản:</strong> CONG TY HOMECARE</p>
        <p><strong>Số tiền:</strong> ${total}</p>
        <p><strong>Nội dung:</strong> ${bookingCode}</p>
      </div>`;
  } else if (method === "momo") {
    payDetail.innerHTML = `
      <div class="qr-box"><i class="fa-solid fa-qrcode"></i></div>
      <p>Mở ứng dụng MoMo, quét mã QR để thanh toán <strong>${total}</strong>.
         Ưu đãi giảm 5% đã được trừ vào tổng tiền.</p>`;
  } else if (method === "card") {
    payDetail.innerHTML = `
      <p><i class="fa-solid fa-circle-info"></i>
         Sau khi xác nhận, bạn sẽ được chuyển sang cổng VNPAY để nhập thông tin thẻ.
         HomeCare không lưu số thẻ của bạn.</p>`;
  } else {
    payDetail.innerHTML = `
      <p><i class="fa-solid fa-circle-info"></i>
         Vui lòng chuẩn bị <strong>${total}</strong> để thanh toán cho bác sĩ sau khi khám xong.
         Bác sĩ sẽ gửi hóa đơn điện tử qua SMS.</p>`;
  }
}

const paymentRadios = document.querySelectorAll('input[name="payment"]');
for (const radio of paymentRadios) {
  radio.addEventListener("change", function () {
    updateMoney();
    renderPayDetail();
  });
}


/* ---------- 7. MÃ GIẢM GIÁ ---------- */
function showPromoMessage(text, isOk) {
  promoMessage.textContent = text;
  promoMessage.classList.toggle("ok", isOk);
  promoMessage.classList.toggle("fail", isOk === false);
}

promoButton.addEventListener("click", function () {
  const code = promoInput.value.trim().toUpperCase();
  const subtotal = pendingBooking.servicePrice + pendingBooking.travelFee;

  if (code === "") {
    showPromoMessage("Vui lòng nhập mã giảm giá", false);
    return;
  }

  if (code === "HOMECARE10") {
    appliedPromo = code;
    showPromoMessage("Đã áp dụng mã HOMECARE10: giảm 10% phí dịch vụ", true);
  } else if (code === "GIAM50K") {
    if (subtotal < 300000) {
      appliedPromo = null;
      showPromoMessage("Mã GIAM50K chỉ dùng cho đơn từ 300.000đ", false);
    } else {
      appliedPromo = code;
      showPromoMessage("Đã áp dụng mã GIAM50K: giảm 50.000đ", true);
    }
  } else {
    appliedPromo = null;
    showPromoMessage("Mã giảm giá không tồn tại hoặc đã hết hạn", false);
  }

  updateMoney();
  renderPayDetail();
});

// Nhấn Enter trong ô mã giảm giá -> áp dụng mã (không gửi cả form)
promoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    promoButton.click();
  }
});


/* ---------- 8. XÁC NHẬN ĐẶT LỊCH ---------- */
agreeCheckbox.addEventListener("change", function () {
  agreeError.textContent = "";
});

paymentForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (agreeCheckbox.checked === false) {
    agreeError.textContent = "Bạn cần đồng ý với điều khoản trước khi đặt lịch";
    return;
  }

  // Giả lập thời gian chờ máy chủ xử lý (0,8 giây)
  confirmButton.disabled = true;
  confirmButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...`;

  setTimeout(function () {
    const appointment = {
      code: bookingCode,
      doctorId: payDoctor.id,
      serviceId: payService.id,
      date: pendingBooking.date,
      time: pendingBooking.time,
      patientName: pendingBooking.patientName + (pendingBooking.relation === "Bản thân" ? "" : " (" + pendingBooking.relation.toLowerCase() + ")"),
      phone: pendingBooking.phone,
      address: getFullAddress(pendingBooking),
      note: pendingBooking.note,
      total: calculateMoney().total,
      payment: PAYMENT_NAMES[getPaymentMethod()],
      status: "cho-xac-nhan"
    };

    // Thêm lịch hẹn mới lên ĐẦU danh sách (unshift), rồi lưu lại
    const appointments = getAppointments();
    appointments.unshift(appointment);
    saveAppointments(appointments);

    // Đã đặt xong -> xóa đơn tạm
    removeStorage("homecare_pending");

    showSuccess(appointment);
  }, 800);
});


/* ---------- 9. MÀN HÌNH THÀNH CÔNG ---------- */
function showSuccess(appointment) {
  document.getElementById("payment-area").hidden = true;
  document.getElementById("success-view").hidden = false;

  // Thanh các bước: bước 2 xong, bước 3 đang ở
  const stepItems = document.querySelectorAll("#steps li");
  stepItems[1].className = "done";
  stepItems[1].querySelector(".step-number").innerHTML = `<i class="fa-solid fa-check"></i>`;
  stepItems[2].className = "current";

  document.getElementById("success-code").textContent = appointment.code;
  document.getElementById("success-list").innerHTML = `
    <dt>Bác sĩ</dt><dd>${payDoctor.name}</dd>
    <dt>Dịch vụ</dt><dd>${payService.name}</dd>
    <dt>Thời gian</dt><dd>${appointment.time} · ${formatDate(appointment.date)}</dd>
    <dt>Địa điểm</dt><dd>${escapeHTML(appointment.address)}</dd>
    <dt>Thanh toán</dt><dd>${formatMoney(appointment.total)} – ${appointment.payment}</dd>`;

  window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ---------- 10. CHẠY KHI MỞ TRANG ---------- */
if (pendingBooking === null || payDoctor === null || payService === null) {
  // Vào thẳng trang này mà chưa chọn lịch -> báo và dẫn về trang đặt khám
  document.getElementById("payment-area").innerHTML = `
    <div class="empty-box">
      <i class="fa-regular fa-calendar-xmark"></i>
      <h3>Chưa có lịch hẹn nào đang chờ thanh toán</h3>
      <p>Hãy chọn bác sĩ và thời gian khám trước nhé.</p>
      <a href="dat-kham.html" class="btn btn-primary">Đặt lịch khám</a>
    </div>`;
} else {
  renderAppointmentInfo();
  updateMoney();
  renderPayDetail();
}
