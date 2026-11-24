/* =========================================================
   GOI-CHAM-SOC.JS - TRANG GÓI CHĂM SÓC ĐỊNH KỲ
   Người phụ trách: THÀNH VIÊN 2

   Chức năng:
   1. Tạo các thẻ gói từ mảng dữ liệu
   2. Chuyển "Trả theo tháng / Trả theo năm" -> tính lại giá (năm giảm 15%)
   3. Nút "Đăng ký tư vấn" -> sang trang liên hệ, điền sẵn tên gói
   ========================================================= */


/* ---------- 1. DỮ LIỆU CÁC GÓI ---------- */
const carePackages = [
  {
    id: "co-ban", name: "Cơ bản", icon: "fa-solid fa-heart-pulse", monthly: 590000,
    forWho: "Người khỏe mạnh muốn theo dõi sức khỏe định kỳ",
    features: ["1 lượt khám tại nhà mỗi tháng", "Đo huyết áp, đường huyết, SpO2", "2 lần tư vấn video", "Báo cáo sức khỏe hằng tháng"]
  },
  {
    id: "nguoi-cao-tuoi", name: "Người cao tuổi", icon: "fa-solid fa-person-cane", monthly: 1290000, popular: true,
    forWho: "Ông bà, bố mẹ trên 60 tuổi hoặc có bệnh mạn tính",
    features: ["2 lượt khám tại nhà mỗi tháng", "2 buổi điều dưỡng chăm sóc", "Xét nghiệm máu cơ bản mỗi quý", "Nhắc lịch uống thuốc", "Hotline ưu tiên 24/7"]
  },
  {
    id: "me-va-be", name: "Mẹ & bé", icon: "fa-solid fa-baby", monthly: 990000,
    forWho: "Mẹ bầu 3 tháng cuối và bé dưới 12 tháng tuổi",
    features: ["2 lượt khám thai / khám sau sinh", "Điều dưỡng chăm sóc bé sơ sinh", "Tư vấn dinh dưỡng cho mẹ và bé", "Nhắc lịch tiêm chủng"]
  },
  {
    id: "gia-dinh", name: "Gia đình", icon: "fa-solid fa-people-roof", monthly: 1990000,
    forWho: "Gia đình tối đa 4 thành viên",
    features: ["4 lượt khám tại nhà mỗi tháng", "Tư vấn video không giới hạn", "Giảm 20% mọi xét nghiệm", "Bác sĩ gia đình riêng", "Hotline ưu tiên 24/7"]
  }
];

const YEARLY_DISCOUNT = 0.15;   // trả theo năm giảm 15%
let billing = "thang";          // "thang" hoặc "nam"


/* ---------- 2. TẠO CÁC THẺ GÓI ---------- */
const packageGrid = document.getElementById("package-grid");

function toMoney(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function renderPackages() {
  let html = "";

  for (const item of carePackages) {
    // Trả theo năm: giá mỗi tháng giảm 15%, làm tròn tới hàng nghìn
    let pricePerMonth = item.monthly;
    let billedText = "Thanh toán hằng tháng";
    if (billing === "nam") {
      pricePerMonth = Math.round(item.monthly * (1 - YEARLY_DISCOUNT) / 1000) * 1000;
      billedText = "Thanh toán " + toMoney(pricePerMonth * 12) + " / năm";
    }

    let featuresHTML = "";
    for (const feature of item.features) {
      featuresHTML += `<li><i class="fa-solid fa-check"></i> ${feature}</li>`;
    }

    // Gói phổ biến: thêm class + nhãn, nút màu xanh đặc
    let popularClass = "";
    let popularTag = "";
    let buttonClass = "btn-outline";
    if (item.popular === true) {
      popularClass = " popular";
      popularTag = `<span class="popular-tag">PHỔ BIẾN NHẤT</span>`;
      buttonClass = "btn-primary";
    }

    // Link sang trang liên hệ, mang theo chủ đề + tên gói + kỳ thanh toán
    const contactLink = "contact.html?chu-de=goi-cham-soc&goi=" + encodeURIComponent(item.name) + "&ky=" + billing;

    html += `
      <article class="package-card${popularClass}">
        ${popularTag}
        <span class="package-icon"><i class="${item.icon}"></i></span>
        <h3>${item.name}</h3>
        <p class="package-for">${item.forWho}</p>
        <p class="package-price">${toMoney(pricePerMonth)}<small> / tháng</small></p>
        <p class="package-billed">${billedText}</p>
        <ul class="package-features">${featuresHTML}</ul>
        <a href="${contactLink}" class="btn ${buttonClass} btn-block">Đăng ký tư vấn</a>
      </article>`;
  }

  packageGrid.innerHTML = html;
}

