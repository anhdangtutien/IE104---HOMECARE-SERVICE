/* =========================================================
   DANG-NHAP.JS - XỬ LÝ TRANG ĐĂNG NHẬP
   Người phụ trách: THÀNH VIÊN 3
   Cần nạp js/api.js trước file này.

   Chức năng:
   1. Chọn vai trò Khách hàng / Bác sĩ (đổi màu thẻ được chọn)
   2. Chuyển giữa 2 cách đăng nhập: Số điện thoại + OTP / Mật khẩu
   3. Đăng nhập bằng OTP: gửi mã, đếm ngược gửi lại, kiểm tra mã với máy chủ
   4. Bấm con mắt để hiện / ẩn mật khẩu
   5. Kiểm tra dữ liệu khi bấm "Đăng nhập" (cách mật khẩu)
   6. Đăng nhập xong quay lại đúng trang (?next=...)
   7. Các nút chưa làm (Facebook, Zalo...) -> báo "đang phát triển"
   ========================================================= */


/* ---------- 1. LẤY CÁC PHẦN TỬ HTML ---------- */
const loginForm = document.getElementById("login-form");
const roleCards = document.querySelectorAll(".role-card");
const registerLink = document.getElementById("register-link");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");

const methodTabs = document.querySelectorAll(".method-tab");
const otpForm = document.getElementById("otp-form");
const otpPhoneInput = document.getElementById("otp-phone");
const otpCodeInput = document.getElementById("otp-code");
const otpCodeGroup = document.getElementById("otp-code-group");
const otpSubmit = document.getElementById("otp-submit");
const resendButton = document.getElementById("resend-otp");
const changePhoneButton = document.getElementById("change-phone");
const otpInfo = document.getElementById("otp-info");
const otpDemo = document.getElementById("otp-demo");
const otpDemoCode = document.getElementById("otp-demo-code");


/* ---------- 2. CHỌN VAI TRÒ ----------
   Mỗi thẻ vai trò chứa 1 nút radio. Khi radio thay đổi:
   - Xóa class "active" ở TẤT CẢ thẻ
   - Thêm class "active" cho thẻ vừa chọn
   - Đổi link "Đăng ký ngay" sang đúng trang đăng ký */
for (const card of roleCards) {
  const radio = card.querySelector("input");

  radio.addEventListener("change", function () {
    // Bước 1: bỏ chọn tất cả
    for (const otherCard of roleCards) {
      otherCard.classList.remove("active");
    }

    // Bước 2: tô màu thẻ đang chọn
    card.classList.add("active");

    // Bước 3: đổi link đăng ký
    if (radio.value === "bac-si") {
      registerLink.href = "dang-ky-bac-si.html";
    } else {
      registerLink.href = "dang-ky-khach-hang.html";
    }
  });
}

// Vai trò đang chọn: tìm radio name="role" đang được tích (:checked)
function getSelectedRole() {
  return document.querySelector('input[name="role"]:checked').value;
}


/* ---------- 3. HIỆN / ẨN MẬT KHẨU ----------
   Ô mật khẩu có type="password" (hiện dấu •••).
   Đổi sang type="text" thì sẽ thấy chữ thật. */
togglePasswordButton.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "fa-regular fa-eye";        // icon mắt mở
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "fa-regular fa-eye-slash";  // icon mắt gạch
  }
});


/* ---------- 4. HÀM HIỆN / XÓA LỖI ----------
   boxId:   id của khung .input-box (để tô viền đỏ)
   errorId: id của dòng chữ báo lỗi */
function showError(boxId, errorId, message) {
  document.getElementById(boxId).classList.add("invalid");
  document.getElementById(errorId).textContent = message;
}

function clearError(boxId, errorId) {
  document.getElementById(boxId).classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}


/* ---------- 5. ĐĂNG NHẬP XONG THÌ ĐI ĐÂU ----------
   Đến từ trang khác (VD: dang-nhap.html?next=dat-lich.html%3Fid%3D3) -> quay lại trang đó.
   Chỉ cho phép vài trang trong website để tránh bị chuyển sang trang lạ. */
function goToNextPage() {
  const nextPage = new URLSearchParams(window.location.search).get("next");
  const isSafe = nextPage !== null && /^(ho-so|dat-lich|thanh-toan)\.html([?#][\w\-=&%.#]*)?$/.test(nextPage);
  window.location.href = isSafe ? nextPage : "index.html";
}

// Lưu tài khoản vào localStorage để header hiện tên, trang hồ sơ biết vai trò
function saveUser(user) {
  try {
    localStorage.setItem("homecare_user", JSON.stringify(user));
  } catch (error) {
    // Trình duyệt chặn lưu trữ (ẩn danh) -> bỏ qua
  }
}


/* ---------- 6. ĐĂNG NHẬP BẰNG MẬT KHẨU (KIỂM TRA KHI BẤM "ĐĂNG NHẬP") ---------- */
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();   // chặn form tải lại trang

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  let isValid = true;       // giả sử ban đầu là hợp lệ

  // Kiểm tra tên đăng nhập
  if (username === "") {
    showError("username-box", "username-error", "Vui lòng nhập số điện thoại hoặc tên đăng nhập");
    isValid = false;
  } else {
    clearError("username-box", "username-error");
  }

  // Kiểm tra mật khẩu
  if (password === "") {
    showError("password-box", "password-error", "Vui lòng nhập mật khẩu");
    isValid = false;
  } else if (password.length < 6) {
    showError("password-box", "password-error", "Mật khẩu phải có ít nhất 6 ký tự");
    isValid = false;
  } else {
    clearError("password-box", "password-error");
  }

  // Có lỗi thì dừng lại
  if (isValid === false) {
    return;
  }

  const selectedRole = getSelectedRole();
  let roleName = selectedRole === "bac-si" ? "Bác sĩ" : "Khách hàng";

  // 1. Thử xác thực trực tiếp qua Backend Supabase
  let serverLoggedIn = false;
  let serverUser = null;
  try {
    if (typeof callApi === "function") {
      const res = await callApi("/api/auth?action=login-password", {
        method: "POST",
        body: { username: username, password: password, role: selectedRole }
      });
      serverLoggedIn = true;
      serverUser = res.user;
    }
  } catch (apiError) {
    if (apiError.status === 400) {
      if (apiError.message.includes("mật khẩu") || apiError.message.includes("Mật khẩu")) {
        showError("password-box", "password-error", apiError.message);
      } else {
        showError("username-box", "username-error", apiError.message);
      }
      return;
    }
  }

  if (serverLoggedIn && serverUser) {
    saveUser({
      username: serverUser.phone,
      phone: serverUser.phone,
      name: serverUser.name || username,
      role: selectedRole,
      verified: true
    });

    // Đồng bộ vào hồ sơ cá nhân nếu là khách hàng
    if (selectedRole === "khach-hang") {
      let accounts = [];
      try { accounts = JSON.parse(localStorage.getItem("homecare_accounts")) || []; } catch (e) {}
      const acc = accounts.find(function (a) { return a.phone === serverUser.phone; });
      let currentProf = {};
      try { currentProf = JSON.parse(localStorage.getItem("homecare_profile")) || {}; } catch (e) {}
      localStorage.setItem("homecare_profile", JSON.stringify({
        name: serverUser.name || (acc ? acc.fullname : "") || currentProf.name || "Khách hàng HomeCare",
        phone: serverUser.phone,
        email: (acc ? acc.email : "") || currentProf.email || "",
        birthday: (acc ? acc.birthday : "") || currentProf.birthday || "",
        gender: (acc ? acc.gender : "") || currentProf.gender || "",
        ward: currentProf.ward || "",
        street: (acc ? acc.street : "") || currentProf.street || ""
      }));
    }

    alert("Đăng nhập thành công! Chào mừng " + (serverUser.name || serverUser.phone) + " (" + roleName + ").");
    goToNextPage();
    return;
  }

  // 2. Dự phòng kiểm tra qua localStorage (nếu offline hoặc chạy tĩnh)
  let accounts = [];
  try {
    accounts = JSON.parse(localStorage.getItem("homecare_accounts")) || [];
  } catch (e) {
    accounts = [];
  }

  const defaultAccounts = [
    { phone: "0912345678", email: "khachhang@gmail.com", fullname: "Nguyễn Văn A", password: "password123", role: "khach-hang" },
    { phone: "0901234567", email: "bacsi@gmail.com", fullname: "ThS.BS Trần Ngọc C", password: "password123", role: "bac-si" }
  ];

  const matched = accounts.find(function (acc) {
    return acc.phone === username || (acc.email && acc.email.toLowerCase() === username.toLowerCase());
  }) || defaultAccounts.find(function (acc) {
    return acc.phone === username || (acc.email && acc.email.toLowerCase() === username.toLowerCase());
  });

  if (!matched) {
    showError("username-box", "username-error", "Tài khoản (SĐT/Email) chưa được đăng ký trong hệ thống");
    return;
  }

  // Kiểm tra vai trò: tài khoản khách hàng không được đăng nhập phía bác sĩ và ngược lại
  if (matched.role && matched.role !== selectedRole) {
    const roleExpected = matched.role === "bac-si" ? "Bác sĩ" : "Khách hàng";
    showError("username-box", "username-error", "Tài khoản này được đăng ký với vai trò " + roleExpected + ". Vui lòng chọn vai trò " + roleExpected + " ở trên để đăng nhập.");
    return;
  }

  if (matched.password !== password) {
    showError("password-box", "password-error", "Mật khẩu không chính xác");
    return;
  }

  saveUser({
    username: matched.phone || username,
    phone: matched.phone || username,
    email: matched.email || undefined,
    name: matched.fullname,
    role: selectedRole,
    verified: true
  });

  // Đồng bộ vào hồ sơ cá nhân nếu là khách hàng
  if (selectedRole === "khach-hang") {
    let currentProf = {};
    try { currentProf = JSON.parse(localStorage.getItem("homecare_profile")) || {}; } catch (e) {}
    localStorage.setItem("homecare_profile", JSON.stringify({
      name: matched.fullname || currentProf.name || "Khách hàng HomeCare",
      phone: matched.phone || username,
      email: matched.email || currentProf.email || "",
      birthday: matched.birthday || currentProf.birthday || "",
      gender: matched.gender || currentProf.gender || "",
      ward: currentProf.ward || "",
      street: matched.street || currentProf.street || ""
    }));
  }

  alert("Đăng nhập thành công! Chào mừng " + (matched.fullname || username) + " (" + roleName + ").");
  goToNextPage();
});


/* ---------- 7. ĐANG GÕ -> XÓA LỖI CỦA Ô ĐÓ ---------- */
usernameInput.addEventListener("input", function () {
  clearError("username-box", "username-error");
});

passwordInput.addEventListener("input", function () {
  clearError("password-box", "password-error");
});


/* =========================================================
   AI prompt: "Có thể đăng nhập bằng số điện thoại kèm mã OTP" –
   các mục 8 -> 11 bên dưới được viết với sự hỗ trợ của AI.
   ========================================================= */

/* ---------- 8. CHUYỂN TAB OTP / MẬT KHẨU ---------- */
function showMethod(method) {
  for (const tab of methodTabs) {
    const isActive = tab.dataset.method === method;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  }
  otpForm.hidden = method !== "otp";
  loginForm.hidden = method !== "password";
}

for (const tab of methodTabs) {
  tab.addEventListener("click", function () {
    showMethod(tab.dataset.method);
  });
}


/* ---------- 9. GỬI MÃ OTP ---------- */
let otpSent = false;        // đã gửi mã chưa (để biết nút chính đang là "Gửi mã" hay "Đăng nhập")
let sentPhone = "";         // số điện thoại đã nhận mã
let countdownTimer = null;

// Chỉ giữ lại chữ số khi gõ (gõ chữ hoặc dấu cách sẽ bị bỏ)
function keepDigits(input) {
  input.addEventListener("input", function () {
    input.value = input.value.replace(/\D/g, "");
  });
}
keepDigits(otpPhoneInput);
keepDigits(otpCodeInput);

// Đếm ngược "Gửi lại (60s)"
function startCountdown(seconds) {
  clearInterval(countdownTimer);
  let left = seconds;
  resendButton.disabled = true;
  resendButton.textContent = "Gửi lại (" + left + "s)";

  countdownTimer = setInterval(function () {
    left--;
    if (left <= 0) {
      clearInterval(countdownTimer);
      resendButton.disabled = false;
      resendButton.textContent = "Gửi lại";
    } else {
      resendButton.textContent = "Gửi lại (" + left + "s)";
    }
  }, 1000);
}

function setLoading(isLoading, text) {
  otpSubmit.disabled = isLoading;
  otpSubmit.innerHTML = isLoading ? `<i class="fa-solid fa-spinner fa-spin"></i> ${text}` : text;
}

async function sendOtp() {
  const phone = otpPhoneInput.value.trim();

  // Đúng 10 hoặc 11 chữ số
  if (/^\d{10,11}$/.test(phone) === false) {
    showError("otp-phone-box", "otp-phone-error", "Số điện thoại phải gồm đúng 10 hoặc 11 chữ số");
    otpPhoneInput.focus();
    return;
  }
  clearError("otp-phone-box", "otp-phone-error");

  setLoading(true, "Đang gửi mã...");
  try {
    const result = await callApi("/api/auth?action=send-otp", { method: "POST", body: { phone: phone } });

    otpSent = true;
    sentPhone = phone;
    otpPhoneInput.readOnly = true;
    changePhoneButton.hidden = false;
    otpCodeGroup.hidden = false;
    otpCodeInput.value = "";
    otpCodeInput.focus();
    otpInfo.textContent = "Mã đã được gửi tới " + phone + ", có hiệu lực trong " + Math.round(result.expiresIn / 60) + " phút.";
    startCountdown(result.resendIn);

    // Chế độ demo: máy chủ trả mã về để hiện lên màn hình
    if (result.demoCode) {
      otpDemoCode.textContent = result.demoCode;
      otpDemo.hidden = false;
    }

    setLoading(false, "Xác nhận đăng nhập");
  } catch (error) {
    setLoading(false, otpSent ? "Xác nhận đăng nhập" : "Gửi mã OTP");
    showError("otp-phone-box", "otp-phone-error", error.message);
  }
}


/* ---------- 10. KIỂM TRA MÃ OTP VÀ ĐĂNG NHẬP ---------- */
async function verifyOtp() {
  const code = otpCodeInput.value.trim();
  if (/^\d{6}$/.test(code) === false) {
    showError("otp-code-box", "otp-code-error", "Mã OTP gồm 6 chữ số");
    otpCodeInput.focus();
    return;
  }
  clearError("otp-code-box", "otp-code-error");

  setLoading(true, "Đang kiểm tra...");
  try {
    const result = await callApi("/api/auth?action=verify-otp", {
      method: "POST",
      body: { phone: sentPhone, code: code, role: getSelectedRole() }
    });

    // Giữ lại tên đã đặt trước đó (nếu cùng số điện thoại)
    let oldName = null;
    try {
      const oldUser = JSON.parse(localStorage.getItem("homecare_user"));
      if (oldUser !== null && oldUser.phone === result.user.phone) {
        oldName = oldUser.name || null;
      }
    } catch (error) {
      oldName = null;
    }

    saveUser({
      username: result.user.phone,
      phone: result.user.phone,
      role: result.user.role,
      name: oldName || result.user.name || undefined,
      verified: true            // đã xác thực số điện thoại -> được đặt lịch
    });

    goToNextPage();
  } catch (error) {
    setLoading(false, "Xác nhận đăng nhập");
    showError("otp-code-box", "otp-code-error", error.message);
  }
}

// Nút chính: chưa gửi mã -> gửi mã; đã gửi -> kiểm tra mã
otpForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (otpSent) {
    verifyOtp();
  } else {
    sendOtp();
  }
});

resendButton.addEventListener("click", function () {
  otpSent = false;
  sendOtp();
});

// Đổi số khác: quay về bước nhập số điện thoại
changePhoneButton.addEventListener("click", function () {
  clearInterval(countdownTimer);
  otpSent = false;
  otpPhoneInput.readOnly = false;
  otpPhoneInput.focus();
  changePhoneButton.hidden = true;
  otpCodeGroup.hidden = true;
  otpDemo.hidden = true;
  clearError("otp-code-box", "otp-code-error");
  setLoading(false, "Gửi mã OTP");
});

otpPhoneInput.addEventListener("input", function () {
  clearError("otp-phone-box", "otp-phone-error");
});

otpCodeInput.addEventListener("input", function () {
  clearError("otp-code-box", "otp-code-error");
});


/* ---------- 11. LÝ DO PHẢI ĐĂNG NHẬP (?ly-do=...) ---------- */
const loginReasons = {
  "dat-lich": "Vui lòng đăng nhập bằng số điện thoại để đặt lịch khám.",
  "otp": "Đặt lịch khám cần xác thực số điện thoại bằng mã OTP.",
  "het-phien": "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
};
const reason = new URLSearchParams(window.location.search).get("ly-do");
if (loginReasons[reason] !== undefined) {
  const notice = document.getElementById("login-notice");
  notice.textContent = loginReasons[reason];
  notice.hidden = false;
}

// Điền sẵn số điện thoại và chuyển tab mật khẩu nếu vừa đăng ký xong
const queryParams = new URLSearchParams(window.location.search);
const redirectPhone = queryParams.get("phone");
const redirectMethod = queryParams.get("method");

if (redirectPhone) {
  otpPhoneInput.value = redirectPhone;
  usernameInput.value = redirectPhone;
}
if (redirectMethod === "password") {
  showMethod("password");
}


/* ---------- 12. CÁC CHỨC NĂNG CHƯA LÀM ----------
   Các nút/link có class "coming-soon" chỉ hiện thông báo */
const comingSoonItems = document.querySelectorAll(".coming-soon");

for (const item of comingSoonItems) {
  item.addEventListener("click", function (event) {
    event.preventDefault();   // link "#" không nhảy lên đầu trang
    alert("Chức năng này đang được phát triển!");
  });
}
