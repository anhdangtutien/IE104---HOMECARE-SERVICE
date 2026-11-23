/* =========================================================
   CHI-TIET-BAC-SI.JS - TRANG HỒ SƠ BÁC SĨ
   Người phụ trách: THÀNH VIÊN 2
   Cần nạp js/du-lieu.js trước file này.

   Chức năng:
   1. Đọc id trên link (chi-tiet-bac-si.html?id=1) để biết xem bác sĩ nào
   2. Điền thông tin, giới thiệu, quá trình công tác
   3. Tạo bảng giá dịch vụ, mỗi dòng có nút "Chọn" sang trang đặt lịch
   4. Tạo lịch làm việc 7 ngày tới, bấm khung giờ trống để đặt lịch
   5. Hiện đánh giá + chuyển tab
   ========================================================= */


/* ---------- 1. ĐỌC ID TRÊN LINK ---------- */
const profileParams = new URLSearchParams(window.location.search);
const profileDoctor = findDoctor(profileParams.get("id"));


/* ---------- 2. ĐIỀN THÔNG TIN CƠ BẢN ---------- */
function fillBasicInfo(doctor) {
  document.title = doctor.name + " - HomeCare";
  document.getElementById("crumb-name").textContent = doctor.name;

  document.getElementById("doctor-avatar").textContent = doctor.letter;
  document.getElementById("doctor-name").textContent = doctor.name;
  document.getElementById("doctor-specialty").textContent = doctor.specialty;
  document.getElementById("doctor-rating").textContent =
    doctor.rating.toFixed(1) + " (" + doctor.visits + " lượt khám)";
  document.getElementById("doctor-experience").textContent = doctor.experience + " năm kinh nghiệm";
  document.getElementById("doctor-workplace").textContent = doctor.workplace;
  document.getElementById("doctor-area").textContent = "Phục vụ tại " + doctor.area;
  document.getElementById("doctor-price").textContent = formatMoney(doctor.price);

  document.getElementById("book-button").href = "dat-lich.html?id=" + doctor.id;

  // Bác sĩ hay điều dưỡng -> chữ trên nút khác nhau
  let role = "bác sĩ";
  if (doctor.type === "dieu-duong") {
    role = "điều dưỡng";
  }

  // Bác sĩ đã tự viết giới thiệu (ở trang hồ sơ) thì dùng luôn
  if (doctor.bio) {
    document.getElementById("doctor-bio").textContent = doctor.bio;
    return;
  }

  document.getElementById("doctor-bio").textContent =
    doctor.name + " là " + role + " chuyên về " + doctor.specialty.toLowerCase() +
    " với " + doctor.experience + " năm kinh nghiệm, hiện đang công tác tại " +
    doctor.workplace + ". Với phong cách tận tâm, giải thích dễ hiểu, " +
    doctor.name + " đã thực hiện " + doctor.visits + " lượt chăm sóc tại nhà qua HomeCare " +
    "và luôn được người bệnh đánh giá cao về sự chu đáo, đúng giờ.";
}


/* ---------- 3. CHUYÊN TRỊ + QUÁ TRÌNH CÔNG TÁC ---------- */
function fillTreatsAndTimeline(doctor) {
  // "A, B, C" -> tách theo dấu phẩy thành mảng ["A", " B", " C"], rồi trim() bỏ khoảng trắng
  // (escapeHTML vì bác sĩ có thể tự sửa nội dung này ở trang hồ sơ)
  const treats = doctor.treats.split(",");
  let treatsHTML = "";
  for (const item of treats) {
    if (item.trim() !== "") {
      treatsHTML += `<li>${escapeHTML(item.trim())}</li>`;
    }
  }
  document.getElementById("doctor-treats").innerHTML = treatsHTML;

  // Tính các mốc năm dựa vào số năm kinh nghiệm
  const thisYear = new Date().getFullYear();
  const startYear = thisYear - doctor.experience;

  let school = "Tốt nghiệp Bác sĩ Y khoa – Đại học Y Dược TP.HCM";
  if (doctor.type === "dieu-duong") {
    school = "Tốt nghiệp Cử nhân Điều dưỡng – Trường ĐH Y khoa Phạm Ngọc Thạch";
  }

  const milestones = [
    { year: startYear - 1, text: school },
    { year: startYear + " – nay", text: "Công tác tại " + doctor.workplace },
    { year: thisYear - 1 + " – nay", text: "Thành viên đội ngũ chăm sóc tại nhà HomeCare" }
  ];

  let timelineHTML = "";
  for (const item of milestones) {
    timelineHTML += `<li><strong>${item.year}</strong>${item.text}</li>`;
  }
  document.getElementById("doctor-timeline").innerHTML = timelineHTML;
}


/* ---------- 4. BẢNG GIÁ DỊCH VỤ ---------- */
function fillServiceTable(doctor) {
  let html = "";

  for (const service of getServices(doctor)) {
    html += `
      <tr>
        <td><strong>${service.name}</strong><small>${service.desc}</small></td>
        <td>${service.duration}</td>
        <td class="price">${formatMoney(service.price)}</td>
        <td>
          <a href="dat-lich.html?id=${doctor.id}&dv=${service.id}" class="btn btn-outline btn-small">Chọn</a>
        </td>
      </tr>`;
  }

  document.getElementById("service-rows").innerHTML = html;
}


/* ---------- 5. LỊCH LÀM VIỆC 7 NGÀY TỚI ----------
   Mỗi ngày là 1 cột. Trong cột:
   - Ngày nghỉ           -> 1 ô "Nghỉ"
   - Khung giờ đã kín    -> ô gạch ngang, không bấm được
   - Khung giờ còn trống -> link sang trang đặt lịch, mang theo ngày + giờ */
function fillSchedule(doctor) {
  const slots = getTimeSlots(doctor);
  let html = "";

  for (const date of getNextDays()) {
    const dateKey = toDateKey(date);
    const dayMonth = String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0");

    let slotsHTML = "";

    if (isWorkingDay(doctor, date) === false) {
      slotsHTML = `<span class="slot off">Nghỉ</span>`;
    } else {
      // forEach cho biết cả giá trị (time) lẫn vị trí (index) của phần tử
      slots.forEach(function (time, index) {
        if (isSlotBooked(doctor, dateKey, index)) {
          slotsHTML += `<span class="slot full" title="Đã có người đặt">${time}</span>`;
        } else {
          slotsHTML += `<a class="slot" href="dat-lich.html?id=${doctor.id}&ngay=${dateKey}&gio=${time}">${time}</a>`;
        }
      });
    }

    html += `
      <div class="schedule-day">
        <div class="schedule-day-head">
          <strong>${WEEKDAY_NAMES[date.getDay()]}</strong>${dayMonth}
        </div>
        ${slotsHTML}
      </div>`;
  }

  document.getElementById("schedule-grid").innerHTML = html;
}


/* ---------- 6. ĐÁNH GIÁ ---------- */
const sampleReviews = [
  { name: "Chị Thu Hà", stars: 5, date: "2 ngày trước",
    text: "Đến đúng giờ, khám rất kỹ và giải thích dễ hiểu. Bố mình lớn tuổi nên được khám tại nhà đỡ vất vả hơn nhiều." },
  { name: "Anh Minh Quân", stars: 5, date: "1 tuần trước",
    text: "Đặt lịch nhanh, nhân viên gọi xác nhận ngay. Sẽ tiếp tục dùng dịch vụ cho cả gia đình." },
  { name: "Cô Lan", stars: 4, date: "2 tuần trước",
    text: "Chuyên môn tốt, dặn dò kỹ cách dùng thuốc. Chỉ mong có thêm khung giờ buổi tối." },
  { name: "Anh Tuấn", stars: 5, date: "3 tuần trước",
    text: "Rất tận tâm, còn hướng dẫn người nhà cách theo dõi huyết áp mỗi ngày." },
  { name: "Chị Ngọc Anh", stars: 5, date: "1 tháng trước",
    text: "Bé nhà mình sợ đi viện nên khám tại nhà rất tiện. Thái độ nhẹ nhàng, bé hợp tác ngay." }
];

function fillReviews(doctor) {
  // Tỉ lệ mỗi mức sao, suy ra từ điểm trung bình (chỉ để minh họa)
  const fivePercent = Math.round((doctor.rating - 4) * 90);
  const bars = [
    { stars: 5, percent: fivePercent },
    { stars: 4, percent: 96 - fivePercent },
    { stars: 3, percent: 3 },
    { stars: 2, percent: 1 },
    { stars: 1, percent: 0 }
  ];

  let barsHTML = "";
  for (const bar of bars) {
    barsHTML += `
      <div class="review-bar">
        <span>${bar.stars} ★</span>
        <div class="bar-track"><div class="bar-fill" style="width: ${bar.percent}%"></div></div>
        <span>${bar.percent}%</span>
      </div>`;
  }

  document.getElementById("review-summary").innerHTML = `
    <div class="review-score">
      <strong>${doctor.rating.toFixed(1)}</strong>
      <span class="rating">★★★★★</span><br>
      <small>${Math.round(doctor.visits * 0.6)} đánh giá</small>
    </div>
    <div class="review-bars">${barsHTML}</div>`;

  // Mỗi bác sĩ lấy 3 đánh giá khác nhau: bắt đầu từ vị trí theo id
  // (% 5 = lấy phần dư khi chia 5 -> luôn nằm trong khoảng 0..4)
  let listHTML = "";
  for (let i = 0; i < 3; i++) {
    const review = sampleReviews[(doctor.id + i) % sampleReviews.length];
    listHTML += `
      <li>
        <div class="review-head">
          <strong>${review.name}</strong>
          <small>${review.date}</small>
        </div>
        <p class="rating">${"★".repeat(review.stars)}${"☆".repeat(5 - review.stars)}</p>
        <p>${review.text}</p>
      </li>`;
  }
  document.getElementById("review-list").innerHTML = listHTML;
}


/* ---------- 7. CHUYỂN TAB ---------- */
const profileTabs = document.querySelectorAll(".profile-tab");
const tabPanels = document.querySelectorAll(".tab-panel");

function openTab(tabName) {
  for (const tab of profileTabs) {
    // classList.toggle(tên, điều_kiện): điều kiện đúng thì thêm class, sai thì gỡ
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  }
  for (const panel of tabPanels) {
    panel.classList.toggle("active", panel.id === tabName);
  }
}

for (const tab of profileTabs) {
  tab.addEventListener("click", function () {
    openTab(tab.dataset.tab);
  });
}


/* ---------- 8. CHẠY KHI MỞ TRANG ---------- */
if (profileDoctor === null) {
  // id sai hoặc thiếu -> báo lỗi, gợi ý quay lại danh sách
  document.getElementById("doctor-profile").innerHTML = `
    <div class="empty-box">
      <i class="fa-solid fa-user-doctor"></i>
      <h3>Không tìm thấy bác sĩ</h3>
      <p>Đường dẫn không đúng hoặc bác sĩ không còn hoạt động.</p>
      <a href="dat-kham.html" class="btn btn-primary">Xem danh sách bác sĩ</a>
    </div>`;
} else {
  fillBasicInfo(profileDoctor);
  fillTreatsAndTimeline(profileDoctor);
  fillServiceTable(profileDoctor);
  fillSchedule(profileDoctor);
  fillReviews(profileDoctor);

  // Link có dạng ...#lich-lam-viec -> mở sẵn tab lịch làm việc
  const hashPanel = document.getElementById(window.location.hash.replace("#", ""));
  if (hashPanel !== null && hashPanel.classList.contains("tab-panel")) {
    openTab(hashPanel.id);
  }
}
