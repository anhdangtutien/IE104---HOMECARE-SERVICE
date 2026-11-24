/* =========================================================
   TIN-TUC.JS - TRANG TIN TỨC & CẨM NANG SỨC KHỎE
   Người phụ trách: THÀNH VIÊN 2

   Chức năng:
   1. Lưu bài viết trong mảng, dùng JS tạo thẻ bài viết
   2. Lọc theo chuyên mục (tab) + tìm kiếm không dấu
   3. Bấm vào bài -> mở hộp đọc bài <dialog>
   4. Đọc chuyên mục từ link (?loai=tin-y-te)
   5. Kiểm tra email đăng ký nhận bản tin
   ========================================================= */


/* ---------- 1. DỮ LIỆU BÀI VIẾT ----------
   tone: màu ảnh minh họa ("" = xanh, "orange" = cam, "dark" = xanh đậm) */
const articles = [
  {
    id: 1, category: "cam-nang", tone: "", icon: "fa-solid fa-heart-pulse",
    title: "5 dấu hiệu tăng huyết áp ở người cao tuổi thường bị bỏ qua",
    summary: "Đau đầu vùng gáy buổi sáng, chóng mặt khi đứng dậy, mờ mắt... là những dấu hiệu nên đo huyết áp ngay.",
    date: "22/11/2026", readTime: 5,
    content: [
      "Tăng huyết áp thường được gọi là \"kẻ giết người thầm lặng\" vì nhiều người không có triệu chứng rõ ràng cho đến khi xảy ra biến chứng như đột quỵ hay suy tim.",
      "Ở người cao tuổi, cần chú ý các dấu hiệu: đau đầu vùng gáy vào buổi sáng, chóng mặt khi thay đổi tư thế, mờ mắt thoáng qua, hồi hộp, mất ngủ và chảy máu cam không rõ nguyên nhân.",
      "Cách tốt nhất là đo huyết áp tại nhà mỗi ngày vào cùng một khung giờ, ghi lại kết quả để bác sĩ theo dõi. Nếu huyết áp thường xuyên từ 140/90 mmHg trở lên, hãy đặt lịch khám sớm."
    ]
  },
  {
    id: 2, category: "tin-y-te", tone: "dark", icon: "fa-solid fa-vial",
    title: "HomeCare ra mắt dịch vụ xét nghiệm tại nhà, trả kết quả trong 24 giờ",
    summary: "Điều dưỡng đến tận nhà lấy mẫu, kết quả gửi qua ứng dụng và được bác sĩ giải thích miễn phí.",
    date: "20/11/2026", readTime: 3,
    content: [
      "Từ tháng 11/2026, khách hàng tại TP. Thủ Đức có thể đặt lịch lấy mẫu xét nghiệm máu, nước tiểu ngay tại nhà thông qua website HomeCare.",
      "Mẫu được vận chuyển trong thùng bảo quản lạnh về phòng xét nghiệm đạt chuẩn. Kết quả trả online sau 24 giờ, kèm 1 lần tư vấn miễn phí với bác sĩ để giải thích các chỉ số.",
      "Người bệnh có thể chọn sẵn các gói như tầm soát cơ bản hoặc gói theo dõi tiểu đường tại mục Dịch vụ › Xét nghiệm tại nhà."
    ]
  },
  {
    id: 3, category: "cam-nang", tone: "orange", icon: "fa-solid fa-bowl-food",
    title: "Người bệnh tiểu đường nên ăn gì, kiêng gì?",
    summary: "Nguyên tắc chia nhỏ bữa ăn, chọn tinh bột hấp thu chậm và lưu ý với trái cây ngọt.",
    date: "18/11/2026", readTime: 6,
    content: [
      "Chế độ ăn đóng vai trò quan trọng không kém thuốc trong việc kiểm soát đường huyết. Người bệnh nên chia thành 3 bữa chính và 1 - 2 bữa phụ nhỏ để đường huyết không tăng quá nhanh.",
      "Ưu tiên tinh bột hấp thu chậm như gạo lứt, yến mạch, khoai lang; tăng rau xanh và đạm từ cá, đậu. Hạn chế nước ngọt, bánh kẹo, trái cây sấy và các loại quả rất ngọt như sầu riêng, mít.",
      "Mỗi người có nhu cầu dinh dưỡng khác nhau, vì vậy nên được bác sĩ hoặc chuyên gia dinh dưỡng xây dựng thực đơn riêng dựa trên chỉ số HbA1c và cân nặng."
    ]
  },
  {
    id: 4, category: "tin-y-te", tone: "", icon: "fa-solid fa-head-side-cough",
    title: "Phòng bệnh đường hô hấp khi thời tiết chuyển mùa",
    summary: "Cuối năm là thời điểm các bệnh cúm, viêm họng, viêm phế quản dễ lây lan, nhất là ở trẻ nhỏ và người lớn tuổi.",
    date: "15/11/2026", readTime: 4,
    content: [
      "Thời tiết thay đổi thất thường, độ ẩm cao vào sáng sớm và chiều tối tạo điều kiện cho virus đường hô hấp phát triển.",
      "Các biện pháp đơn giản giúp phòng bệnh: giữ ấm cổ và ngực, rửa tay thường xuyên, đeo khẩu trang nơi đông người, uống đủ nước và tiêm vắc xin cúm mỗi năm.",
      "Cần đi khám ngay khi có sốt cao trên 39°C kéo dài quá 2 ngày, khó thở, thở nhanh, hoặc trẻ bỏ bú, li bì."
    ]
  },
  {
    id: 5, category: "cam-nang", tone: "orange", icon: "fa-solid fa-temperature-half",
    title: "Chăm sóc trẻ bị sốt tại nhà: những điều cha mẹ cần biết",
    summary: "Khi nào cần dùng thuốc hạ sốt, cách lau mát đúng và các dấu hiệu phải đưa trẻ đi khám ngay.",
    date: "12/11/2026", readTime: 5,
    content: [
      "Sốt là phản ứng tự nhiên của cơ thể khi chống lại nhiễm trùng. Cha mẹ nên dùng nhiệt kế để đo chính xác thay vì sờ trán.",
      "Khi trẻ sốt từ 38,5°C trở lên có thể dùng thuốc hạ sốt theo đúng liều cân nặng, kết hợp lau mát bằng nước ấm, cho trẻ mặc đồ thoáng và uống nhiều nước.",
      "Đưa trẻ đi khám ngay nếu trẻ dưới 3 tháng tuổi bị sốt, sốt kèm co giật, nổi ban, nôn nhiều, hoặc sốt kéo dài quá 48 giờ."
    ]
  },
  {
    id: 6, category: "tin-y-te", tone: "dark", icon: "fa-solid fa-house-medical",
    title: "Chăm sóc sức khỏe tại nhà ngày càng được nhiều gia đình lựa chọn",
    summary: "Không phải xếp hàng, hạn chế lây nhiễm chéo và phù hợp với người cao tuổi đi lại khó khăn.",
    date: "10/11/2026", readTime: 4,
    content: [
      "Mô hình bác sĩ đến khám tại nhà đang phát triển nhanh tại các thành phố lớn, đặc biệt với các gia đình có người cao tuổi hoặc trẻ nhỏ.",
      "Ưu điểm lớn nhất là tiết kiệm thời gian chờ đợi và giảm nguy cơ lây nhiễm chéo ở bệnh viện. Bác sĩ cũng quan sát được môi trường sống để tư vấn phù hợp hơn.",
      "Tuy vậy, các trường hợp cấp cứu như đau ngực dữ dội, khó thở nặng hay chấn thương cần gọi 115 hoặc đến bệnh viện ngay."
    ]
  },
  {
    id: 7, category: "cam-nang", tone: "", icon: "fa-solid fa-person-walking",
    title: "Bài tập phục hồi chức năng sau tai biến có thể tập tại nhà",
    summary: "Những động tác nhẹ nhàng giúp cải thiện vận động tay chân, nên tập đều đặn mỗi ngày.",
    date: "06/11/2026", readTime: 7,
    content: [
      "Giai đoạn vàng để phục hồi sau tai biến là 3 - 6 tháng đầu. Tập luyện đều đặn giúp người bệnh lấy lại khả năng vận động và tự chăm sóc bản thân.",
      "Một số bài tập cơ bản: co duỗi các ngón tay, nâng tay lên cao với sự hỗ trợ của tay lành, tập ngồi dậy từ tư thế nằm, đứng lên ngồi xuống có ghế tựa.",
      "Nên có kỹ thuật viên vật lý trị liệu hướng dẫn trong những buổi đầu để tập đúng tư thế, tránh té ngã và chấn thương."
    ]
  },
  {
    id: 8, category: "cam-nang", tone: "orange", icon: "fa-solid fa-bed",
    title: "Ngủ bao nhiêu là đủ? Thời gian ngủ khuyến nghị theo độ tuổi",
    summary: "Trẻ em, người trưởng thành và người cao tuổi cần thời gian ngủ khác nhau để cơ thể phục hồi.",
    date: "02/11/2026", readTime: 4,
    content: [
      "Giấc ngủ giúp cơ thể phục hồi, tăng cường trí nhớ và hệ miễn dịch. Thiếu ngủ kéo dài làm tăng nguy cơ béo phì, tăng huyết áp và trầm cảm.",
      "Thời gian ngủ thường được khuyến nghị: trẻ tuổi đi học 9 - 12 tiếng, thanh thiếu niên 8 - 10 tiếng, người trưởng thành 7 - 9 tiếng, người trên 65 tuổi 7 - 8 tiếng mỗi đêm.",
      "Để ngủ ngon hơn: đi ngủ đúng giờ, hạn chế cà phê sau 14 giờ, tắt điện thoại trước khi ngủ 30 phút và giữ phòng ngủ tối, yên tĩnh."
    ]
  }
];

const CATEGORY_NAMES = {
  "tin-y-te": "TIN Y TẾ",
  "cam-nang": "CẨM NANG SỨC KHỎE"
};


/* ---------- 2. BIẾN TRẠNG THÁI + PHẦN TỬ HTML ---------- */
let currentCategory = "tat-ca";
let searchKeyword = "";

const newsGrid = document.getElementById("news-grid");
const newsCount = document.getElementById("news-count");
const newsSearch = document.getElementById("news-search");
const newsTabs = document.querySelectorAll(".news-tab");
const articleDialog = document.getElementById("article-dialog");


/* ---------- 3. TÌM KIẾM KHÔNG DẤU ----------
   "Huyết áp" -> "huyet ap", để gõ "huyet ap" vẫn tìm ra */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")                    // tách chữ và dấu: "ế" -> "e" + dấu
    .replace(/[̀-ͯ]/g, "")     // xóa các dấu vừa tách
    .replace(/đ/g, "d");
}


/* ---------- 4. TẠO THẺ BÀI VIẾT ---------- */
// Cả thẻ là 1 link dạng #bai-3: bấm để mở bài, gửi link cho người khác cũng mở đúng bài
function createNewsCard(article, isFeatured) {
  const featuredClass = isFeatured ? " featured" : "";
  return `
    <a href="#bai-${article.id}" class="news-card${featuredClass}" data-id="${article.id}">
      <div class="news-thumb ${article.tone}"><i class="${article.icon}"></i></div>
      <div class="news-body">
        <span class="news-category">${CATEGORY_NAMES[article.category]}</span>
        <h3>${article.title}</h3>
        <p class="news-summary">${article.summary}</p>
        <div class="news-meta">
          <span><i class="fa-regular fa-calendar"></i>${article.date}</span>
          <span><i class="fa-regular fa-clock"></i>${article.readTime} phút đọc</span>
        </div>
      </div>
    </a>`;
}

function renderNews() {
  const keyword = normalizeText(searchKeyword);

  // filter(): giữ lại những bài thỏa CẢ 2 điều kiện
  const result = articles.filter(function (article) {
    const isRightCategory = currentCategory === "tat-ca" || article.category === currentCategory;
    const isMatch = normalizeText(article.title + " " + article.summary).includes(keyword);
    return isRightCategory && isMatch;
  });

  if (result.length === 0) {
    newsCount.textContent = "";
    newsGrid.innerHTML = `
      <div class="empty-box">
        <i class="fa-regular fa-newspaper"></i>
        <h3>Không tìm thấy bài viết phù hợp</h3>
        <p>Hãy thử từ khóa khác hoặc chọn chuyên mục "Tất cả".</p>
      </div>`;
    newsGrid.firstElementChild.style.gridColumn = "1 / -1";   // khung thông báo rộng hết lưới
    return;
  }

  // Bài đầu tiên làm bài nổi bật (chỉ khi không tìm kiếm)
  let html = "";
  result.forEach(function (article, index) {
    html += createNewsCard(article, index === 0 && keyword === "");
  });

  newsGrid.innerHTML = html;
  newsCount.textContent = "Có " + result.length + " bài viết";
}


/* ---------- 5. HỘP ĐỌC BÀI ---------- */
function openArticle(id) {
  // find(): trả về phần tử ĐẦU TIÊN thỏa điều kiện, không có thì undefined
  const article = articles.find(function (item) {
    return item.id === id;
  });
  if (article === undefined) {
    return;
  }

  let paragraphs = "";
  for (const text of article.content) {
    paragraphs += `<p>${text}</p>`;
  }

  document.getElementById("dialog-content").innerHTML = `
    <div class="news-thumb article-thumb ${article.tone}"><i class="${article.icon}"></i></div>
    <article class="article-body">
      <span class="news-category">${CATEGORY_NAMES[article.category]}</span>
      <h2>${article.title}</h2>
      <div class="news-meta">
        <span><i class="fa-regular fa-calendar"></i>${article.date}</span>
        <span><i class="fa-regular fa-clock"></i>${article.readTime} phút đọc</span>
        <span><i class="fa-solid fa-user-doctor"></i>Ban biên tập HomeCare</span>
      </div>
      ${paragraphs}
      <p class="article-note">
        <i class="fa-solid fa-circle-info"></i>
        Bài viết chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.
        Cần tư vấn cụ thể? <a href="dat-kham.html"><strong>Đặt lịch khám tại nhà</strong></a>.
      </p>
    </article>`;

  articleDialog.showModal();
  articleDialog.scrollTop = 0;       // luôn mở từ đầu bài
}

// 1 sự kiện cho cả lưới: tìm thẻ bài viết chứa phần tử được bấm
// (không chặn link -> thanh địa chỉ đổi thành ...#bai-3)
newsGrid.addEventListener("click", function (event) {
  const card = event.target.closest(".news-card");
  if (card !== null) {
    openArticle(Number(card.dataset.id));
  }
});

document.getElementById("dialog-close").addEventListener("click", function () {
  articleDialog.close();
});

// Bấm ra vùng nền mờ bên ngoài -> đóng hộp thoại
// (bấm vào nền thì event.target chính là thẻ <dialog>)
articleDialog.addEventListener("click", function (event) {
  if (event.target === articleDialog) {
    articleDialog.close();
  }
});

// Đóng hộp thoại (bằng nút X, nền mờ hay phím Esc) -> xóa #bai-... trên thanh địa chỉ
articleDialog.addEventListener("close", function () {
  history.replaceState(null, "", window.location.pathname + window.location.search);
});


/* ---------- 6. TAB + TÌM KIẾM ---------- */
function selectCategory(category) {
  currentCategory = category;
  for (const tab of newsTabs) {
    tab.classList.toggle("active", tab.dataset.category === category);
  }
  renderNews();
}

for (const tab of newsTabs) {
  tab.addEventListener("click", function () {
    selectCategory(tab.dataset.category);
  });
}

newsSearch.addEventListener("input", function () {
  searchKeyword = newsSearch.value.trim();
  renderNews();
});


/* ---------- 7. ĐĂNG KÝ BẢN TIN ---------- */
const newsletterForm = document.getElementById("newsletter-form");
const newsletterEmail = document.getElementById("newsletter-email");
const newsletterMessage = document.getElementById("newsletter-message");

newsletterForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const email = newsletterEmail.value.trim();

  // Regex email đơn giản: có chữ @ ở giữa và dấu chấm phía sau
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false) {
    newsletterMessage.textContent = "Email không hợp lệ, vui lòng kiểm tra lại";
    newsletterMessage.className = "newsletter-message fail";
    return;
  }

  newsletterMessage.textContent = "Đăng ký thành công! Bản tin đầu tiên sẽ được gửi vào thứ Hai tới.";
  newsletterMessage.className = "newsletter-message ok";
  newsletterForm.reset();
});


/* ---------- 8. CHẠY KHI MỞ TRANG ---------- */
// tin-tuc.html?loai=cam-nang -> mở sẵn tab Cẩm nang
const categoryFromLink = new URLSearchParams(window.location.search).get("loai");
if (categoryFromLink === "tin-y-te" || categoryFromLink === "cam-nang") {
  selectCategory(categoryFromLink);
} else {
  renderNews();
}

// Link có dạng tin-tuc.html#bai-3 -> mở luôn bài số 3
// match() với regex trả về mảng [toàn bộ, số id], không khớp thì null
const articleMatch = window.location.hash.match(/^#bai-(\d+)$/);
if (articleMatch !== null) {
  openArticle(Number(articleMatch[1]));
}
