-- =========================================================
-- DATABASE/SCHEMA.SQL - CẤU TRÚC CƠ SỞ DỮ LIỆU HOMECARE (PostgreSQL / Supabase)
--
-- AI prompt: "Tạo database lưu thông tin đặt lịch khám" – file này được
-- viết với sự hỗ trợ của AI.
--
-- Cách dùng: Supabase -> SQL Editor -> New query -> dán toàn bộ file -> Run.
-- Chạy lại nhiều lần cũng không sao (có "if not exists").
-- =========================================================


-- ---------- 1. TÀI KHOẢN (đăng nhập bằng số điện thoại) ----------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,                     -- 10 hoặc 11 chữ số
  name          text,
  role          text not null default 'khach-hang'
                check (role in ('khach-hang', 'bac-si')),
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);


-- ---------- 2. MÃ OTP (chỉ lưu bản băm, không lưu mã gốc) ----------
create table if not exists public.otp_codes (
  id          bigint generated always as identity primary key,
  phone       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,                       -- hết hạn sau 5 phút
  attempts    integer not null default 0,                 -- số lần nhập sai
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists otp_codes_phone_idx on public.otp_codes (phone, created_at desc);


-- ---------- 3. LỊCH KHÁM ----------
create table if not exists public.bookings (
  id                  bigint generated always as identity primary key,
  code                text not null unique,               -- mã lịch hẹn, VD: HC204517
  user_id             uuid not null references public.users (id),
  account_phone       text not null,                      -- SĐT đăng nhập của người đặt

  doctor_id           integer not null,
  doctor_name         text not null,
  service_id          text not null,
  service_name        text not null,
  is_online           boolean not null default false,     -- true = tư vấn qua video
  booking_date        date not null,
  booking_time        text not null,                      -- VD: 09:00

  patient_name        text not null,
  relation            text not null default 'Bản thân',
  contact_phone       text,                               -- SĐT khác, KHÔNG bắt buộc
  symptoms            jsonb not null default '[]'::jsonb, -- VD: ["Sốt", "Ho", "Khác"]
  symptom_other       text,                               -- mô tả khi chọn "Khác"
  ward                text,
  street              text,
  note                text,

  service_price       integer not null,
  travel_fee          integer not null default 0,
  discount            integer not null default 0,
  total               integer not null,
  promo_code          text,

  payment_method      text not null default 'cash'
                      check (payment_method in ('cash', 'bank', 'momo', 'vnpay')),
  payment_status      text not null default 'chua-thanh-toan'
                      check (payment_status in ('chua-thanh-toan', 'cho-thanh-toan', 'da-thanh-toan', 'that-bai')),
  vnp_txn_ref         text,                               -- mã giao dịch gửi sang VNPay
  vnp_transaction_no  text,                               -- mã giao dịch VNPay trả về
  vnp_bank_code       text,
  paid_at             timestamptz,

  status              text not null default 'cho-xac-nhan'
                      check (status in ('cho-xac-nhan', 'sap-toi', 'hoan-thanh', 'da-huy')),
  created_at          timestamptz not null default now()
);

create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_txn_idx on public.bookings (vnp_txn_ref);

-- Một bác sĩ không thể có 2 lịch (chưa hủy) trùng ngày giờ -> chống đặt trùng
create unique index if not exists bookings_slot_unique
  on public.bookings (doctor_id, booking_date, booking_time)
  where status <> 'da-huy';


-- ---------- 4. BẢO MẬT ----------
-- Bật Row Level Security và KHÔNG tạo policy nào: trình duyệt (khóa anon)
-- không đọc/ghi trực tiếp được. Chỉ máy chủ (thư mục api/, dùng khóa
-- service_role) mới truy cập được, nên mọi kiểm tra đều đi qua API.
alter table public.users     enable row level security;
alter table public.otp_codes enable row level security;
alter table public.bookings  enable row level security;

-- Cấp toàn quyền cho service_role (backend API máy chủ)
grant all on table public.users to service_role;
grant all on table public.otp_codes to service_role;
grant all on table public.bookings to service_role;
grant all on all sequences in schema public to service_role;

