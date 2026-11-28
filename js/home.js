/* =========================================================
   HOME.JS - XỬ LÝ TƯƠNG TÁC TRÊN TRANG CHỦ
   Người phụ trách: THÀNH VIÊN 2
   Cần nạp js/du-lieu.js trước file này (lấy danh sách bác sĩ doctorData).

   Chức năng:
   1. Ô tìm kiếm: bỏ trống thì báo lỗi, có chữ thì chuyển sang
      trang đặt khám và mang theo từ khóa (dat-kham.html?q=...)
   2. Gợi ý xổ xuống khi gõ: bác sĩ, chuyên khoa, dịch vụ, hướng dẫn
   3. Nút "Đặt lịch" ở thẻ bác sĩ: chuyển sang trang hồ sơ của
      đúng bác sĩ đó (chi-tiet-bac-si.html?id=...)
   4. Nút "Xem tất cả": danh sách bác sĩ trượt xuống ngay trong trang chủ
   ========================================================= */


/* ---------- 1. LẤY CÁC PHẦN TỬ HTML CẦN DÙNG ---------- */
const searchForm = document.getElementById("hero-search");
const searchInput = document.getElementById("search-input");
const searchError = document.getElementById("search-error");
const suggestionList = document.getElementById("search-suggestions");


/* ---------- 2. KHI BẤM NÚT "TÌM KIẾM" ----------
   "submit" xảy ra khi bấm nút Tìm kiếm HOẶC nhấn Enter trong ô nhập */
searchForm.addEventListener("submit", function (event) {
  // Mặc định form sẽ tải lại trang -> chặn lại để tự xử lý
  event.preventDefault();

  // .trim() xóa khoảng trắng thừa ở đầu và cuối chuỗi
  const keyword = searchInput.value.trim();

  // Trường hợp 1: chưa nhập gì -> hiện lỗi
  if (keyword === "") {
    searchForm.classList.add("error");
    searchError.classList.add("show");
    searchInput.focus();          // đưa con trỏ chuột vào ô nhập
    return;                       // dừng hàm tại đây
  }

  // Trường hợp 2: có từ khóa -> chuyển trang
  // encodeURIComponent: mã hóa chữ có dấu, khoảng trắng để đặt vào link
  window.location.href = "dat-kham.html?q=" + encodeURIComponent(keyword);
});


/* ---------- 3. KHI ĐANG GÕ CHỮ -> ẨN THÔNG BÁO LỖI ---------- */
searchInput.addEventListener("input", function () {
  searchForm.classList.remove("error");
  searchError.classList.remove("show");
});


/* =========================================================
   AI prompt: "Ô tìm kiếm: hiển thị danh sách gợi ý xổ xuống khi nhập" –
   mục 4 bên dưới được viết với sự hỗ trợ của AI.
   ========================================================= */

/* ---------- 4. GỢI Ý TÌM KIẾM ---------- */

// 4.1. Bỏ dấu tiếng Việt: "Trần Ngọc" -> "tran ngoc" (gõ không dấu vẫn ra kết quả)
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

// 4.2. Dữ liệu để gợi ý
// Các trang dịch vụ / hướng dẫn (keywords: từ khóa phụ, viết không dấu)
const SEARCH_PAGES = [
  { text: "Đặt khám tại nhà", type: "Dịch vụ", link: "dat-kham.html", icon: "fa-solid fa-house-medical", keywords: "bac si den nha kham benh" },
  { text: "Gọi video với bác sĩ", type: "Dịch vụ", link: "dich-vu.html#goi-video", icon: "fa-solid fa-video", keywords: "tu van online truc tuyen" },
  { text: "Đặt lịch xét nghiệm tại nhà", type: "Dịch vụ", link: "dich-vu.html#xet-nghiem", icon: "fa-solid fa-syringe", keywords: "lay mau mau xet nghiem" },
  { text: "Gói chăm sóc định kỳ", type: "Gói chăm sóc", link: "goi-cham-soc.html", icon: "fa-solid fa-kit-medical", keywords: "goi thang nam nguoi cao tuoi" },
  { text: "Cách đặt lịch khám", type: "Hướng dẫn", link: "huong-dan.html#dat-lich", icon: "fa-regular fa-circle-question", keywords: "huong dan dat lich" },
  { text: "Câu hỏi thường gặp", type: "Hướng dẫn", link: "huong-dan.html#cau-hoi", icon: "fa-regular fa-circle-question", keywords: "faq hoi dap" },
  { text: "Chính sách hoàn tiền", type: "Hướng dẫn", link: "huong-dan.html#hoan-tien", icon: "fa-solid fa-rotate-left", keywords: "huy lich hoan tien" }
];

// Bác sĩ / điều dưỡng (lấy từ du-lieu.js), tìm theo tên, chuyên khoa, bệnh chuyên trị
const SEARCH_DOCTORS = doctorData.map(function (doctor) {
  return {
    text: doctor.name,
    sub: doctor.specialty,
    type: doctor.type === "dieu-duong" ? "Điều dưỡng" : "Bác sĩ",
    link: "chi-tiet-bac-si.html?id=" + doctor.id,
    icon: doctor.type === "dieu-duong" ? "fa-solid fa-user-nurse" : "fa-solid fa-user-doctor",
    keywords: doctor.specialty + " " + doctor.treats
  };
});

// Chuyên khoa (mỗi chuyên khoa 1 dòng, không lặp) -> mở trang Đặt khám đã lọc sẵn
const SEARCH_SPECIALTIES = [];
for (const doctor of doctorData) {
  const exists = SEARCH_SPECIALTIES.some(function (item) { return item.text === doctor.specialty; });
  if (exists === false) {
    SEARCH_SPECIALTIES.push({
      text: doctor.specialty,
      type: "Chuyên khoa",
      link: "dat-kham.html?chuyen-khoa=" + encodeURIComponent(doctor.specialty),
      icon: "fa-solid fa-stethoscope",
      keywords: ""
    });
  }
}

// 4.3. Mục có khớp từ khóa không: MỌI từ người dùng gõ đều phải xuất hiện
function isMatch(item, words) {
  const haystack = normalizeText(item.text + " " + (item.sub || "") + " " + item.keywords);
  return words.every(function (word) { return haystack.includes(word); });
}

function findSuggestions(keyword) {
  const words = normalizeText(keyword).split(/\s+/).filter(Boolean);

  const doctors = SEARCH_DOCTORS.filter(function (item) { return isMatch(item, words); }).slice(0, 4);
  const specialties = SEARCH_SPECIALTIES.filter(function (item) { return isMatch(item, words); }).slice(0, 2);
  const pages = SEARCH_PAGES.filter(function (item) { return isMatch(item, words); }).slice(0, 2);

  return doctors.concat(specialties, pages);
}

// 4.4. Tô đậm phần chữ khớp từ khóa (dùng textContent + <mark>, không chèn thẳng chữ người dùng vào HTML)
function fillHighlighted(element, text, keyword) {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword.trim());
  const start = normalizedText.indexOf(normalizedKeyword);

  // Bỏ dấu không làm đổi độ dài chuỗi -> vị trí trong chuỗi gốc giống chuỗi đã bỏ dấu
  if (normalizedKeyword === "" || start === -1 || normalizedText.length !== text.length) {
    element.textContent = text;
    return;
  }

  const mark = document.createElement("mark");
  mark.textContent = text.slice(start, start + normalizedKeyword.length);
  element.append(text.slice(0, start), mark, text.slice(start + normalizedKeyword.length));
}

// 4.5. Vẽ danh sách gợi ý
let activeIndex = -1;          // dòng đang chọn bằng phím mũi tên (-1 = chưa chọn)

function createSuggestionItem(index, item, keyword) {
  const li = document.createElement("li");
  li.id = "suggestion-" + index;
  li.setAttribute("role", "option");

  const link = document.createElement("a");
  link.href = item.link;
  link.tabIndex = -1;          // di chuyển bằng phím mũi tên, không bằng Tab
  link.className = "suggestion";
  link.innerHTML = `
    <i class="${item.icon}"></i>
    <span class="suggestion-text"><strong></strong><small></small></span>
    <span class="suggestion-type"></span>`;

  fillHighlighted(link.querySelector("strong"), item.text, keyword);
  link.querySelector("small").textContent = item.sub || "";
  link.querySelector(".suggestion-type").textContent = item.type;

  li.appendChild(link);
  return li;
}

function renderSuggestions() {
  const keyword = searchInput.value.trim();
  if (keyword === "") {
    closeSuggestions();
    return;
  }

  const results = findSuggestions(keyword);
  suggestionList.innerHTML = "";
  activeIndex = -1;

  results.forEach(function (item, index) {
    suggestionList.appendChild(createSuggestionItem(index, item, keyword));
  });

  if (results.length === 0) {
    const empty = document.createElement("li");
    empty.className = "suggestion-empty";
    empty.textContent = "Không có gợi ý phù hợp. Nhấn Enter để tìm trong danh sách bác sĩ.";
    suggestionList.appendChild(empty);
  }

  // Dòng cuối: tìm tất cả trong trang Đặt khám
  const searchAll = createSuggestionItem(results.length, {
    text: "Tìm “" + keyword + "” trong danh sách bác sĩ",
    type: "Tất cả",
    link: "dat-kham.html?q=" + encodeURIComponent(keyword),
    icon: "fa-solid fa-magnifying-glass"
  }, "");
  searchAll.classList.add("suggestion-all");
  suggestionList.appendChild(searchAll);

  suggestionList.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function closeSuggestions() {
  suggestionList.hidden = true;
  activeIndex = -1;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
}

// Tô sáng dòng thứ index (khi dùng phím mũi tên)
function setActive(index) {
  const options = suggestionList.querySelectorAll('[role="option"]');
  if (options.length === 0) {
    return;
  }
  // Vượt quá cuối thì quay về đầu và ngược lại
  activeIndex = (index + options.length) % options.length;

  options.forEach(function (option, i) {
    option.classList.toggle("active", i === activeIndex);
  });
  options[activeIndex].scrollIntoView({ block: "nearest" });
  searchInput.setAttribute("aria-activedescendant", options[activeIndex].id);
}

// 4.6. Gắn sự kiện
searchInput.addEventListener("input", renderSuggestions);
searchInput.addEventListener("focus", renderSuggestions);

searchInput.addEventListener("keydown", function (event) {
  if (suggestionList.hidden) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActive(activeIndex + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setActive(activeIndex - 1);
  } else if (event.key === "Escape") {
    closeSuggestions();
  } else if (event.key === "Enter" && activeIndex !== -1) {
    // Đang chọn 1 gợi ý -> mở gợi ý đó thay vì gửi form
    event.preventDefault();
    const options = suggestionList.querySelectorAll('[role="option"] a');
    window.location.href = options[activeIndex].href;
  }
});

// Bấm ra ngoài ô tìm kiếm -> đóng danh sách
document.addEventListener("click", function (event) {
  if (searchForm.contains(event.target) === false) {
    closeSuggestions();
  }
});


/* ---------- 5. NÚT "ĐẶT LỊCH" Ở THẺ BÁC SĨ ----------
   Với mỗi thẻ bác sĩ: đọc id trong data-id="..." (dataset.id),
   rồi gắn vào link của nút "Đặt lịch" -> mở trang hồ sơ bác sĩ đó.
   Thẻ không có data-id thì giữ cách cũ: tìm theo tên ở trang đặt khám. */
const doctorCards = document.querySelectorAll(".doctor-card");

for (const card of doctorCards) {
  const bookButton = card.querySelector(".btn");

  if (card.dataset.id !== undefined) {
    bookButton.href = "chi-tiet-bac-si.html?id=" + card.dataset.id;
  } else {
    const doctorName = card.querySelector("h3").textContent;
    bookButton.href = "dat-kham.html?q=" + encodeURIComponent(doctorName);
  }
}


/* =========================================================
   AI prompt: "Bác sĩ tiêu biểu: bấm vào thì danh sách bác sĩ trượt
   xuống ngay trong trang chủ, không chuyển trang" – mục 6 bên dưới
   được viết với sự hỗ trợ của AI.
   ========================================================= */

/* ---------- 6. DANH SÁCH BÁC SĨ TRƯỢT XUỐNG ---------- */
const toggleDoctorsButton = document.getElementById("toggle-doctors");
const moreDoctors = document.getElementById("more-doctors");
const moreDoctorGrid = document.getElementById("more-doctor-grid");

// Tạo thẻ cho các bác sĩ / điều dưỡng chưa có trong 4 thẻ tiêu biểu
function renderMoreDoctors() {
  const featuredIds = [];
  for (const card of doctorCards) {
    featuredIds.push(Number(card.dataset.id));
  }

  let html = "";
  for (const doctor of doctorData) {
    if (featuredIds.includes(doctor.id)) {
      continue;
    }
    // escapeHTML (du-lieu.js): tên / chuyên khoa có thể do bác sĩ tự sửa ở trang hồ sơ
    html += `
      <div class="doctor-card">
        <div class="avatar">${escapeHTML(doctor.letter)}</div>
        <h3>${escapeHTML(doctor.name)}</h3>
        <p class="doctor-specialty">${escapeHTML(doctor.specialty)}</p>
        <p class="doctor-visits"><i class="fa-solid fa-user-check"></i> ${doctor.visits} lượt khám</p>
        <a href="chi-tiet-bac-si.html?id=${doctor.id}" class="btn btn-outline btn-small">Đặt lịch</a>
      </div>`;
  }
  moreDoctorGrid.innerHTML = html;
}

toggleDoctorsButton.addEventListener("click", function () {
  // Thêm / gỡ class "open": CSS lo phần hiệu ứng trượt (grid-template-rows 0fr -> 1fr)
  const isOpen = moreDoctors.classList.toggle("open");

  moreDoctors.inert = isOpen === false;
  toggleDoctorsButton.setAttribute("aria-expanded", isOpen);
  toggleDoctorsButton.querySelector("span").textContent = isOpen ? "Thu gọn" : "Xem tất cả";

  // Thu gọn khi đang cuộn tận dưới -> kéo về đầu khối cho khỏi lạc
  if (isOpen === false && toggleDoctorsButton.getBoundingClientRect().top < 0) {
    toggleDoctorsButton.closest("section").scrollIntoView({ behavior: "smooth" });
  }
});

renderMoreDoctors();
