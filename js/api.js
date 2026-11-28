/* =========================================================
   API.JS - GỌI MÁY CHỦ (THƯ MỤC api/) TỪ TRÌNH DUYỆT

   AI prompt: "Kết nối các trang với backend: đăng nhập OTP, lưu lịch khám
   vào database, thanh toán VNPay sandbox" – file này được viết với sự
   hỗ trợ của AI.

   Dùng ở: dang-nhap.html, dat-lich.html, thanh-toan.html, ho-so.html
   (nạp TRƯỚC file JS riêng của trang)

   Lưu ý: phải chạy web bằng "npm run dev" hoặc bản deploy Vercel.
   Mở bằng Live Server thì không có máy chủ API -> các hàm báo lỗi rõ ràng.
   ========================================================= */


/* ---------- 1. GỌI API ----------
   callApi("/api/bookings")                               -> GET
   callApi("/api/bookings", { method: "POST", body: {...} }) -> POST kèm dữ liệu JSON
   Trả về dữ liệu máy chủ gửi về. Lỗi thì "ném" (throw) Error có:
     error.message : câu báo lỗi tiếng Việt để hiện cho người dùng
     error.status  : mã HTTP (401 = chưa đăng nhập, 409 = trùng lịch...)       */
async function callApi(path, options) {
  const settings = options || {};
  const request = {
    method: settings.method || "GET",
    headers: {},
    credentials: "same-origin"        // gửi kèm cookie đăng nhập
  };

  if (settings.body !== undefined) {
    request.headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(settings.body);
  }

  let response;
  try {
    response = await fetch(path, request);
  } catch (networkError) {
    const error = new Error("Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    error.status = 0;
    throw error;
  }

  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (response.ok === false || isJson === false) {
    let message = "Máy chủ gặp lỗi (" + response.status + "), vui lòng thử lại.";
    if (data !== null && data.error) {
      message = data.error;
    } else if (isJson === false) {
      message = "Không tìm thấy máy chủ API. Hãy chạy web bằng lệnh \"npm run dev\" hoặc mở bản deploy trên Vercel (xem README).";
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}


/* ---------- 2. ĐĂNG NHẬP ---------- */

// Tài khoản đã xác thực số điện thoại bằng OTP chưa (mới được đặt lịch)
function isVerifiedUser(user) {
  return user !== null && user !== undefined && user.verified === true && typeof user.phone === "string";
}

// Link sang trang đăng nhập, đăng nhập xong quay lại đúng trang đang đứng
function getLoginLink(reason) {
  const currentPage = window.location.pathname.split("/").pop() + window.location.search;
  return "dang-nhap.html?next=" + encodeURIComponent(currentPage) + "&ly-do=" + reason;
}


/* ---------- 3. ĐỔI LỊCH HẸN TỪ MÁY CHỦ SANG DẠNG TRANG HỒ SƠ ĐANG DÙNG ----------
   Máy chủ trả về object nhiều trường (symptoms, contactPhone...),
   trang ho-so.html dùng dạng gọn giống dữ liệu mẫu trong du-lieu.js        */
function bookingToAppointment(booking) {
  let patientName = booking.patientName;
  if (booking.relation && booking.relation !== "Bản thân") {
    patientName += " (" + booking.relation.toLowerCase() + ")";
  }

  // Ghép triệu chứng + ghi chú để bác sĩ đọc
  const symptoms = booking.symptoms.filter(function (item) { return item !== "Khác"; });
  if (booking.symptomOther) {
    symptoms.push(booking.symptomOther);
  }
  const noteParts = [];
  if (symptoms.length > 0) {
    noteParts.push("Triệu chứng: " + symptoms.join(", "));
  }
  if (booking.note) {
    noteParts.push(booking.note);
  }

  let payment = booking.paymentName;
  if (booking.paymentMethod === "vnpay") {
    payment += " – " + booking.paymentStatusName;
  }

  return {
    code: booking.code,
    doctorId: booking.doctorId,
    serviceId: booking.serviceId,
    date: booking.date,
    time: booking.time,
    patientName: patientName,
    phone: booking.contactPhone || booking.accountPhone,
    address: booking.address,
    note: noteParts.join(". "),
    total: booking.total,
    payment: payment,
    status: booking.status,
    source: "server"                  // đánh dấu: lịch này lưu trên database
  };
}
