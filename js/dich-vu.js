/* =========================================================
   DICH-VU.JS - TRANG DỊCH VỤ: CHỌN XÉT NGHIỆM VÀ TÍNH TIỀN
   Người phụ trách: THÀNH VIÊN 2

   Chức năng:
   1. Tạo danh sách xét nghiệm từ mảng dữ liệu
   2. Tích chọn -> tự tính số lượng và tổng tiền
   3. Nút chọn nhanh theo gói
   4. "Đặt lịch lấy mẫu" -> sang trang đặt lịch với điều dưỡng lấy mẫu,
      mang theo danh sách xét nghiệm đã chọn làm ghi chú
   ========================================================= */


/* ---------- 1. DỮ LIỆU ---------- */
const labTests = [
  { id: "ctm", name: "Công thức máu", desc: "Tổng phân tích tế bào máu, phát hiện thiếu máu, nhiễm trùng", price: 90000 },
  { id: "duong-huyet", name: "Đường huyết lúc đói", desc: "Tầm soát tiểu đường (nhịn ăn 8 tiếng)", price: 40000 },
  { id: "hba1c", name: "HbA1c", desc: "Đường huyết trung bình 3 tháng gần nhất", price: 150000 },
  { id: "mo-mau", name: "Mỡ máu (4 chỉ số)", desc: "Cholesterol, Triglyceride, HDL, LDL", price: 200000 },
  { id: "gan", name: "Chức năng gan", desc: "AST, ALT, GGT", price: 150000 },
  { id: "than", name: "Chức năng thận", desc: "Ure, Creatinin", price: 100000 },
  { id: "acid-uric", name: "Acid uric", desc: "Tầm soát bệnh gout", price: 60000 },
  { id: "nuoc-tieu", name: "Tổng phân tích nước tiểu", desc: "10 thông số, phát hiện bệnh thận, tiểu đường", price: 70000 }
];

// Các gói chọn nhanh: danh sách id xét nghiệm
const labPresets = {
  "co-ban": ["ctm", "duong-huyet", "mo-mau", "gan", "than"],
  "tieu-duong": ["duong-huyet", "hba1c", "than", "nuoc-tieu"],
  "bo-chon": []
};

const SAMPLE_FEE = 120000;     // phí điều dưỡng đến lấy mẫu
const LAB_NURSE_ID = 11;       // ĐD. Ngô Thị P - chuyên lấy máu xét nghiệm


/* ---------- 2. LẤY CÁC PHẦN TỬ HTML ---------- */
const labList = document.getElementById("lab-list");
const labError = document.getElementById("lab-error");


/* ---------- 3. TẠO DANH SÁCH ---------- */
function toMoney(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

let labHTML = "";
for (const test of labTests) {
  labHTML += `
    <li>
      <label class="lab-item">
        <input type="checkbox" value="${test.id}">
        <span class="lab-info">
          <strong>${test.name}</strong>
          <small>${test.desc}</small>
        </span>
        <span class="lab-price">${toMoney(test.price)}</span>
      </label>
    </li>`;
}
labList.innerHTML = labHTML;


/* ---------- 4. TÍNH TIỀN ---------- */

// Trả về mảng các xét nghiệm đang được tích
function getSelectedTests() {
  const selected = [];
  for (const test of labTests) {
    const checkbox = labList.querySelector(`input[value="${test.id}"]`);
    if (checkbox.checked) {
      selected.push(test);
    }
  }
  return selected;
}

function updateLabSummary() {
  const selected = getSelectedTests();

  let subtotal = 0;
  for (const test of selected) {
    subtotal += test.price;
  }

  // Chưa chọn gì thì chưa tính phí lấy mẫu
  const total = selected.length > 0 ? subtotal + SAMPLE_FEE : 0;

  document.getElementById("lab-count").textContent = selected.length;
  document.getElementById("lab-subtotal").textContent = toMoney(subtotal);
  document.getElementById("lab-total").textContent = toMoney(total);

  if (selected.length > 0) {
    labError.textContent = "";
  }
}

// Sự kiện "change" của checkbox nổi bọt (bubble) lên thẻ cha -> chỉ cần 1 sự kiện ở <ul>
labList.addEventListener("change", updateLabSummary);


/* ---------- 5. CHỌN NHANH THEO GÓI ---------- */
const presetButtons = document.querySelectorAll("[data-preset]");

for (const button of presetButtons) {
  button.addEventListener("click", function () {
    const ids = labPresets[button.dataset.preset];
    for (const checkbox of labList.querySelectorAll("input")) {
      checkbox.checked = ids.includes(checkbox.value);
    }
    updateLabSummary();
  });
}


/* ---------- 6. ĐẶT LỊCH LẤY MẪU ---------- */
document.getElementById("lab-book").addEventListener("click", function () {
  const selected = getSelectedTests();

  if (selected.length === 0) {
    labError.textContent = "Vui lòng chọn ít nhất 1 xét nghiệm";
    return;
  }

  // Ghép tên các xét nghiệm thành 1 câu ghi chú
  const names = selected.map(function (test) {
    return test.name;
  });
  const note = "Xét nghiệm cần làm: " + names.join(", ");

  // encodeURIComponent: mã hóa dấu tiếng Việt, khoảng trắng để đặt vào link
  window.location.href =
    "dat-lich.html?id=" + LAB_NURSE_ID + "&dv=lay-mau&ghi-chu=" + encodeURIComponent(note);
});

updateLabSummary();
