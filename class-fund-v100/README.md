# Quản lý Tiền quỹ Lớp học — Bản v100 (Next.js + Vercel + PWA + Tự nộp QR)

Bản nâng cấp lớn từ v10: thêm chức năng **Tự nộp quỹ qua mã QR VietQR** cho từng tài khoản sinh viên.

## MỚI trong v100 (so với v10)
- ✅ **Chức năng "Tự nộp (QR)"** cho mỗi tài khoản sinh viên: ở trang Đợt thu, mỗi khoản cần nộp có nút **"Tu nop (QR)"**.
- ✅ Khi ấn vào → **đẩy mã QR VietQR** (có logo ngân hàng, đã điền sẵn số tiền + nội dung chuyển khoản `QUYLOP <MSSV> <Mã đợt>`).
- ✅ Sinh viên quét QR bằng app ngân hàng → chuyển khoản → upload ảnh biên lai → gửi xác nhận.
- ✅ Hệ thống tự chuyển khoản đó sang trạng thái **"Đã chuyển khoản - chờ duyệt"** (self_pending).
- ✅ **Trang Cài đặt** cho admin cấu hình tài khoản ngân hàng của quỹ (BIN, số TK, tên TK) — dùng để sinh QR.
- ✅ Admin thấy badge **"N chờ duyệt QR"** và duyệt/từ chối ngay tại trang chi tiết đợt thu (có xem ảnh biên lai).
- ✅ Khi duyệt → **tự động ghi thu** vào sổ quỹ (gắn nhãn `[Tu chuyen khoan QR]`).
- ✅ Fallback QR local bằng `qrcode.react` nếu API VietQR không load được.
- ✅ Nút copy nhanh số tài khoản + nội dung chuyển khoản.

## Tech Stack
- **Next.js 14** (App Router) + **React 18** + **Tailwind CSS** + **Recharts** + **qrcode.react**
- **MongoDB** (MongoDB Atlas) + **Mongoose** (cached connection)
- **Vercel Blob** (lưu ảnh) + **Vercel Serverless Functions**
- **VietQR API** (`img.vietqr.io`) — sinh mã QR chuyển khoản động, có logo ngân hàng
- **JWT** trong httpOnly cookie + **PWA**

## Chạy local
```bash
npm install
cp .env.example .env   # sửa MONGODB_URI + FUND_BANK_*
npm run dev            # http://localhost:3000
node --env-file=.env lib/seed.js   # tạo dữ liệu mẫu
```

## Biến môi trường (thêm v100)
| Biến | Mô tả |
|---|---|
| `MONGODB_URI` | Connection string MongoDB |
| `JWT_SECRET` | Chuỗi bí mật JWT (`openssl rand -hex 32`) |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (tùy chọn) |
| `NEXT_PUBLIC_SITE_URL` | URL site |
| `FUND_BANK_BIN` | **Mã ngân hàng** (VD: 970422=MB, 970415=VCB, 970407=Techcombank) |
| `FUND_BANK_ACCOUNT` | **Số tài khoản quỹ** |
| `FUND_BANK_NAME` | Tên hiển thị trên QR (VD: QUY LOP 12A1) |
| `FUND_BANK_HOLDER` | Chủ tài khoản |

> Admin có thể sửa các giá trị này ngay trên web tại trang **Cài đặt** (ưu tiên hơn biến môi trường).

## Tài khoản mẫu (sau khi seed)
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin (Thủ quỹ) | thuquy@class.edu | admin123 |
| Member | sv100@class.edu → sv104@class.edu | 123456 |

> Sau khi seed, `sv102` đã ở trạng thái **self_pending** (tự chuyển khoản qua QR, chờ duyệt) để bạn test chức năng.

## Luồng "Tự nộp QR" (v100)
1. Sinh viên đăng nhập → vào trang **"Đợt thu / Nộp quỹ"**.
2. Mỗi đợt thu có nút **"Tu nop (QR)"** (xanh lá, icon QR) — chỉ hiện khi chưa nộp/không duyệt.
3. Ấn vào → modal hiện **mã QR VietQR** (prefill số tiền + nội dung CK), thông tin ngân hàng, nút copy.
4. Sinh viên quét bằng app ngân hàng, chuyển khoản, rồi ấn **"Đã chuyển khoản"**.
5. Upload/chụp ảnh biên lai → **"Xác nhận đã nộp"** → gọi API `/api/contributions/:id/selfpay`.
6. Trạng thái → **self_pending**. Admin thấy badge vàng "chờ duyệt QR", vào chi tiết xem biên lai → **Duyệt** → tự động ghi thu.

## Cấu trúc thư mục
```
app/
├── layout.jsx, page.jsx, globals.css
├── login/, dashboard/, ledger/, reports/, settings/
├── campaigns/ (danh sách + nút Tự nộp QR)
├── campaigns/[id]/ (chi tiết + admin duyệt)
├── expense/new/ (ghi chi)
├── members/ (quản lý sinh viên)
└── api/
    ├── auth/{login,logout,me}/
    ├── transactions/{,summary,expense}/
    ├── campaigns/{,[id]}/
    ├── contributions/[id]/{pay,selfpay,approve}/   ← selfpay MỚI v100
    ├── qr/                                          ← MỚI v100 (sinh QR)
    ├── settings/                                    ← MỚI v100 (cấu hình NH)
    ├── members/, upload/, reports/export/
components/
├── AppShell.jsx, Providers.jsx, PWARegister.jsx, Toast.jsx, ui.jsx
└── QRPayModal.jsx                                   ← MỚI v100 (modal QR tự nộp)
lib/
├── mongodb.js, models.js, auth.js, upload.js, format.js, seed.js
└── qr.js                                            ← MỚI v100 (VietQR + Napas)
```

## Deploy lên Vercel
Như v10: import GitHub repo → thêm env vars (gồm `FUND_BANK_*`) → bật Blob → deploy.
