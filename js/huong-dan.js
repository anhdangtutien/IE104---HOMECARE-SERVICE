/* =========================================================
   HUONG-DAN.JS - TRANG HƯỚNG DẪN: TÌM KIẾM CÂU HỎI THƯỜNG GẶP
   Người phụ trách: THÀNH VIÊN 2

   Chức năng:
   1. Gõ từ khóa -> chỉ hiện câu hỏi có chứa từ khóa (không dấu cũng tìm được)
   2. Nút "Mở tất cả / Thu gọn" toàn bộ câu trả lời
   ========================================================= */


const faqItems = document.querySelectorAll(".faq-item");
const faqSearch = document.getElementById("faq-search");
const faqToggle = document.getElementById("faq-toggle");
const faqEmpty = document.getElementById("faq-empty");


// Bỏ dấu tiếng Việt: "Hoàn tiền" -> "hoan tien"
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}


/* ---------- 1. TÌM KIẾM ---------- */
faqSearch.addEventListener("input", function () {
  const keyword = normalizeText(faqSearch.value.trim());
  let visibleCount = 0;

  for (const item of faqItems) {
    // textContent lấy toàn bộ chữ bên trong (cả câu hỏi lẫn câu trả lời)
    const isMatch = normalizeText(item.textContent).includes(keyword);
    item.hidden = !isMatch;

    if (isMatch) {
      visibleCount++;
    }

    // Đang tìm thì mở sẵn câu trả lời để đọc luôn, xóa từ khóa thì đóng lại
    item.open = isMatch && keyword !== "";
  }

  faqEmpty.hidden = visibleCount > 0;
});

