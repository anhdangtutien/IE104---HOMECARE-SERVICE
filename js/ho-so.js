/* =========================================================
   HO-SO.JS - TRANG HỒ SƠ TÀI KHOẢN & QUẢN LÝ LỊCH HẸN
   Người phụ trách: THÀNH VIÊN 2
   Cần nạp js/du-lieu.js trước file này.

   Chức năng:
   1. Đọc tài khoản đăng nhập (js/dang-nhap.js lưu) -> biết là khách hàng hay bác sĩ
   2. Tạo menu bên trái theo vai trò, bấm để chuyển khung nội dung
   3. Khách hàng: xem / lọc / hủy lịch hẹn, sửa thông tin cá nhân
   4. Bác sĩ: xác nhận / từ chối / hoàn thành lịch hẹn,
              sửa hồ sơ hành nghề, chọn ngày làm việc trong tuần
   5. Đăng xuất
   ========================================================= */


/* ---------- 1. TÀI KHOẢN ĐANG ĐĂNG NHẬP ---------- */
const currentUser = getCurrentUser();          // null = chưa đăng nhập
const isDoctor = currentUser !== null && currentUser.role === "bac-si";
const viewerRole = isDoctor ? "bac-si" : "khach-hang";

// Đồ án chưa có máy chủ: mọi tài khoản bác sĩ đều xem như ThS. Trần Ngọc C (id = 1)
const DEMO_DOCTOR_ID = 1;

// Menu bên trái của từng vai trò. panel = id của khung nội dung tương ứng
const ACCOUNT_MENUS = {
  "khach-hang": [
    { panel: "lich-hen", icon: "fa-regular fa-calendar-check", text: "Lịch hẹn của tôi" },
    { panel: "thong-tin", icon: "fa-regular fa-user", text: "Thông tin cá nhân" }
  ],
  "bac-si": [
    { panel: "lich-kham", icon: "fa-solid fa-stethoscope", text: "Lịch hẹn bệnh nhân" },
    { panel: "ho-so-hanh-nghe", icon: "fa-regular fa-id-card", text: "Hồ sơ hành nghề" },
    { panel: "lich-lam-viec", icon: "fa-regular fa-clock", text: "Lịch làm việc" }
  ]
};


/* ---------- 2. LẤY CÁC PHẦN TỬ HTML ---------- */
const accountMenu = document.getElementById("account-menu");
const accountPanels = document.querySelectorAll(".account-panel");
const customerList = document.getElementById("customer-list");
const doctorList = document.getElementById("doctor-list");


/* ---------- 3. HÀM TIỆN ÍCH ---------- */

// Chữ cái đầu của TÊN (từ cuối cùng): "Nguyễn Văn An" -> "A"
function getInitial(fullName) {
  const words = fullName.trim().split(" ");
  return words[words.length - 1].charAt(0).toUpperCase();
}

// Lịch hẹn chưa diễn ra (chờ xác nhận hoặc sắp tới)
function isUpcoming(status) {
  return status === "cho-xac-nhan" || status === "sap-toi";
}

// Sắp xếp: lịch chưa diễn ra lên đầu (gần nhất trước), lịch cũ xuống dưới (mới nhất trước)
function sortAppointments(list) {
  // slice() tạo bản sao để không làm đổi thứ tự mảng gốc
  return list.slice().sort(function (a, b) {
    const groupA = isUpcoming(a.status) ? 0 : 1;
    const groupB = isUpcoming(b.status) ? 0 : 1;
    if (groupA !== groupB) {
      return groupA - groupB;
    }

    const timeA = a.date + " " + a.time;      // "2026-11-25 09:00" so sánh được như chuỗi
    const timeB = b.date + " " + b.time;
    if (groupA === 0) {
      return timeA < timeB ? -1 : 1;           // sắp tới: gần nhất trước
    }
    return timeA > timeB ? -1 : 1;             // đã qua: mới nhất trước
  });
}

// Lịch hẹn có thuộc tab lọc đang chọn không
function matchFilter(status, filter) {
  if (filter === "tat-ca") {
    return true;
  }
  // Khách hàng: tab "Sắp tới" gồm cả lịch đang chờ xác nhận
  if (filter === "sap-toi" && viewerRole === "khach-hang") {
    return isUpcoming(status);
  }
  return status === filter;
}

// Đổi trạng thái 1 lịch hẹn theo mã, rồi lưu lại vào đúng danh sách chứa nó
function changeStatus(code, newStatus) {
  const storageKeys = ["homecare_appointments", "homecare_doctor_appointments"];

  for (const key of storageKeys) {
    const list = readStorage(key, []);
    for (const item of list) {
      if (item.code === code) {
        item.status = newStatus;
        writeStorage(key, list);
        return;
      }
    }
  }
}

// Hiện dòng "Đã lưu" trong 3 giây rồi tự ẩn
function flashSuccess(elementId) {
  const element = document.getElementById(elementId);
  element.classList.add("show");
  setTimeout(function () {
    element.classList.remove("show");
  }, 3000);
}

function showFieldError(inputId, message) {
  document.getElementById(inputId).classList.add("invalid");
  document.getElementById(inputId + "-error").textContent = message;
}

function clearFieldErrors(form) {
  for (const input of form.querySelectorAll(".invalid")) {
    input.classList.remove("invalid");
  }
  for (const error of form.querySelectorAll(".error-text")) {
    error.textContent = "";
  }
}


/* ---------- 4. DỮ LIỆU CỦA TỪNG VAI TRÒ ---------- */

// Hồ sơ khách hàng. Chưa lưu lần nào -> tạo từ tên đăng nhập
function getProfile() {
  const saved = readStorage("homecare_profile", null);
  if (saved !== null) {
    return saved;
  }

  const username = currentUser.username;
  const isPhone = /^0\d{9}$/.test(username);
  return {
    name: isPhone ? "Khách hàng HomeCare" : username,
    phone: isPhone ? username : "",
    email: "", birthday: "", gender: "", ward: "", street: ""
  };
}

// Lịch hẹn mà bệnh nhân khác đã đặt với bác sĩ (dữ liệu mẫu, tạo 1 lần)
function getDoctorSamples() {
  let list = readStorage("homecare_doctor_appointments", null);

  if (list === null) {
    const address = ", TP. Thủ Đức";
    list = [
      { code: "HC205881", doctorId: 1, serviceId: "kham-tai-nha", date: toDateKey(addDays(1)), time: "08:00",
        patientName: "Trần Thị Mai", phone: "0912345678", address: "45 Lê Văn Việt, P. Hiệp Phú" + address,
        note: "Huyết áp cao, hay chóng mặt buổi sáng", total: 330000, payment: "Tiền mặt khi khám xong", status: "cho-xac-nhan" },
      { code: "HC205790", doctorId: 1, serviceId: "tai-kham", date: toDateKey(addDays(2)), time: "10:00",
        patientName: "Lê Văn Hùng", phone: "0987654321", address: "8 Đường số 11, P. Linh Xuân" + address,
        note: "Tái khám tiểu đường, mang theo sổ đo đường huyết", total: 240000, payment: "Ví MoMo", status: "sap-toi" },
      { code: "HC204966", doctorId: 1, serviceId: "kham-xet-nghiem", date: toDateKey(addDays(4)), time: "14:00",
        patientName: "Phạm Thị Hoa", phone: "0933222111", address: "102 Võ Văn Ngân, P. Linh Chiểu" + address,
        note: "", total: 580000, payment: "Chuyển khoản ngân hàng", status: "cho-xac-nhan" },
      { code: "HC201234", doctorId: 1, serviceId: "kham-tai-nha", date: toDateKey(addDays(-3)), time: "09:00",
        patientName: "Nguyễn Văn Bình", phone: "0909111222", address: "27 Hoàng Diệu 2, P. Linh Trung" + address,
        note: "Đau ngực nhẹ khi gắng sức", total: 330000, payment: "Tiền mặt khi khám xong", status: "hoan-thanh" },
      { code: "HC199870", doctorId: 1, serviceId: "tai-kham", date: toDateKey(addDays(-6)), time: "15:00",
        patientName: "Võ Thị Lan", phone: "0911333444", address: "5 Đặng Văn Bi, P. Bình Thọ" + address,
        note: "", total: 240000, payment: "Ví MoMo", status: "hoan-thanh" }
    ];
    writeStorage("homecare_doctor_appointments", list);
  }

  return list;
}

// Toàn bộ lịch của bác sĩ = dữ liệu mẫu + lịch khách hàng vừa đặt với bác sĩ này
function getDoctorAppointments() {
  const fromCustomers = getAppointments().filter(function (item) {
    return item.doctorId === DEMO_DOCTOR_ID;
  });
  return getDoctorSamples().concat(fromCustomers);
}


/* ---------- 5. CỘT TRÁI: THÔNG TIN + MENU ---------- */

// Lưu tên hiển thị vào tài khoản -> nút "Tài khoản" trên header cũng đổi theo
function updateDisplayName(name) {
  currentUser.name = name;
  writeStorage("homecare_user", currentUser);

  const headerName = document.getElementById("account-name");
  if (headerName !== null) {
    headerName.textContent = name;
  }
}

function renderSidebar() {
  let name = "";
  let letter = "";
  let contact = "";

  if (isDoctor) {
    const doctor = findDoctor(DEMO_DOCTOR_ID);
    name = doctor.name;
    letter = doctor.letter;
    contact = doctor.specialty;
  } else {
    const profile = getProfile();
    name = profile.name;
    letter = getInitial(profile.name);
    contact = profile.phone || profile.email || currentUser.username;
  }

  document.getElementById("user-avatar").textContent = letter;
  document.getElementById("user-name").textContent = name;
  document.getElementById("user-role").textContent = isDoctor ? "BÁC SĨ" : "KHÁCH HÀNG";
  document.getElementById("user-contact").textContent = contact;

  if (currentUser.name !== name) {
    updateDisplayName(name);
  }
}

function renderMenu() {
  let html = "";
  for (const item of ACCOUNT_MENUS[viewerRole]) {
    html += `
      <button type="button" class="menu-button" data-panel="${item.panel}">
        <i class="${item.icon}"></i> ${item.text}
      </button>`;
  }

  if (isDoctor) {
    html += `
      <a href="chi-tiet-bac-si.html?id=${DEMO_DOCTOR_ID}" class="menu-button">
        <i class="fa-regular fa-eye"></i> Trang hồ sơ công khai
      </a>`;
  }

  accountMenu.innerHTML = html;
}

// Mở 1 khung nội dung, ẩn các khung còn lại
function openPanel(panelId) {
  for (const panel of accountPanels) {
    panel.classList.toggle("active", panel.id === panelId);
  }

  for (const button of accountMenu.querySelectorAll("[data-panel]")) {
    const isActive = button.dataset.panel === panelId;
    button.classList.toggle("active", isActive);
    if (isActive) {
      document.getElementById("crumb-panel").textContent = button.textContent.trim();
    }
  }

  // Ghi #ten-khung lên thanh địa chỉ (không tải lại trang) để tải lại vẫn mở đúng khung
  history.replaceState(null, "", "#" + panelId);
}

// 1 sự kiện cho cả menu: xem phần tử được bấm nằm trong nút nào (event delegation)
accountMenu.addEventListener("click", function (event) {
  const button = event.target.closest("[data-panel]");
  if (button !== null) {
    openPanel(button.dataset.panel);
  }
});


/* ---------- 6. Ô THỐNG KÊ ---------- */
function statCard(icon, value, label) {
  return `
    <div class="stat-card">
      <span class="stat-icon"><i class="${icon}"></i></span>
      <div><strong>${value}</strong><small>${label}</small></div>
    </div>`;
}

// Đếm số lịch hẹn thỏa điều kiện / cộng tổng tiền
function countBy(list, check) {
  return list.filter(check).length;
}

function sumCompleted(list) {
  let total = 0;
  for (const item of list) {
    if (item.status === "hoan-thanh") {
      total += item.total;
    }
  }
  return total;
}

function renderStats() {
  let html = "";

  if (isDoctor) {
    const list = getDoctorAppointments();
    const doctor = findDoctor(DEMO_DOCTOR_ID);
    html =
      statCard("fa-regular fa-hourglass-half", countBy(list, function (a) { return a.status === "cho-xac-nhan"; }), "Chờ xác nhận") +
      statCard("fa-regular fa-calendar-check", countBy(list, function (a) { return a.status === "sap-toi"; }), "Lịch sắp tới") +
      statCard("fa-solid fa-star", doctor.rating.toFixed(1) + " ★", doctor.visits + " lượt khám") +
      statCard("fa-solid fa-sack-dollar", formatMoney(sumCompleted(list)), "Thu nhập đã hoàn thành");
  } else {
    const list = getAppointments();
    html =
      statCard("fa-regular fa-calendar", countBy(list, function (a) { return isUpcoming(a.status); }), "Lịch sắp tới") +
      statCard("fa-regular fa-circle-check", countBy(list, function (a) { return a.status === "hoan-thanh"; }), "Đã hoàn thành") +
      statCard("fa-solid fa-wallet", formatMoney(sumCompleted(list)), "Tổng chi tiêu");
  }

  document.getElementById("stat-row").innerHTML = html;
}


/* ---------- 7. THẺ LỊCH HẸN ---------- */
function createAppointmentCard(item) {
  const doctor = findDoctor(item.doctorId);
  const service = doctor !== null ? findService(doctor, item.serviceId) : null;
  const serviceName = service !== null ? service.name : "Dịch vụ chăm sóc tại nhà";

  let title = "";
  let letter = "";
  let extraLines = "";
  let actions = "";

  if (viewerRole === "khach-hang") {
    // Khách hàng xem: tiêu đề là tên bác sĩ
    title = doctor !== null ? doctor.name : "Bác sĩ HomeCare";
    letter = doctor !== null ? doctor.letter : "H";
    extraLines = `<li><i class="fa-regular fa-user"></i> Người được khám: ${escapeHTML(item.patientName)}</li>`;

    if (isUpcoming(item.status)) {
      actions += `<button type="button" class="btn btn-danger btn-small" data-action="huy" data-code="${item.code}">Hủy lịch</button>`;
    } else {
      actions += `<a href="dat-lich.html?id=${item.doctorId}" class="btn btn-primary btn-small">Đặt lại</a>`;
    }
    actions += `<a href="chi-tiet-bac-si.html?id=${item.doctorId}" class="btn btn-outline btn-small">Xem bác sĩ</a>`;
  } else {
    // Bác sĩ xem: tiêu đề là tên bệnh nhân
    title = escapeHTML(item.patientName);
    letter = escapeHTML(getInitial(item.patientName));
    extraLines = `<li><i class="fa-solid fa-phone"></i> ${escapeHTML(item.phone)}</li>`;
    if (item.note) {
      extraLines += `<li><i class="fa-regular fa-note-sticky"></i> ${escapeHTML(item.note)}</li>`;
    }

    if (item.status === "cho-xac-nhan") {
      actions += `<button type="button" class="btn btn-danger btn-small" data-action="tu-choi" data-code="${item.code}">Từ chối</button>`;
      actions += `<button type="button" class="btn btn-primary btn-small" data-action="xac-nhan" data-code="${item.code}">Xác nhận</button>`;
    } else if (item.status === "sap-toi") {
      actions += `<a href="tel:${escapeHTML(item.phone)}" class="btn btn-outline btn-small">Gọi bệnh nhân</a>`;
      actions += `<button type="button" class="btn btn-primary btn-small" data-action="hoan-thanh" data-code="${item.code}">Đã khám xong</button>`;
    }
  }

  // Lịch đã xong / đã hủy của bác sĩ không còn nút nào -> bỏ luôn hàng nút
  let actionsHTML = "";
  if (actions !== "") {
    actionsHTML = `<div class="appointment-actions">${actions}</div>`;
  }

  return `
    <article class="appointment-card">
      <div class="appointment-top">
        <span>Mã lịch hẹn: <strong>${item.code}</strong></span>
        <span class="status status-${item.status}">${STATUS_NAMES[item.status]}</span>
      </div>
      <div class="appointment-body">
        <div class="avatar">${letter}</div>
        <div class="appointment-info">
          <h3>${title}</h3>
          <p class="appointment-service">${serviceName}</p>
          <ul class="appointment-meta">
            <li><i class="fa-regular fa-clock"></i> ${item.time} · ${formatDate(item.date)}</li>
            <li><i class="fa-solid fa-location-dot"></i> ${escapeHTML(item.address)}</li>
            ${extraLines}
          </ul>
        </div>
        <div class="appointment-price">
          <strong>${formatMoney(item.total)}</strong>
          <small>${item.payment}</small>
        </div>
      </div>
      ${actionsHTML}
    </article>`;
}

// Vẽ danh sách theo tab lọc + cập nhật số đếm trên từng tab
function renderList(container, filtersId, list, filter) {
  const sorted = sortAppointments(list);

  // Thêm số đếm vào chữ trên mỗi tab: "Sắp tới (2)"
  for (const tab of document.querySelectorAll("#" + filtersId + " .filter-tab")) {
    if (tab.dataset.label === undefined) {
      tab.dataset.label = tab.textContent;       // nhớ chữ gốc ở lần đầu
    }
    const count = countBy(sorted, function (item) { return matchFilter(item.status, tab.dataset.filter); });
    tab.innerHTML = tab.dataset.label + `<span>(${count})</span>`;
  }

  let html = "";
  for (const item of sorted) {
    if (matchFilter(item.status, filter)) {
      html += createAppointmentCard(item);
    }
  }

  if (html === "") {
    html = `
      <div class="empty-box">
        <i class="fa-regular fa-calendar"></i>
        <h3>Không có lịch hẹn nào</h3>
        <p>Chưa có lịch hẹn ở mục này.</p>
      </div>`;
  }

  container.innerHTML = html;
}


/* ---------- 8. KHÁCH HÀNG: LỊCH HẸN ---------- */
let customerFilter = "tat-ca";

function renderCustomerList() {
  renderList(customerList, "customer-filters", getAppointments(), customerFilter);
}

customerList.addEventListener("click", function (event) {
  const button = event.target.closest('[data-action="huy"]');
  if (button === null) {
    return;
  }

  const isConfirmed = confirm(
    "Bạn chắc chắn muốn hủy lịch hẹn " + button.dataset.code + "?\n" +
    "Hủy trước 24 giờ: hoàn 100% phí. Hủy trong vòng 24 giờ: hoàn 50%."
  );

  if (isConfirmed) {
    changeStatus(button.dataset.code, "da-huy");
    renderCustomerList();
    renderStats();
  }
});


/* ---------- 9. BÁC SĨ: LỊCH HẸN BỆNH NHÂN ---------- */
let doctorFilter = "cho-xac-nhan";

function renderDoctorList() {
  renderList(doctorList, "doctor-filters", getDoctorAppointments(), doctorFilter);
}

doctorList.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (button === null) {
    return;
  }

  const code = button.dataset.code;
  const action = button.dataset.action;

  if (action === "xac-nhan") {
    changeStatus(code, "sap-toi");
  } else if (action === "hoan-thanh") {
    changeStatus(code, "hoan-thanh");
  } else if (action === "tu-choi") {
    if (confirm("Từ chối lịch hẹn " + code + "? Bệnh nhân sẽ được hoàn tiền 100%.") === false) {
      return;
    }
    changeStatus(code, "da-huy");
  }

  renderDoctorList();
  renderStats();
});


/* ---------- 10. CÁC TAB LỌC ---------- */
function setupFilters(filtersId, onChange) {
  const container = document.getElementById(filtersId);

  container.addEventListener("click", function (event) {
    const clicked = event.target.closest(".filter-tab");
    if (clicked === null) {
      return;
    }
    for (const tab of container.querySelectorAll(".filter-tab")) {
      tab.classList.toggle("active", tab === clicked);
    }
    onChange(clicked.dataset.filter);
  });
}

setupFilters("customer-filters", function (filter) {
  customerFilter = filter;
  renderCustomerList();
});

setupFilters("doctor-filters", function (filter) {
  doctorFilter = filter;
  renderDoctorList();
});


/* ---------- 11. KHÁCH HÀNG: THÔNG TIN CÁ NHÂN ---------- */
const profileForm = document.getElementById("profile-form");
const PROFILE_FIELDS = ["name", "phone", "email", "birthday", "gender", "ward", "street"];

function fillProfileForm() {
  const profile = getProfile();
  for (const field of PROFILE_FIELDS) {
    // VD: field = "name" -> ô có id "profile-name"
    document.getElementById("profile-" + field).value = profile[field] || "";
  }
}

profileForm.addEventListener("submit", function (event) {
  event.preventDefault();
  clearFieldErrors(profileForm);

  // Đọc tất cả các ô vào 1 object
  const profile = {};
  for (const field of PROFILE_FIELDS) {
    profile[field] = document.getElementById("profile-" + field).value.trim();
  }

  let isValid = true;
  if (profile.name.length < 2) {
    showFieldError("profile-name", "Vui lòng nhập họ tên");
    isValid = false;
  }
  if (/^0\d{9}$/.test(profile.phone) === false) {
    showFieldError("profile-phone", "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0");
    isValid = false;
  }
  if (profile.email !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) === false) {
    showFieldError("profile-email", "Email không đúng định dạng");
    isValid = false;
  }
  if (profile.birthday !== "" && new Date(profile.birthday) > new Date()) {
    showFieldError("profile-birthday", "Ngày sinh không được ở tương lai");
    isValid = false;
  }

  if (isValid === false) {
    return;
  }

  writeStorage("homecare_profile", profile);
  renderSidebar();
  flashSuccess("profile-success");
});


/* ---------- 12. BÁC SĨ: HỒ SƠ HÀNH NGHỀ ---------- */
const practiceForm = document.getElementById("practice-form");

function fillPracticeForm() {
  const doctor = findDoctor(DEMO_DOCTOR_ID);
  document.getElementById("practice-specialty").value = doctor.specialty;
  document.getElementById("practice-workplace").value = doctor.workplace;
  document.getElementById("practice-experience").value = doctor.experience;
  document.getElementById("practice-price").value = doctor.price;
  document.getElementById("practice-treats").value = doctor.treats;
  document.getElementById("practice-bio").value = doctor.bio || "";
  document.getElementById("public-profile-link").href = "chi-tiet-bac-si.html?id=" + DEMO_DOCTOR_ID;
}

// Lưu phần bác sĩ đã sửa. du-lieu.js sẽ đọc lại và áp dụng ở mọi trang
function saveDoctorEdits(changes) {
  const edits = readStorage("homecare_doctor_profile", { id: DEMO_DOCTOR_ID });
  Object.assign(edits, changes);                         // chép các thuộc tính mới đè lên
  writeStorage("homecare_doctor_profile", edits);
  Object.assign(findDoctor(DEMO_DOCTOR_ID), changes);    // cập nhật luôn dữ liệu đang dùng
}

practiceForm.addEventListener("submit", function (event) {
  event.preventDefault();
  clearFieldErrors(practiceForm);

  const specialty = document.getElementById("practice-specialty").value.trim();
  const workplace = document.getElementById("practice-workplace").value.trim();
  const experience = Number(document.getElementById("practice-experience").value);
  const price = Number(document.getElementById("practice-price").value);

  let isValid = true;
  if (specialty === "") {
    showFieldError("practice-specialty", "Vui lòng nhập chuyên khoa");
    isValid = false;
  }
  if (workplace === "") {
    showFieldError("practice-workplace", "Vui lòng nhập nơi công tác");
    isValid = false;
  }
  // Number.isInteger: kiểm tra có phải số nguyên không (5 -> true, 5.5 -> false)
  if (Number.isInteger(experience) === false || experience < 0 || experience > 60) {
    showFieldError("practice-experience", "Số năm kinh nghiệm từ 0 đến 60");
    isValid = false;
  }
  if (price < 100000) {
    showFieldError("practice-price", "Giá khám tối thiểu 100.000đ");
    isValid = false;
  }

  if (isValid === false) {
    return;
  }

  saveDoctorEdits({
    specialty: specialty,
    workplace: workplace,
    experience: experience,
    price: price,
    // Để trống ô chuyên trị thì giữ nội dung cũ
    treats: document.getElementById("practice-treats").value.trim() || findDoctor(DEMO_DOCTOR_ID).treats,
    bio: document.getElementById("practice-bio").value.trim()
  });

  renderSidebar();
  flashSuccess("practice-success");
});


/* ---------- 13. BÁC SĨ: LỊCH LÀM VIỆC ---------- */
const scheduleForm = document.getElementById("schedule-form");
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];    // hiện từ Thứ 2 -> Chủ nhật

function fillScheduleForm() {
  const doctor = findDoctor(DEMO_DOCTOR_ID);
  let html = "";

  for (const day of WEEK_ORDER) {
    const checked = doctor.workDays.includes(day) ? "checked" : "";
    html += `
      <label class="weekday">
        ${WEEKDAY_NAMES[day]}
        <input type="checkbox" value="${day}" ${checked}>
      </label>`;
  }

  document.getElementById("weekday-grid").innerHTML = html;
  document.getElementById("schedule-start").value = doctor.startTime;
  document.getElementById("schedule-end").value = doctor.endTime;
}

scheduleForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const scheduleError = document.getElementById("schedule-error");
  scheduleError.textContent = "";

  // Lấy các ngày được tích, đổi value (chuỗi) sang số
  const workDays = [];
  for (const checkbox of scheduleForm.querySelectorAll('.weekday input:checked')) {
    workDays.push(Number(checkbox.value));
  }

  const startTime = document.getElementById("schedule-start").value;
  const endTime = document.getElementById("schedule-end").value;

  if (workDays.length === 0) {
    scheduleError.textContent = "Vui lòng chọn ít nhất 1 ngày làm việc";
    return;
  }
  if (startTime === "" || endTime === "" || toMinutes(endTime) - toMinutes(startTime) < 60) {
    scheduleError.textContent = "Ca làm việc phải dài ít nhất 1 tiếng";
    return;
  }

  saveDoctorEdits({ workDays: workDays, startTime: startTime, endTime: endTime });
  flashSuccess("schedule-success");
});


/* ---------- 14. ĐĂNG XUẤT ---------- */
document.getElementById("logout-button").addEventListener("click", function () {
  if (confirm("Bạn muốn đăng xuất khỏi HomeCare?")) {
    removeStorage("homecare_user");
    window.location.href = "dang-nhap.html";
  }
});


/* ---------- 15. CHẠY KHI MỞ TRANG ---------- */
if (currentUser === null) {
  // Chưa đăng nhập -> thay cả khung bằng lời mời đăng nhập
  document.getElementById("account-layout").outerHTML = `
    <div class="empty-box">
      <i class="fa-regular fa-circle-user"></i>
      <h3>Bạn chưa đăng nhập</h3>
      <p>Đăng nhập để xem lịch hẹn và quản lý hồ sơ của bạn.</p>
      <a href="dang-nhap.html?next=ho-so.html" class="btn btn-primary">Đăng nhập</a>
      <a href="dang-ky-khach-hang.html" class="btn btn-outline">Tạo tài khoản</a>
    </div>`;
} else {
  renderSidebar();
  renderMenu();
  renderStats();

  if (isDoctor) {
    renderDoctorList();
    fillPracticeForm();
    fillScheduleForm();
  } else {
    renderCustomerList();
    fillProfileForm();
  }

  // Mở khung theo #... trên link (VD: ho-so.html#lich-hen), không hợp lệ thì mở khung đầu tiên
  const menuItems = ACCOUNT_MENUS[viewerRole];
  let firstPanel = menuItems[0].panel;
  const hashPanel = window.location.hash.replace("#", "");
  for (const item of menuItems) {
    if (item.panel === hashPanel) {
      firstPanel = hashPanel;
    }
  }
  openPanel(firstPanel);
}
