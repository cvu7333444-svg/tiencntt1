const BANK_NAMES_BY_BIN = {
  "970403": "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
  "970405": "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)",
  "970407": "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
  "970415": "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)",
  "970416": "Ngân hàng TMCP Á Châu (ACB)",
  "970418": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
  "970422": "Ngân hàng TMCP Quân đội (MB Bank)",
  "970423": "Ngân hàng TMCP Tiên Phong (TPBank)",
  "970432": "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)",
  "970436": "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
  "970437": "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)",
  "970441": "Ngân hàng TMCP Quốc tế Việt Nam (VIB)",
  "970443": "Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)",
  "970426": "Ngân hàng TMCP Hàng Hải Việt Nam (MSB)",
  "970448": "Ngân hàng TMCP Phương Đông (OCB)",
};

export function getBankName(bin) {
  const normalizedBin = String(bin || "").trim();
  return BANK_NAMES_BY_BIN[normalizedBin] || `Ngân hàng chưa xác định (BIN ${normalizedBin})`;
}
