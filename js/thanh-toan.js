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

const PAYMENT_NAMES = {
  cash: "Tiền mặt khi khám xong",
  bank: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay (sandbox)"
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
const submitError = document.getElementById("submit-error");


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
// (máy chủ cũng tính lại y hệt trong api/_lib/catalog.js, không tin số tiền trình duyệt gửi)
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
        <p><strong>Nội dung:</strong> mã lịch hẹn (hiện sau khi xác nhận)</p>
      </div>`;
  } else if (method === "momo") {
    payDetail.innerHTML = `
      <div class="qr-box"><i class="fa-solid fa-qrcode"></i></div>
      <p>Mở ứng dụng MoMo, quét mã QR để thanh toán <strong>${total}</strong>.
         Ưu đãi giảm 5% đã được trừ vào tổng tiền.</p>`;
  } else if (method === "vnpay") {
    // AI prompt: "Tích hợp cổng thanh toán ở chế độ test (sandbox)"
    payDetail.innerHTML = `
      <div>
        <p><i class="fa-solid fa-circle-info"></i>
           Sau khi xác nhận, bạn được chuyển sang <strong>cổng VNPay (môi trường thử nghiệm)</strong>
           để thanh toán <strong>${total}</strong>. Không trừ tiền thật.</p>
        <div class="test-card">
          <strong>Thẻ test của VNPay:</strong> ngân hàng NCB · số thẻ <code>9704198526191432198</code> ·
          tên <code>NGUYEN VAN A</code> · ngày phát hành <code>07/15</code> · OTP <code>123456</code>
        </div>
      </div>`;
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
    submitError.textContent = "";
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


/* =========================================================
   AI prompt: "Tạo database lưu thông tin đặt lịch khám; tích hợp cổng
   thanh toán ở chế độ test (sandbox)" – mục 8 -> 9 bên dưới được viết
   với sự hỗ trợ của AI.
   ========================================================= */

/* ---------- 8. XÁC NHẬN ĐẶT LỊCH -> LƯU VÀO DATABASE ---------- */
agreeCheckbox.addEventListener("change", function () {
  agreeError.textContent = "";
});

function setConfirmLoading(isLoading, text) {
  confirmButton.disabled = isLoading;
  confirmButton.innerHTML = isLoading
    ? `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`
    : `<i class="fa-solid fa-lock"></i> Xác nhận đặt lịch`;
}

// Lưu thêm 1 bản vào localStorage để trang hồ sơ hiện ngay cả khi mất mạng
function saveLocalCopy(booking) {
  const appointments = getAppointments().filter(function (item) { return item.code !== booking.code; });
  appointments.unshift(bookingToAppointment(booking));
  saveAppointments(appointments);
}

// Gọi máy chủ tạo link VNPay rồi chuyển trang
async function goToVnpay(code) {
  const result = await callApi("/api/payment", { method: "POST", body: { code: code } });
  window.location.href = result.url;
}

paymentForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  submitError.textContent = "";

  if (agreeCheckbox.checked === false) {
    agreeError.textContent = "Bạn cần đồng ý với điều khoản trước khi đặt lịch";
    return;
  }

  setConfirmLoading(true, "Đang lưu lịch hẹn...");

  // 8.1. Gửi lịch hẹn lên máy chủ (KHÔNG gửi số tiền: máy chủ tự tính)
  let booking;
  try {
    const result = await callApi("/api/bookings", {
      method: "POST",
      body: {
        doctorId: pendingBooking.doctorId,
        serviceId: pendingBooking.serviceId,
        date: pendingBooking.date,
        time: pendingBooking.time,
        patientName: pendingBooking.patientName,
        relation: pendingBooking.relation,
        contactPhone: pendingBooking.contactPhone || "",
        symptoms: pendingBooking.symptoms || [],
        symptomOther: pendingBooking.symptomOther || "",
        ward: pendingBooking.ward,
        street: pendingBooking.street,
        note: pendingBooking.note,
        promoCode: appliedPromo || "",
        paymentMethod: getPaymentMethod()
      }
    });
    booking = result.booking;
  } catch (error) {
    setConfirmLoading(false);

    // 401: chưa đăng nhập / phiên hết hạn -> sang trang đăng nhập rồi quay lại đây (đơn tạm vẫn còn)
    if (error.status === 401) {
      window.location.href = "dang-nhap.html?next=thanh-toan.html&ly-do=het-phien";
      return;
    }
    submitError.textContent = error.message;
    return;
  }

  // 8.2. Đã lưu xong -> xóa đơn tạm, lưu bản sao cho trang hồ sơ
  removeStorage("homecare_pending");
  saveLocalCopy(booking);

  // 8.3. VNPay: chuyển sang cổng thanh toán. Cách khác: hiện màn hình thành công luôn
  if (booking.paymentMethod === "vnpay") {
    setConfirmLoading(true, "Đang chuyển sang VNPay...");
    try {
      await goToVnpay(booking.code);
    } catch (error) {
      setConfirmLoading(false);
      submitError.textContent = error.message;
    }
    return;
  }

  showResult(booking);
});


/* ---------- 9. MÀN HÌNH THÀNH CÔNG ---------- */
function showResult(booking) {
  document.getElementById("payment-area").hidden = true;
  document.getElementById("success-view").hidden = false;

  // Thanh các bước: bước 2 xong, bước 3 đang ở
  const stepItems = document.querySelectorAll("#steps li");
  stepItems[1].className = "done";
  stepItems[1].querySelector(".step-number").innerHTML = `<i class="fa-solid fa-check"></i>`;
  stepItems[2].className = "current";

  let paymentText = formatMoney(booking.total) + " – " + booking.paymentName;
  if (booking.paymentMethod === "vnpay") {
    paymentText += " (" + booking.paymentStatusName + ")";
  }

  let symptomRow = "";
  const symptomText = getSymptomText(booking.symptoms, booking.symptomOther);
  if (symptomText !== "") {
    symptomRow = `<dt>Triệu chứng</dt><dd>${escapeHTML(symptomText)}</dd>`;
  }

  document.getElementById("success-code").textContent = booking.code;
  document.getElementById("success-list").innerHTML = `
    <dt>Bác sĩ</dt><dd>${escapeHTML(booking.doctorName)}</dd>
    <dt>Dịch vụ</dt><dd>${escapeHTML(booking.serviceName)}</dd>
    <dt>Thời gian</dt><dd>${booking.time} · ${formatDate(booking.date)}</dd>
    <dt>Địa điểm</dt><dd>${escapeHTML(booking.address)}</dd>
    ${symptomRow}
    <dt>Thanh toán</dt><dd>${escapeHTML(paymentText)}</dd>`;

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
