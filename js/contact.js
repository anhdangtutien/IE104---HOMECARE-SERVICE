/* =========================================================
   CONTACT.JS - TRANG LIÊN HỆ & HỢP TÁC
   Người phụ trách: THÀNH VIÊN 2

   Chức năng:
   1. Đổi chủ đề -> hiện / ẩn ô "Gói quan tâm" và "Tên bệnh viện"
   2. Đếm số ký tự nội dung (tối đa 500)
   3. Kiểm tra form, báo gửi thành công
   4. Điền sẵn chủ đề + gói từ link (?chu-de=goi-cham-soc&goi=Gia đình)
   5. Nút "Gửi đề nghị hợp tác" -> chọn sẵn chủ đề hợp tác và cuộn lên form
   ========================================================= */


/* ---------- 1. LẤY CÁC PHẦN TỬ HTML ---------- */
const contactForm = document.getElementById("contact-form");
const contactName = document.getElementById("contact-name");
const contactPhone = document.getElementById("contact-phone");
const contactEmail = document.getElementById("contact-email");
const contactTopic = document.getElementById("contact-topic");
const contactPackage = document.getElementById("contact-package");
const contactOrganization = document.getElementById("contact-organization");
const contactMessage = document.getElementById("contact-message");
const messageCounter = document.getElementById("message-counter");
const contactSuccess = document.getElementById("contact-success");

const MAX_MESSAGE_LENGTH = 500;


/* ---------- 2. HIỆN / ẨN Ô THEO CHỦ ĐỀ ---------- */
function updateTopicFields() {
  const topic = contactTopic.value;
  document.getElementById("package-field").hidden = topic !== "goi-cham-soc";
  document.getElementById("organization-field").hidden = topic !== "hop-tac";
}

contactTopic.addEventListener("change", updateTopicFields);


/* ---------- 3. ĐẾM KÝ TỰ ---------- */
function updateCounter() {
  // Gõ quá 500 ký tự thì cắt bớt phần thừa
  if (contactMessage.value.length > MAX_MESSAGE_LENGTH) {
    contactMessage.value = contactMessage.value.slice(0, MAX_MESSAGE_LENGTH);
  }

  const length = contactMessage.value.length;
  messageCounter.textContent = length + "/" + MAX_MESSAGE_LENGTH;
  messageCounter.classList.toggle("limit", length === MAX_MESSAGE_LENGTH);
}

contactMessage.addEventListener("input", updateCounter);


/* ---------- 4. HIỆN / XÓA LỖI ---------- */
function showError(input, message) {
  input.classList.add("invalid");
  document.getElementById(input.id + "-error").textContent = message;
}

function clearError(input) {
  input.classList.remove("invalid");
  document.getElementById(input.id + "-error").textContent = "";
}

// Gõ lại vào ô nào thì xóa lỗi của ô đó
const inputsWithError = [contactName, contactPhone, contactEmail, contactOrganization, contactMessage];
for (const input of inputsWithError) {
  input.addEventListener("input", function () {
    clearError(input);
  });
}


/* ---------- 5. GỬI FORM ---------- */
contactForm.addEventListener("submit", function (event) {
  event.preventDefault();
  contactSuccess.classList.remove("show");

  let isValid = true;

  if (contactName.value.trim().length < 2) {
    showError(contactName, "Vui lòng nhập họ tên");
    isValid = false;
  }

  if (/^0\d{9}$/.test(contactPhone.value.trim()) === false) {
    showError(contactPhone, "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0");
    isValid = false;
  }

  const email = contactEmail.value.trim();
  if (email !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false) {
    showError(contactEmail, "Email không đúng định dạng");
    isValid = false;
  }

  if (contactTopic.value === "hop-tac" && contactOrganization.value.trim() === "") {
    showError(contactOrganization, "Vui lòng nhập tên bệnh viện / phòng khám");
    isValid = false;
  }

  if (contactMessage.value.trim().length < 10) {
    showError(contactMessage, "Nội dung cần ít nhất 10 ký tự");
    isValid = false;
  }

  if (isValid === false) {
    return;
  }

  // Câu cảm ơn khác nhau tùy chủ đề
  let successText = "Đã gửi! HomeCare sẽ liên hệ lại với bạn trong 30 phút.";
  if (contactTopic.value === "goi-cham-soc") {
    successText = "Đã ghi nhận đăng ký gói " + contactPackage.value + ". Chuyên viên sẽ gọi tư vấn cho bạn sớm.";
  } else if (contactTopic.value === "hop-tac") {
    successText = "Cảm ơn bạn! Bộ phận đối tác sẽ liên hệ trong 1 – 2 ngày làm việc.";
  }

  document.getElementById("contact-success-text").textContent = successText;
  contactSuccess.classList.add("show");

  contactForm.reset();         // xóa trắng các ô
  updateTopicFields();
  updateCounter();
});


/* ---------- 6. NÚT "GỬI ĐỀ NGHỊ HỢP TÁC" ---------- */
const topicButtons = document.querySelectorAll("[data-topic]");

for (const button of topicButtons) {
  button.addEventListener("click", function () {
    contactTopic.value = button.dataset.topic;
    updateTopicFields();
    document.getElementById("form-lien-he").scrollIntoView({ behavior: "smooth" });
    contactOrganization.focus({ preventScroll: true });   // đặt sẵn con trỏ vào ô tên tổ chức
  });
}


/* ---------- 7. ĐIỀN SẴN TỪ LINK ---------- */
const contactParams = new URLSearchParams(window.location.search);
const topicFromLink = contactParams.get("chu-de");
const packageFromLink = contactParams.get("goi");

// Chỉ nhận chủ đề có trong danh sách lựa chọn
for (const option of contactTopic.options) {
  if (option.value === topicFromLink) {
    contactTopic.value = topicFromLink;
  }
}

if (packageFromLink !== null) {
  for (const option of contactPackage.options) {
    if (option.value === packageFromLink) {
      contactPackage.value = packageFromLink;
    }
  }

  let billingText = "theo tháng";
  if (contactParams.get("ky") === "nam") {
    billingText = "theo năm";
  }
  contactMessage.value = "Tôi muốn được tư vấn gói " + packageFromLink + " (thanh toán " + billingText + ").";
}

updateTopicFields();
updateCounter();

// Đến từ trang gói chăm sóc -> cuộn thẳng tới form
if (topicFromLink !== null) {
  document.getElementById("form-lien-he").scrollIntoView();
}
