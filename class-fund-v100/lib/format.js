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

export function isCampaignDeadlinePassed(deadline, now = new Date()) {
  if (!deadline) return false;
  const dueDate = new Date(deadline);
  if (Number.isNaN(dueDate.getTime())) return false;

  const todayParts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const today = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
  const todayKey = `${today.year}-${today.month}-${today.day}`;
  return todayKey > dueDate.toISOString().slice(0, 10);
}

// Noi dung chuyen khoan cho QR: ten sinh vien + ten dot thu.
export function buildTransferNote(studentName, campaignTitle) {
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const name = normalize(studentName) || "Sinh vien";
  const campaign = normalize(campaignTitle) || "Nop tien";
  return `${name} ${campaign}`.slice(0, 50).trim();
}
