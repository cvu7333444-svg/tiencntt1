// v100: Ham sinh ma QR chuyen khoan Ngan hang (VietQR / Napas)
// Cach 1 (chinh): dung API cong khai img.vietqr.io -> QR co logo ngan hang, dep, khong can thu vien.
// Cach 2 (fallback): sinh chuoi QRCode Napas de dung qrcode.react render local.

import { Settings } from "./models";
import dbConnect from "./mongodb";

// Doc thong tin ngan hang quy: uu tien DB (admin cau hinh tren web), fallback env.
export async function getFundBankInfo() {
  let dbSettings = null;
  try {
    await dbConnect();
    const doc = await Settings.findOne({ key: "fund_bank" }).lean();
    if (doc && doc.value) dbSettings = doc.value;
  } catch {
    dbSettings = null;
  }
  return {
    bin: (dbSettings?.bin || process.env.FUND_BANK_BIN || "970422").trim(),
    accountNumber: (dbSettings?.accountNumber || process.env.FUND_BANK_ACCOUNT || "0123456789").trim(),
    accountName: (dbSettings?.accountName || process.env.FUND_BANK_NAME || "QUY LOP").trim(),
    accountHolder: (dbSettings?.accountHolder || process.env.FUND_BANK_HOLDER || "").trim(),
  };
}

// Sinh URL anh QR tu VietQR.io (GET truc tiep duoc, da allow trong next.config images)
export function buildVietQRImageUrl({ bin, accountNumber, amount, addInfo, accountName }) {
  const params = new URLSearchParams();
  if (amount) params.set("amount", String(Math.round(Number(amount))));
  if (addInfo) params.set("addInfo", addInfo);
  if (accountName) params.set("accountName", accountName);
  const qs = params.toString();
  // compact2: kich thuoc gon, co logo ngan hang
  return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png${qs ? "?" + qs : ""}`;
}

// Sinh chuoi QR Napas (de fallback render local bang qrcode.react)
// Format: 00020101021238590010A0000007270129<...> — dung thu vien napas247 neu co,
// o day ta dung chuoi co ban de fallback hien thi thong tin chuyen khoan.
export function buildNapasQRString({ bin, accountNumber, amount, addInfo }) {
  // EMVCo co ban (du dung de cac app ngân hàng quét được dạng cơ bản)
  const payloadFormat = "000201";
  const pointOfInitiation = "010212"; // 11 = static, 12 = dynamic (co so tien)
  const guid = "0010A000000727";
  const benInfo = `00${String(bin).length.toString().padStart(2, "0")}${bin}01${String(accountNumber).length.toString().padStart(2, "0")}${accountNumber}0208QRIBFTTA`;
  const benLen = benInfo.length.toString().padStart(2, "0");
  const merchantAccountInfo = `38${benLen}${guid}${benInfo}`;
  const transactionCurrency = "5303704"; // VND
  const transactionAmount = amount ? `54${String(Math.round(Number(amount))).length.toString().padStart(2, "0")}${Math.round(Number(amount))}` : "";
  const countryCode = "5802VN";
  const additionalData = addInfo ? `62${("08" + String(addInfo).length.toString().padStart(2, "0") + addInfo).length.toString().padStart(2, "0")}08${String(addInfo).length.toString().padStart(2, "0")}${addInfo}` : "";
  const crcPlaceholder = "6304";
  let payload = payloadFormat + pointOfInitiation + merchantAccountInfo + transactionCurrency + transactionAmount + countryCode + additionalData + crcPlaceholder;
  // CRC16-CCITT (0xFFFF, poly 0x1021)
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, "0");
  return payload + crcHex;
}
