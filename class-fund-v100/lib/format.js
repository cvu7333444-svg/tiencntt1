// Dinh dang tien te Viet Nam Dong
export function formatVND(n) {
  if (n === null || n === undefined || isNaN(n)) return "0 đ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n));
}

export function formatDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatDateTime(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Noi dung chuyen khoan cho QR: VD: QL SV100 DOT1
export function buildTransferNote(studentId, campaignIdShort) {
  const sid = (studentId || "SV").replace(/\s+/g, "").toUpperCase();
  const cid = String(campaignIdShort || "").slice(-4).toUpperCase();
  return `QUYLOP ${sid}${cid ? " " + cid : ""}`.slice(0, 50);
}
