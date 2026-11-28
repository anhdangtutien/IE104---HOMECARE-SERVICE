/* =========================================================
   DAT-KHAM.JS - TRANG ĐẶT KHÁM THEO BÁC SĨ
   Người phụ trách: THÀNH VIÊN 5

   Chức năng:
   1. Lưu danh sách bác sĩ trong 1 mảng (array) các đối tượng (object)
   2. Dùng JavaScript tạo HTML cho từng thẻ bác sĩ
   3. Tìm kiếm theo tên / chuyên khoa / bệnh lý (gõ có dấu hay không dấu đều được)
   4. Chuyển tab Bác sĩ / Điều dưỡng
   5. Lọc theo chuyên khoa; sắp xếp theo lượt khám, giá
   6. Phân trang: mỗi trang hiện 4 người
   7. Nhận từ khóa / chuyên khoa từ trang chủ (dat-kham.html?q=... hoặc ?chuyen-khoa=...)
   ========================================================= */


/* ---------- 1. DỮ LIỆU ----------
   Mỗi bác sĩ là 1 object { tên_thuộc_tính: giá_trị }
   type: "bac-si" hoặc "dieu-duong" (để lọc theo tab)
   Muốn thêm bác sĩ -> copy 1 khối { ... } và sửa lại thông tin */
const doctors = [
  {
    id: 1,
    name: "ThS. Trần Ngọc C",
    letter: "C",
    type: "bac-si",
    specialty: "Nội tổng quát & Lão khoa",
    rating: 4.9,
    visits: 128,
    treats: "Tăng huyết áp, Đái tháo đường, Bệnh lý tim mạch người cao tuổi",
    schedule: "Thứ 2, 4, 6 (08:00 - 17:00), Chủ nhật hẹn trước",
    price: 300000,
    area: "TP. Thủ Đức"
  },
  {
    id: 2,
    name: "BS. Trần Lê Trung D",
    letter: "D",
    type: "bac-si",
    specialty: "Cơ xương khớp & Phục hồi chức năng",
    rating: 4.8,
    visits: 94,
    treats: "Thoát vị đĩa đệm, đau thần kinh tọa, tập vận động sau tai biến",
    schedule: "Thứ 3, 5, 7 (07:30 - 18:30)",
    price: 350000,
    area: "TP. Thủ Đức"
  },
  {
    id: 3,
    name: "BS. Phạm Thị E",
    letter: "E",
    type: "bac-si",
    specialty: "Nhi khoa & Dinh dưỡng lâm sàng",
    rating: 5.0,
    visits: 150,
    treats: "Viêm phế quản, sốt virus trẻ em, tư vấn chế độ dinh dưỡng trẻ biếng ăn",
    schedule: "Thứ 2 đến Thứ 7 (16:30 - 20:30)",
    price: 280000,
    area: "TP. Thủ Đức"
  },
  {
    id: 4,
    name: "BS. Nguyễn Tuấn Đ",
    letter: "Đ",
    type: "bac-si",
    specialty: "Tai Mũi Họng & Hô hấp",
    rating: 4.9,
    visits: 82,
    treats: "Viêm xoang cấp, nội soi vệ sinh tai mũi họng tại nhà, dị ứng thời tiết",
    schedule: "Thứ 2, 3, 5, 7 (08:00 - 17:30)",
    price: 300000,
    area: "TP. Thủ Đức"
  },
  {
    id: 5,
    name: "BS. Lê Hoàng G",
    letter: "G",
    type: "bac-si",
    specialty: "Tim mạch",
    rating: 4.7,
    visits: 66,
    treats: "Rối loạn nhịp tim, suy tim, theo dõi huyết áp định kỳ",
    schedule: "Thứ 3, 6 (08:00 - 16:00)",
    price: 400000,
    area: "TP. Thủ Đức"
  },
  {
    id: 6,
    name: "BS. Đỗ Thu H",
    letter: "H",
    type: "bac-si",
    specialty: "Da liễu",
    rating: 4.6,
    visits: 58,
    treats: "Viêm da cơ địa, mụn trứng cá, nấm da, dị ứng mẩn ngứa",
    schedule: "Thứ 7, Chủ nhật (08:00 - 12:00)",
    price: 250000,
    area: "TP. Thủ Đức"
  },
  {
    id: 7,
    name: "ThS. Bùi Quang K",
    letter: "K",
    type: "bac-si",
    specialty: "Thần kinh",
    rating: 4.8,
    visits: 73,
    treats: "Đau đầu kéo dài, mất ngủ, rối loạn tiền đình, theo dõi sau đột quỵ",
    schedule: "Thứ 2, 4 (13:30 - 19:00)",
    price: 380000,
    area: "TP. Thủ Đức"
  },
  {
    id: 8,
    name: "BS. Phan Ngọc L",
    letter: "L",
    type: "bac-si",
    specialty: "Sản phụ khoa",
    rating: 4.9,
    visits: 104,
    treats: "Khám thai định kỳ, chăm sóc mẹ sau sinh, tư vấn sức khỏe sinh sản",
    schedule: "Thứ 2 đến Thứ 6 (08:00 - 17:00)",
    price: 320000,
    area: "TP. Thủ Đức"
  },
  {
    id: 9,
    name: "ĐD. Lê Thị M",
    letter: "M",
    type: "dieu-duong",
    specialty: "Chăm sóc người cao tuổi",
    rating: 4.9,
    visits: 210,
    treats: "Theo dõi sinh hiệu, hỗ trợ vệ sinh cá nhân, nhắc uống thuốc",
    schedule: "Hằng ngày (07:00 - 19:00)",
    price: 200000,
    area: "TP. Thủ Đức"
  },
  {
    id: 10,
    name: "ĐD. Võ Văn N",
    letter: "N",
    type: "dieu-duong",
    specialty: "Chăm sóc vết thương",
    rating: 4.8,
    visits: 165,
    treats: "Thay băng, rửa vết thương, cắt chỉ sau phẫu thuật",
    schedule: "Thứ 2 đến Thứ 7 (08:00 - 18:00)",
    price: 220000,
    area: "TP. Thủ Đức"
  },
  {
    id: 11,
    name: "ĐD. Ngô Thị P",
    letter: "P",
    type: "dieu-duong",
    specialty: "Tiêm truyền tại nhà",
    rating: 4.7,
    visits: 189,
    treats: "Truyền dịch, tiêm thuốc theo đơn bác sĩ, lấy máu xét nghiệm",
    schedule: "Hằng ngày (06:30 - 20:00)",
    price: 250000,
    area: "TP. Thủ Đức"
  },
  {
    id: 12,
    name: "ĐD. Huỳnh Minh Q",
    letter: "Q",
    type: "dieu-duong",
    specialty: "Vật lý trị liệu",
    rating: 4.6,
    visits: 97,
    treats: "Tập vận động, xoa bóp phục hồi, hướng dẫn bài tập tại nhà",
    schedule: "Thứ 3, 5, 7 (14:00 - 20:00)",
    price: 230000,
    area: "TP. Thủ Đức"
  }
];

/* Tự động nạp thêm bác sĩ / điều dưỡng vừa đăng ký tài khoản từ hệ thống */
function loadRegisteredDoctors() {
  let accounts = [];
  try {
    accounts = JSON.parse(localStorage.getItem("homecare_accounts")) || [];
  } catch (e) {
    accounts = [];
  }

  // Nếu có tài khoản bác sĩ đang đăng nhập
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem("homecare_user")); } catch (e) {}
  if (currentUser && currentUser.role === "bac-si" && currentUser.name) {
    const existsInAccounts = accounts.some(function (acc) {
      return (acc.phone && acc.phone === currentUser.phone) || acc.fullname === currentUser.name;
    });
    if (!existsInAccounts) {
      accounts.push({
        fullname: currentUser.name,
        phone: currentUser.phone || "",
        role: "bac-si",
        specialty: "Nội tổng quát & Đa khoa",
        street: "TP. Hồ Chí Minh"
      });
    }
  }

  let doctorProf = null;
  try { doctorProf = JSON.parse(localStorage.getItem("homecare_doctor_profile")); } catch (e) {}

  const doctorAccounts = accounts.filter(function (acc) {
    return acc.role === "bac-si";
  });

  doctorAccounts.forEach(function (acc, index) {
    const alreadyExists = doctors.some(function (d) {
      return (acc.phone && d.phone === acc.phone) || d.name.toLowerCase().includes(acc.fullname.toLowerCase());
    });
    if (!alreadyExists && acc.fullname) {
      const isNurse = Array.isArray(acc.certificates) && acc.certificates.includes("dieu-duong");
      const title = isNurse ? "ĐD. " : (acc.fullname.startsWith("BS") || acc.fullname.startsWith("ThS") ? "" : "BS. ");
      const initial = acc.fullname.trim().split(" ").slice(-1)[0].charAt(0).toUpperCase();

      doctors.push({
        id: 100 + index,
        name: title + acc.fullname,
        letter: initial,
        type: isNurse ? "dieu-duong" : "bac-si",
        specialty: (doctorProf && doctorProf.phone === acc.phone && doctorProf.specialty) || acc.specialty || (isNurse ? "Chăm sóc & Điều dưỡng tại nhà" : "Nội tổng quát & Đa khoa"),
        rating: 5.0,
        visits: 0,
        treats: (doctorProf && doctorProf.phone === acc.phone && doctorProf.treats) || acc.treats || "Khám, tư vấn và chăm sóc sức khỏe tại nhà",
        schedule: "Thứ 2 - Thứ 7 (08:00 - 17:00)",
        price: (doctorProf && doctorProf.phone === acc.phone && doctorProf.price) || 300000,
        area: (doctorProf && doctorProf.phone === acc.phone && doctorProf.area) || acc.street || "TP. Hồ Chí Minh",
        phone: acc.phone
      });
    }
  });
}
loadRegisteredDoctors();


/* ---------- 2. BIẾN LƯU TRẠNG THÁI HIỆN TẠI ----------
   Mỗi khi người dùng tìm kiếm / đổi tab / đổi trang,
   ta cập nhật các biến này rồi gọi renderDoctors() để vẽ lại */
const ITEMS_PER_PAGE = 4;     // số người mỗi trang
let currentType = "bac-si";   // tab đang chọn
let currentKeyword = "";      // từ khóa tìm kiếm
let currentSort = "default";  // kiểu sắp xếp
let currentSpecialty = "";    // chuyên khoa đang lọc ("" = tất cả)
let currentPageNumber = 1;    // trang đang xem


/* ---------- 3. LẤY CÁC PHẦN TỬ HTML ---------- */
const doctorList = document.getElementById("doctor-list");
const pagination = document.getElementById("pagination");
const resultCount = document.getElementById("result-count");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const tabButtons = document.querySelectorAll(".tab");
const filterButton = document.getElementById("filter-button");
const filterPanel = document.getElementById("filter-panel");
const sortSelect = document.getElementById("sort-select");
const specialtySelect = document.getElementById("specialty-select");


/* ---------- 4. CÁC HÀM TIỆN ÍCH ---------- */

// Đổi số thành dạng tiền Việt: 300000 -> "300.000đ"
function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

// Bỏ dấu tiếng Việt để tìm kiếm: "Trần Ngọc" -> "tran ngoc"
// (người dùng gõ "tran" vẫn tìm ra "Trần")
function removeAccents(text) {
  return text
    .toLowerCase()
    .normalize("NFD")                  // tách chữ và dấu: "ầ" -> "a" + dấu
    .replace(/[̀-ͯ]/g, "")   // xóa các dấu vừa tách ra
    .replace(/đ/g, "d");               // riêng chữ "đ" phải đổi tay
}


/* ---------- 5. TẠO HTML CHO 1 THẺ BÁC SĨ ----------
   Dùng template string `...` và ${...} để chèn dữ liệu vào HTML */
function createDoctorCard(doctor) {
  return `
    <article class="doctor-item">
      <div class="doctor-item-top">
        <div class="avatar">
          ${doctor.letter}
          <span class="verified"><i class="fa-solid fa-check"></i></span>
        </div>

        <div class="doctor-info">
          <div class="doctor-name-row">
            <h3><a href="chi-tiet-bac-si.html?id=${doctor.id}">${doctor.name}</a></h3>
            <span class="tag">${doctor.specialty}</span>
            <span class="doctor-visits">
              <i class="fa-solid fa-user-check"></i> ${doctor.visits} lượt khám
            </span>
          </div>
          <p><span class="label">Chuyên trị:</span> ${doctor.treats}</p>
          <p><span class="label">Lịch khám:</span> ${doctor.schedule}</p>
          <p><span class="label">Giá khám:</span> <strong class="price">${formatPrice(doctor.price)} / lượt tại nhà</strong></p>
        </div>
      </div>

      <div class="doctor-item-bottom">
        <span><i class="fa-solid fa-location-dot"></i>Khu vực phục vụ: ${doctor.area}</span>
        <span>
          <a href="chi-tiet-bac-si.html?id=${doctor.id}" class="btn btn-outline btn-small">Xem hồ sơ</a>
          <button type="button" class="btn btn-primary btn-small" onclick="bookDoctor(${doctor.id})">Đặt lịch</button>
        </span>
      </div>
    </article>
  `;
}


/* ---------- 6. LỌC + SẮP XẾP DỮ LIỆU ----------
   Trả về mảng mới gồm những bác sĩ phù hợp với tab, từ khóa và kiểu sắp xếp */
function getFilteredDoctors() {
  const keyword = removeAccents(currentKeyword);
  const result = [];

  for (const doctor of doctors) {
    // Điều kiện 1: đúng loại (bác sĩ / điều dưỡng)
    const isRightType = doctor.type === currentType;

    // Điều kiện 2: tên, chuyên khoa hoặc bệnh lý có chứa từ khóa
    const searchText = removeAccents(doctor.name + " " + doctor.specialty + " " + doctor.treats);
    const isMatchKeyword = searchText.includes(keyword);

    // Điều kiện 3: đúng chuyên khoa đang lọc (chưa chọn thì bỏ qua điều kiện này)
    const isRightSpecialty = currentSpecialty === "" || doctor.specialty === currentSpecialty;

    if (isRightType && isMatchKeyword && isRightSpecialty) {
      result.push(doctor);    // thêm vào mảng kết quả
    }
  }

  // Sắp xếp. Hàm so sánh (a, b) trả về số âm thì a đứng trước b
  if (currentSort === "visits") {
    result.sort(function (a, b) { return b.visits - a.visits; });   // nhiều -> ít
  } else if (currentSort === "price-asc") {
    result.sort(function (a, b) { return a.price - b.price; });     // thấp -> cao
  } else if (currentSort === "price-desc") {
    result.sort(function (a, b) { return b.price - a.price; });     // cao -> thấp
  }

  return result;
}


/* ---------- 7. HIỂN THỊ DANH SÁCH LÊN TRANG ---------- */
function renderDoctors() {
  const filteredDoctors = getFilteredDoctors();

  // Không có kết quả
  // (Không chèn từ khóa người dùng gõ vào innerHTML, vì nếu họ gõ mã HTML
  //  thì trình duyệt sẽ chạy mã đó -> lỗi bảo mật XSS)
  if (filteredDoctors.length === 0) {
    resultCount.textContent = "";
    doctorList.innerHTML = `
      <div class="empty-message">
        <i class="fa-solid fa-user-doctor"></i>
        Không tìm thấy kết quả phù hợp.<br>
        Hãy thử từ khóa khác, chọn "Tất cả chuyên khoa" hoặc chuyển sang tab còn lại.
      </div>
    `;
    pagination.innerHTML = "";
    return;
  }

  // Tính tổng số trang. Math.ceil = làm tròn LÊN (9 người / 4 = 2.25 -> 3 trang)
  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);

  // Cắt lấy những người thuộc trang hiện tại
  // Trang 1: vị trí 0 -> 3, trang 2: vị trí 4 -> 7, ...
  const startIndex = (currentPageNumber - 1) * ITEMS_PER_PAGE;
  const pageDoctors = filteredDoctors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Ghép HTML của từng thẻ lại thành 1 chuỗi dài
  let html = "";
  for (const doctor of pageDoctors) {
    html += createDoctorCard(doctor);
  }
  doctorList.innerHTML = html;

  resultCount.textContent = "Tìm thấy " + filteredDoctors.length + " kết quả";
  renderPagination(totalPages);
}


/* ---------- 8. TẠO CÁC NÚT PHÂN TRANG ---------- */

// Tạo 1 nút: text là chữ trên nút, pageNumber là trang sẽ chuyển tới khi bấm
function createPageButton(text, pageNumber) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "page-button";
  button.textContent = text;

  button.addEventListener("click", function () {
    currentPageNumber = pageNumber;
    renderDoctors();
    // Cuộn lên đầu danh sách
    doctorList.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return button;
}

function renderPagination(totalPages) {
  pagination.innerHTML = "";        // xóa các nút cũ

  // Chỉ có 1 trang thì không cần nút phân trang
  if (totalPages <= 1) {
    return;
  }

  // Nút "‹" về trang trước
  const prevButton = createPageButton("‹", currentPageNumber - 1);
  prevButton.disabled = currentPageNumber === 1;   // đang ở trang 1 thì khóa
  pagination.appendChild(prevButton);

  // Các nút số 1, 2, 3...
  for (let i = 1; i <= totalPages; i++) {
    const numberButton = createPageButton(i, i);
    if (i === currentPageNumber) {
      numberButton.classList.add("active");
    }
    pagination.appendChild(numberButton);
  }

  // Nút "›" sang trang sau
  const nextButton = createPageButton("›", currentPageNumber + 1);
  nextButton.disabled = currentPageNumber === totalPages;  // trang cuối thì khóa
  pagination.appendChild(nextButton);
}


/* ---------- 9. BẤM NÚT "ĐẶT LỊCH" ----------
   Hàm này được gọi từ onclick="bookDoctor(id)" trong thẻ bác sĩ.
   Chuyển sang trang đặt lịch (chọn gói, ngày giờ, nhập thông tin),
   mang theo id của bác sĩ trên link: dat-lich.html?id=3 */
function bookDoctor(id) {
  window.location.href = "dat-lich.html?id=" + id;
}


/* ---------- 10. GẮN SỰ KIỆN ---------- */

// Tìm kiếm: gõ tới đâu lọc tới đó
searchInput.addEventListener("input", function () {
  currentKeyword = searchInput.value.trim();
  currentPageNumber = 1;            // tìm mới thì quay về trang 1
  renderDoctors();
});

// Nhấn Enter hoặc nút "Tìm kiếm": chặn tải lại trang (danh sách đã được lọc ở trên)
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
});

// Chuyển tab Bác sĩ / Điều dưỡng
for (const tab of tabButtons) {
  tab.addEventListener("click", function () {
    for (const otherTab of tabButtons) {
      otherTab.classList.remove("active");
    }
    tab.classList.add("active");

    currentType = tab.dataset.type;  // đọc data-type="..." của nút
    currentPageNumber = 1;
    currentSpecialty = "";           // mỗi tab có chuyên khoa khác nhau -> bỏ lọc cũ
    renderSpecialtyOptions();
    renderDoctors();
  });
}

// Bấm "Bộ lọc" -> hiện / ẩn bảng lọc
filterButton.addEventListener("click", function () {
  const isOpen = filterPanel.classList.toggle("show");
  filterButton.setAttribute("aria-expanded", isOpen);
});

// Đổi kiểu sắp xếp
sortSelect.addEventListener("change", function () {
  currentSort = sortSelect.value;
  currentPageNumber = 1;
  renderDoctors();
});


/* ---------- 11. LỌC THEO CHUYÊN KHOA ----------
   AI prompt: "Trang đặt lịch khám: thêm bộ lọc theo chuyên ngành" –
   mục này được viết với sự hỗ trợ của AI.
   Danh sách chuyên khoa lấy từ chính mảng doctors (không gõ tay),
   chỉ gồm chuyên khoa của tab đang chọn, mỗi chuyên khoa xuất hiện 1 lần. */
function renderSpecialtyOptions() {
  const specialties = [];
  for (const doctor of doctors) {
    if (doctor.type === currentType && specialties.includes(doctor.specialty) === false) {
      specialties.push(doctor.specialty);
    }
  }

  // new Option(chữ hiển thị, giá trị): tạo thẻ <option> bằng JS
  specialtySelect.innerHTML = "";
  specialtySelect.appendChild(new Option("Tất cả chuyên khoa", ""));
  for (const specialty of specialties) {
    specialtySelect.appendChild(new Option(specialty, specialty));
  }
  specialtySelect.value = currentSpecialty;
}

specialtySelect.addEventListener("change", function () {
  currentSpecialty = specialtySelect.value;
  currentPageNumber = 1;
  renderDoctors();
});


/* ---------- 12. CHẠY LẦN ĐẦU KHI MỞ TRANG ----------
   Nếu đến từ ô tìm kiếm ở trang chủ thì link có dạng dat-kham.html?q=tim+mach
   -> đọc giá trị q và điền sẵn vào ô tìm kiếm */
const urlParams = new URLSearchParams(window.location.search);
const keywordFromHome = urlParams.get("q");   // không có thì trả về null

if (keywordFromHome !== null) {
  currentKeyword = keywordFromHome;
  searchInput.value = keywordFromHome;
}

// Chọn chuyên khoa từ gợi ý tìm kiếm ở trang chủ: dat-kham.html?chuyen-khoa=Tim%20mạch
// Chuyên khoa của điều dưỡng thì tự chuyển sang tab "Điều dưỡng"
const specialtyFromLink = urlParams.get("chuyen-khoa");
const doctorOfSpecialty = doctors.find(function (doctor) { return doctor.specialty === specialtyFromLink; });
if (doctorOfSpecialty !== undefined) {
  currentSpecialty = specialtyFromLink;
  currentType = doctorOfSpecialty.type;
  for (const tab of tabButtons) {
    tab.classList.toggle("active", tab.dataset.type === currentType);
  }
}

renderSpecialtyOptions();
renderDoctors();
