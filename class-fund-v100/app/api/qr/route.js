import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Contribution, User, Campaign } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { getFundBankInfo, buildVietQRImageUrl, buildNapasQRString } from "@/lib/qr";
import { buildTransferNote } from "@/lib/format";

// ============================================================
// v100: GET /api/qr?contributionId=xxx
// Tra ve thong tin ma QR de sinh vien tu chuyen khoan:
//  - imageUrl: anh QR VietQR (co logo ngan hang, prefill so tien + noi dung)
//  - napasString: chuoi QR Napas (fallback render local)
//  - bankInfo, amount, transferNote
// ============================================================
export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const contributionId = searchParams.get("contributionId");
    if (!contributionId) return NextResponse.json({ error: "Thieu contributionId" }, { status: 400 });

    await dbConnect();
    const con = await Contribution.findById(contributionId).populate("user").populate("campaign").lean();
    if (!con) return NextResponse.json({ error: "Khong tim thay muc nop" }, { status: 404 });

    const me = await User.findOne({ email: user.email }).lean();
    if (user.role !== "admin" && me && String(con.user._id) !== String(me._id)) {
      return NextResponse.json({ error: "Ban khong co quyen xem QR cua nguoi khac" }, { status: 403 });
    }

    const bank = await getFundBankInfo();
    const amount = con.amount;
    const transferNote = buildTransferNote(con.user?.name, con.campaign?.title);
    const imageUrl = buildVietQRImageUrl({
      bin: bank.bin,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      amount,
      addInfo: transferNote,
    });
    const napasString = buildNapasQRString({ bin: bank.bin, accountNumber: bank.accountNumber, amount, addInfo: transferNote });

    return NextResponse.json({
      imageUrl,
      napasString,
      bank,
      amount,
      transferNote,
      contribution: {
        id: con._id,
        status: con.status,
        payMethod: con.payMethod,
        user: { name: con.user?.name, studentId: con.user?.studentId },
        campaign: { id: con.campaign?._id, title: con.campaign?.title },
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi sinh QR" }, { status: 500 });
  }
}
