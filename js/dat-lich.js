/* =========================================================
   DAT-LICH.JS - TRANG ĐẶT LỊCH KHÁM & CHỌN GÓI DỊCH VỤ
   Người phụ trách: THÀNH VIÊN 2
   Cần nạp js/du-lieu.js trước file này.

   Chức năng:
   1. Đọc bác sĩ, gói, ngày, giờ từ link (dat-lich.html?id=1&dv=...&ngay=...&gio=...)
   2. Tạo các lựa chọn: gói dịch vụ, 7 ngày tới, khung giờ trống
   3. Cập nhật khung tóm tắt + tính tiền mỗi khi chọn
   4. Kiểm tra form, lưu đơn tạm vào localStorage rồi sang trang thanh toán
   ========================================================= */


/* ---------- 1. ĐỌC THAM SỐ TRÊN LINK ---------- */
const bookingParams = new URLSearchParams(window.location.search);
const bookingDoctor = findDoctor(bookingParams.get("id"));


/* ---------- 2. BIẾN LƯU LỰA CHỌN HIỆN TẠI ---------- */
let selectedServiceId = null;   // VD: "kham-tai-nha"
let selectedDate = null;        // VD: "2026-11-25"
let selectedTime = null;        // VD: "09:00"


/* ---------- 3. LẤY CÁC PHẦN TỬ HTML ---------- */
const bookingForm = document.getElementById("booking-form");
const serviceOptions = document.getElementById("service-options");
const dateOptions = document.getElementById("date-options");
const slotOptions = document.getElementById("slot-options");

const patientName = document.getElementById("patient-name");
const patientPhone = document.getElementById("patient-phone");
const patientRelation = document.getElementById("patient-relation");
const patientWard = document.getElementById("patient-ward");
const patientAddress = document.getElementById("patient-address");
const patientNote = document.getElementById("patient-note");
const addressFields = document.querySelectorAll(".address-field");


/* ---------- 4. HIỆN / XÓA LỖI ---------- */
function showError(input, errorId, message) {
  if (input !== null) {
    input.classList.add("invalid");
  }
  document.getElementById(errorId).textContent = message;
}

function clearError(input, errorId) {
  if (input !== null) {
    input.classList.remove("invalid");
  }
  document.getElementById(errorId).textContent = "";
}


/* ---------- 5. BÁC SĨ ĐÃ CHỌN ---------- */
function renderDoctorMini(doctor) {
  document.getElementById("doctor-mini").innerHTML = `
    <div class="avatar">${doctor.letter}</div>
    <div class="doctor-mini-info">
      <h3>${doctor.name}</h3>
      <p>${escapeHTML(doctor.specialty)} · <span class="rating">★ ${doctor.rating.toFixed(1)}</span> · ${escapeHTML(doctor.workplace)}</p>
    </div>
    <div class="doctor-mini-links">
      <a href="chi-tiet-bac-si.html?id=${doctor.id}" class="btn btn-outline btn-small">Xem hồ sơ</a>
      <a href="dat-kham.html" class="btn btn-outline btn-small">Đổi bác sĩ</a>
    </div>`;

  document.getElementById("sum-doctor").textContent = doctor.name;
}


/* ---------- 6. CHỌN GÓI DỊCH VỤ ---------- */
function renderServices(doctor) {
  let html = "";
  for (const service of getServices(doctor)) {
    html += `
      <label class="service-option">
        <input type="radio" name="service" value="${service.id}">
        <span>
          <strong>${service.name}</strong>
          <small>${service.desc} · ${service.duration}</small>
          <span class="price">${formatMoney(service.price)}</span>
        </span>
      </label>`;
  }
  serviceOptions.innerHTML = html;

  // Các radio vừa được tạo bằng innerHTML -> lấy ra rồi gắn sự kiện
  const radios = serviceOptions.querySelectorAll("input");
  for (const radio of radios) {
    radio.addEventListener("change", function () {
      selectedServiceId = radio.value;
      clearError(null, "service-error");
      updateAddressFields();
      updateSummary();
    });
  }
}

// Chọn sẵn 1 gói (khi link có &dv=... hoặc quay lại từ trang thanh toán)
function selectService(serviceId) {
  const radios = serviceOptions.querySelectorAll("input");
  for (const radio of radios) {
    if (radio.value === serviceId) {
      radio.checked = true;
      selectedServiceId = serviceId;
    }
  }
}

// Tư vấn video thì không cần địa chỉ -> ẩn các ô địa chỉ
function updateAddressFields() {
  const service = findService(bookingDoctor, selectedServiceId);
  const isOnline = service !== null && service.online === true;

  for (const field of addressFields) {
    field.hidden = isOnline;
  }
}


/* ---------- 7. CHỌN NGÀY ---------- */
function renderDates(doctor) {
  dateOptions.innerHTML = "";

  for (const date of getNextDays()) {
    // Tạo nút bằng createElement để gắn sự kiện trực tiếp
    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-option";
    button.dataset.date = toDateKey(date);
    button.innerHTML = `${WEEKDAY_NAMES[date.getDay()]}<strong>${date.getDate()}</strong>Tháng ${date.getMonth() + 1}`;

    if (isWorkingDay(doctor, date) === false) {
      button.disabled = true;
      button.title = "Bác sĩ nghỉ ngày này";
    }

    button.addEventListener("click", function () {
      selectDate(button.dataset.date);
    });

    dateOptions.appendChild(button);
  }
}

function selectDate(dateKey) {
  selectedDate = dateKey;
  selectedTime = null;          // đổi ngày thì phải chọn lại giờ

  const buttons = dateOptions.querySelectorAll(".date-option");
  for (const button of buttons) {
    button.classList.toggle("active", button.dataset.date === dateKey);
  }

  renderSlots();
  updateSummary();
}


/* ---------- 8. CHỌN GIỜ ---------- */
function renderSlots() {
  slotOptions.innerHTML = "";

  if (selectedDate === null) {
    slotOptions.innerHTML = `<p class="slot-empty">Vui lòng chọn ngày trước.</p>`;
    return;
  }

  getTimeSlots(bookingDoctor).forEach(function (time, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-option";
    button.textContent = time;

    if (isSlotBooked(bookingDoctor, selectedDate, index)) {
      button.disabled = true;
      button.title = "Đã có người đặt";
    }

    if (time === selectedTime) {
      button.classList.add("active");
    }

    button.addEventListener("click", function () {
      selectedTime = time;

      const allSlots = slotOptions.querySelectorAll(".slot-option");
      for (const slot of allSlots) {
        slot.classList.remove("active");
      }
      button.classList.add("active");

      clearError(null, "time-error");
      updateSummary();
    });

    slotOptions.appendChild(button);
  });
}

// Khung giờ có hợp lệ không: phải có trong ca làm VÀ chưa bị đặt
function isFreeSlot(dateKey, time) {
  const index = getTimeSlots(bookingDoctor).indexOf(time);   // không có thì indexOf trả về -1
  return index !== -1 && isSlotBooked(bookingDoctor, dateKey, index) === false;
}

// Chọn sẵn ngày + giờ nếu còn hợp lệ:
// ngày nằm trong 7 ngày tới, bác sĩ có làm, giờ còn trống
function preselectDateTime(dateKey, time) {
  // Kiểm tra đúng dạng "2026-11-25" trước khi đưa vào querySelector
  if (dateKey === null || /^\d{4}-\d{2}-\d{2}$/.test(dateKey) === false) {
    return;
  }

  const dateButton = dateOptions.querySelector(`[data-date="${dateKey}"]`);
  if (dateButton === null || dateButton.disabled) {
    return;
  }

  selectDate(dateKey);
  if (time !== null && isFreeSlot(dateKey, time)) {
    selectedTime = time;
    renderSlots();
  }
}


/* ---------- 9. KHUNG TÓM TẮT + TÍNH TIỀN ---------- */
function updateSummary() {
  const service = findService(bookingDoctor, selectedServiceId);

  let servicePrice = 0;
  let travelFee = 0;
  let serviceText = "Chưa chọn";
  let placeText = "Khám tại nhà";

  if (service !== null) {
    servicePrice = service.price;
    serviceText = service.name;
    if (service.online === true) {
      placeText = "Tư vấn qua video";
    } else {
      travelFee = TRAVEL_FEE;
    }
  }

  let timeText = "Chưa chọn";
  if (selectedDate !== null && selectedTime !== null) {
    timeText = selectedTime + " · " + formatDate(selectedDate);
  } else if (selectedDate !== null) {
    timeText = formatDate(selectedDate) + " (chưa chọn giờ)";
  }

  document.getElementById("sum-service").textContent = serviceText;
  document.getElementById("sum-time").textContent = timeText;
  document.getElementById("sum-place").textContent = placeText;
  document.getElementById("sum-price").textContent = formatMoney(servicePrice);
  document.getElementById("sum-travel").textContent = formatMoney(travelFee);
  document.getElementById("sum-total").textContent = formatMoney(servicePrice + travelFee);
}


/* ---------- 10. KIỂM TRA FORM ----------
   Trả về phần tử lỗi ĐẦU TIÊN (để cuộn tới), không có lỗi thì trả về null */
function validateBooking() {
  let firstError = null;

  // Ghi nhớ lỗi đầu tiên
  function markError(element) {
    if (firstError === null) {
      firstError = element;
    }
  }

  if (selectedServiceId === null) {
    showError(null, "service-error", "Vui lòng chọn một gói dịch vụ");
    markError(serviceOptions);
  }

  if (selectedDate === null || selectedTime === null) {
    showError(null, "time-error", "Vui lòng chọn ngày và khung giờ khám");
    markError(dateOptions);
  }

  if (patientName.value.trim().length < 2) {
    showError(patientName, "patient-name-error", "Vui lòng nhập họ tên người được khám");
    markError(patientName);
  }

  // Regex: bắt đầu bằng 0, theo sau là đúng 9 chữ số -> tổng 10 số
  if (/^0\d{9}$/.test(patientPhone.value.trim()) === false) {
    showError(patientPhone, "patient-phone-error", "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0");
    markError(patientPhone);
  }

  // Chỉ kiểm tra địa chỉ khi ô địa chỉ đang hiện (không phải tư vấn video)
  if (patientWard.closest(".address-field").hidden === false) {
    if (patientWard.value === "") {
      showError(patientWard, "patient-ward-error", "Vui lòng chọn phường");
      markError(patientWard);
    }
    if (patientAddress.value.trim().length < 5) {
      showError(patientAddress, "patient-address-error", "Vui lòng nhập số nhà, tên đường");
      markError(patientAddress);
    }
  }

  return firstError;
}

// Gõ lại vào ô nào thì xóa lỗi của ô đó
const fieldsToWatch = [
  [patientName, "patient-name-error"],
  [patientPhone, "patient-phone-error"],
  [patientWard, "patient-ward-error"],
  [patientAddress, "patient-address-error"]
];

for (const pair of fieldsToWatch) {
  const input = pair[0];
  const errorId = pair[1];
  input.addEventListener("input", function () {
    clearError(input, errorId);
  });
}


/* ---------- 11. BẤM "TIẾP TỤC THANH TOÁN" ---------- */
bookingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const firstError = validateBooking();
  if (firstError !== null) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const service = findService(bookingDoctor, selectedServiceId);
  const isOnline = service.online === true;

  // Đơn tạm: lưu lại để trang thanh toán đọc
  const pendingBooking = {
    doctorId: bookingDoctor.id,
    serviceId: service.id,
    date: selectedDate,
    time: selectedTime,
    patientName: patientName.value.trim(),
    phone: patientPhone.value.trim(),
    relation: patientRelation.value,
    ward: isOnline ? "" : patientWard.value,
    street: isOnline ? "" : patientAddress.value.trim(),
    note: patientNote.value.trim(),
    servicePrice: service.price,
    travelFee: isOnline ? 0 : TRAVEL_FEE
  };

  writeStorage("homecare_pending", pendingBooking);
  window.location.href = "thanh-toan.html";
});


/* ---------- 12. ĐIỀN SẴN DỮ LIỆU CŨ ----------
   Ưu tiên: đơn tạm (khi bấm "Sửa" ở trang thanh toán) -> hồ sơ đã lưu -> để trống */
function fillSavedData() {
  const pending = readStorage("homecare_pending", null);
  const profile = readStorage("homecare_profile", null);

  let source = null;
  if (pending !== null && pending.doctorId === bookingDoctor.id) {
    source = pending;
    selectService(pending.serviceId);
    preselectDateTime(pending.date, pending.time);
  } else if (profile !== null) {
    source = { patientName: profile.name, phone: profile.phone, ward: profile.ward, street: profile.street };
  }

  if (source !== null) {
    patientName.value = source.patientName || "";   // || "": nếu không có thì để chuỗi rỗng
    patientPhone.value = source.phone || "";
    patientWard.value = source.ward || "";
    patientAddress.value = source.street || "";
    if (source.relation) {
      patientRelation.value = source.relation;
    }
    if (source.note) {
      patientNote.value = source.note;
    }
  }
}


/* ---------- 13. CHẠY KHI MỞ TRANG ---------- */
if (bookingDoctor === null) {
  document.getElementById("booking-area").innerHTML = `
    <div class="empty-box">
      <i class="fa-solid fa-user-doctor"></i>
      <h3>Bạn chưa chọn bác sĩ</h3>
      <p>Hãy chọn một bác sĩ hoặc điều dưỡng trước khi đặt lịch.</p>
      <a href="dat-kham.html" class="btn btn-primary">Chọn bác sĩ</a>
    </div>`;
} else {
  renderDoctorMini(bookingDoctor);
  renderServices(bookingDoctor);
  renderDates(bookingDoctor);
  renderSlots();

  // Mặc định chọn gói đầu tiên
  selectService(getServices(bookingDoctor)[0].id);

  fillSavedData();

  // Link có gói / ngày / giờ (từ trang hồ sơ bác sĩ) -> chọn sẵn, ưu tiên hơn dữ liệu cũ
  const serviceFromLink = bookingParams.get("dv");
  if (findService(bookingDoctor, serviceFromLink) !== null) {
    selectService(serviceFromLink);
  }

  preselectDateTime(bookingParams.get("ngay"), bookingParams.get("gio"));

  // Ghi chú gửi từ trang dịch vụ xét nghiệm (&ghi-chu=...)
  const noteFromLink = bookingParams.get("ghi-chu");
  if (noteFromLink !== null) {
    patientNote.value = noteFromLink;
  }

  updateAddressFields();
  updateSummary();
}
