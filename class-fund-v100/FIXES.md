# v100 — Nâng cấp & ghi chú

## MỚI trong v100
1. **Chức năng Tự nộp quỹ qua QR** cho từng tài khoản sinh viên:
   - Nút "Tu nop (QR)" tại trang `/campaigns` cho mỗi khoản chưa nộp.
   - Modal `QRPayModal` hiển thị mã QR VietQR (prefill số tiền + nội dung CK), copy nhanh, upload biên lai.
   - API `POST /api/contributions/[id]/selfpay` tạo yêu cầu tự nộp (status=`self_pending`).
   - API `GET /api/qr?contributionId=xxx` trả về URL ảnh QR + chuỗi Napas fallback.
   - API `GET/PUT /api/settings` — admin cấu hình tài khoản ngân hàng quỹ (ưu tiên DB > env).
   - Trạng thái mới `self_pending` + `payMethod=bank_transfer` trong model Contribution.
   - Admin duyệt tại `/campaigns/[id]` → tự động tạo giao dịch thu (gắn nhãn [Tu chuyen khoan QR]).
2. Thêm dependency `qrcode.react` (fallback render QR local nếu VietQR API lỗi).
3. Thêm biến môi trường `FUND_BANK_BIN / FUND_BANK_ACCOUNT / FUND_BANK_NAME / FUND_BANK_HOLDER`.
4. Seed tạo sẵn 1 contribution ở trạng thái `self_pending` (sv102) để test.

## Kế thừa từ v10 (đã fix)
- Middleware dùng `jose` (tương thích Edge Runtime), không dùng `jsonwebtoken`.
- `.env` có đủ `JWT_SECRET`, `JWT_EXPIRES`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
- Đủ file PWA: `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon.svg`.
- `vercel.json` `maxDuration: 10` (tương thích gói Hobby).
- Tailwind có đủ thang màu `brand-50→900`.
- `jsconfig.json` có `baseUrl` + alias `@/*`.
- Matcher middleware loại trừ file tĩnh PNG/SVG/font + `/api`.

## Lưu ý bảo mật
- `.env` chứa MONGODB_URI thật — KHÔNG commit, nên đổi mật khẩu cluster.
- Trên Vercel khai báo đủ env vars (gồm `FUND_BANK_*`).
- Ảnh biên lai khi chưa bật Blob sẽ lưu base64 (giới hạn ~1MB) — production nên bật Vercel Blob.
