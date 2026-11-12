/* =========================================================
   HOME.JS - XỬ LÝ TƯƠNG TÁC TRÊN TRANG CHỦ
   Người phụ trách: THÀNH VIÊN 2

   Chức năng:
   1. Ô tìm kiếm: bỏ trống thì báo lỗi, có chữ thì chuyển sang
      trang đặt khám và mang theo từ khóa (dat-kham.html?q=...)
   2. Nút "Đặt lịch" ở thẻ bác sĩ: chuyển sang trang đặt khám
      và tự tìm đúng bác sĩ đó
   ========================================================= */


/* ---------- 1. LẤY CÁC PHẦN TỬ HTML CẦN DÙNG ---------- */
const searchForm = document.getElementById("hero-search");
const searchInput = document.getElementById("search-input");
const searchError = document.getElementById("search-error");


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


/* ---------- 4. NÚT "ĐẶT LỊCH" Ở THẺ BÁC SĨ ----------
   Với mỗi thẻ bác sĩ: lấy tên bác sĩ (trong thẻ h3),
   rồi gắn tên đó vào link của nút "Đặt lịch". */
const doctorCards = document.querySelectorAll(".doctor-card");

for (const card of doctorCards) {
  const doctorName = card.querySelector("h3").textContent;
  const bookButton = card.querySelector(".btn");

  bookButton.href = "dat-kham.html?q=" + encodeURIComponent(doctorName);
}
