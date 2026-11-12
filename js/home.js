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

