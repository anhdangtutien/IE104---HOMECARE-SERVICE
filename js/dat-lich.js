

/* ---------- 1. ĐỌC THAM SỐ TRÊN LINK ---------- */
const bookingParams = new URLSearchParams(window.location.search);
const bookingDoctor = findDoctor(bookingParams.get("id"));

// Tài khoản đang đăng nhập (dang-nhap.js lưu). Đăng nhập OTP thì có verified: true + phone
const bookingUser = getCurrentUser();


/* ---------- 2. BIẾN LƯU LỰA CHỌN HIỆN TẠI ---------- */
let selectedServiceId = null;   // VD: "kham-tai-nha"
let selectedDate = null;        // VD: "2026-11-25"
let selectedTime = null;        // VD: "09:00"
let serverBookedSlots = [];     // khung giờ đã có người đặt (từ database), VD: [{ date, time }]


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

const symptomSelect = document.getElementById("symptom-select");
const symptomSummary = document.getElementById("symptom-summary");
const symptomCheckboxes = document.querySelectorAll('input[name="symptom"]');
const symptomOther = document.getElementById("symptom-other");


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
      <p>${escapeHTML(doctor.specialty)} · ${escapeHTML(doctor.workplace)}</p>
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

    if (isSlotBooked(bookingDoctor, selectedDate, index) || isServerBooked(selectedDate, time)) {
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


function isFreeSlot(dateKey, time) {
  const index = getTimeSlots(bookingDoctor).indexOf(time);   
  return index !== -1 && isSlotBooked(bookingDoctor, dateKey, index) === false &&
    isServerBooked(dateKey, time) === false;
}

// AI prompt: "Tạo database lưu thông tin đặt lịch khám" – khung giờ đã có người đặt thật
// (lưu trong database) cũng bị khóa, ngoài các khung giả lập bằng isSlotBooked() ở du-lieu.js
function isServerBooked(dateKey, time) {
  return serverBookedSlots.some(function (slot) {
    return slot.date === dateKey && slot.time === time;
  });
}

async function loadServerSlots() {
  try {
    const data = await callApi("/api/bookings?doctorId=" + bookingDoctor.id + "&slots=1");
    serverBookedSlots = data.slots;

    // Giờ đang chọn vừa bị người khác đặt -> bỏ chọn
    if (selectedDate !== null && selectedTime !== null && isServerBooked(selectedDate, selectedTime)) {
      selectedTime = null;
      updateSummary();
    }
    renderSlots();
  } catch (error) {
   
  }
}


function preselectDateTime(dateKey, time) {
 
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

  // SĐT liên hệ khác: KHÔNG bắt buộc (đã có SĐT đăng nhập),
  // nhưng nếu có nhập thì phải đúng 10 hoặc 11 chữ số
  const phone = patientPhone.value.trim();
  if (phone !== "" && /^\d{10,11}$/.test(phone) === false) {
    showError(patientPhone, "patient-phone-error", "Số điện thoại phải gồm đúng 10 hoặc 11 chữ số");
    markError(patientPhone);
  }

  
  if (getSelectedSymptoms().includes("Khác") && symptomOther.value.trim() === "") {
    showError(symptomOther, "symptom-error", "Vui lòng mô tả triệu chứng khác");
    markError(symptomOther);
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


const fieldsToWatch = [
  [patientName, "patient-name-error"],
  [patientPhone, "patient-phone-error"],
  [patientWard, "patient-ward-error"],
  [patientAddress, "patient-address-error"],
  [symptomOther, "symptom-error"]
];


patientPhone.addEventListener("input", function () {
  patientPhone.value = patientPhone.value.replace(/\D/g, "");
});

for (const pair of fieldsToWatch) {
  const input = pair[0];
  const errorId = pair[1];
  input.addEventListener("input", function () {
    clearError(input, errorId);
  });
}


/* ---------- 10b. TRIỆU CHỨNG (DANH SÁCH XỔ XUỐNG CÓ Ô TÍCH) ----------
   AI prompt: "Triệu chứng: dạng danh sách xổ xuống có ô vuông để tích chọn,
   kèm mục 'Khác' (Other) để tự nhập" – mục này được viết với sự hỗ trợ của AI. */

// Mảng các triệu chứng đang được tích, VD: ["Sốt", "Ho", "Khác"]
function getSelectedSymptoms() {
  const selected = [];
  for (const checkbox of symptomCheckboxes) {
    if (checkbox.checked) {
      selected.push(checkbox.value);
    }
  }
  return selected;
}


function updateSymptoms() {
  const selected = getSelectedSymptoms();

  if (selected.length === 0) {
    symptomSummary.textContent = "-- Chọn triệu chứng --";
    symptomSummary.classList.remove("has-value");
  } else {
    symptomSummary.textContent = selected.join(", ");
    symptomSummary.classList.add("has-value");
  }

  const hasOther = selected.includes("Khác");
  symptomOther.hidden = hasOther === false;
  if (hasOther === false) {
    clearError(symptomOther, "symptom-error");
  }
}

for (const checkbox of symptomCheckboxes) {
  checkbox.addEventListener("change", function () {
    updateSymptoms();
    
    if (checkbox.value === "Khác" && checkbox.checked) {
      symptomOther.focus();
    }
  });
}


document.addEventListener("click", function (event) {
  if (symptomSelect.open && symptomSelect.contains(event.target) === false) {
    symptomSelect.open = false;
  }
});

symptomSelect.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    symptomSelect.open = false;
    symptomSelect.querySelector("summary").focus();
  }
});


function restoreSymptoms(symptoms, otherText) {
  for (const checkbox of symptomCheckboxes) {
    checkbox.checked = symptoms.includes(checkbox.value);
  }
  symptomOther.value = otherText || "";
  updateSymptoms();
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

  
  const pendingBooking = {
    doctorId: bookingDoctor.id,
    serviceId: service.id,
    date: selectedDate,
    time: selectedTime,
    patientName: patientName.value.trim(),
    accountPhone: bookingUser.phone,            // SĐT đăng nhập
    contactPhone: patientPhone.value.trim(),    // SĐT khác, có thể để trống
    relation: patientRelation.value,
    symptoms: getSelectedSymptoms(),
    symptomOther: getSelectedSymptoms().includes("Khác") ? symptomOther.value.trim() : "",
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
   
    source = { patientName: profile.name, ward: profile.ward, street: profile.street };
  }

  if (source !== null) {
    patientName.value = source.patientName || "";   
    patientPhone.value = source.contactPhone || "";
    if (Array.isArray(source.symptoms)) {
      restoreSymptoms(source.symptoms, source.symptomOther);
    }
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
// AI prompt: "Bắt buộc đăng nhập mới được đặt lịch khám" – chưa đăng nhập bằng
// số điện thoại + OTP thì thay cả form bằng lời mời đăng nhập
if (isVerifiedUser(bookingUser) === false) {
  const notLoggedIn = bookingUser === null;
  document.getElementById("booking-area").innerHTML = `
    <div class="empty-box">
      <i class="fa-solid fa-mobile-screen-button"></i>
      <h3>${notLoggedIn ? "Vui lòng đăng nhập để đặt lịch khám" : "Cần xác thực số điện thoại"}</h3>
      <p>${notLoggedIn
        ? "Bạn cần đăng nhập bằng số điện thoại (nhận mã OTP) trước khi đặt lịch. Sau khi đăng nhập sẽ quay lại đúng trang này."
        : "Tài khoản đăng nhập bằng mật khẩu chưa xác thực số điện thoại. Vui lòng đăng nhập bằng số điện thoại + mã OTP để đặt lịch."}</p>
      <a href="${getLoginLink(notLoggedIn ? "dat-lich" : "otp")}" class="btn btn-primary">
        <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập bằng số điện thoại
      </a>
    </div>`;
} else if (bookingDoctor === null) {
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

  
  document.getElementById("account-note").innerHTML = `
    <i class="fa-solid fa-circle-check"></i>
    <span>Đặt lịch bằng tài khoản <strong>${escapeHTML(bookingUser.phone)}</strong> –
    HomeCare sẽ gọi xác nhận qua số này.</span>`;

  
  selectService(getServices(bookingDoctor)[0].id);

  fillSavedData();

  
  const serviceFromLink = bookingParams.get("dv");
  if (findService(bookingDoctor, serviceFromLink) !== null) {
    selectService(serviceFromLink);
  }

  preselectDateTime(bookingParams.get("ngay"), bookingParams.get("gio"));

  
  const noteFromLink = bookingParams.get("ghi-chu");
  if (noteFromLink !== null) {
    patientNote.value = noteFromLink;
  }

  updateAddressFields();
  updateSummary();

  
  loadServerSlots();
}
