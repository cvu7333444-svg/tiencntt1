import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Contribution, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

// ============================================================
// v100: POST /api/contributions/[id]/selfpay
// Sinh vien TU NOP qua ma QR (chuyen khoan ngan hang).
// Buoc: 1. Mo QR -> 2. Chuyen khoan -> 3. Upload anh bien lai -> 4. Goi API nay
// Ket qua: contribution chuyen sang status = "self_pending" cho admin duyet.
// ============================================================
export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    await dbConnect();
    const me = await User.findOne({ email: user.email }).lean();
    if (!me) return NextResponse.json({ error: "Khong tim thay tai khoan" }, { status: 404 });

    const con = await Contribution.findById(params.id).populate("user").lean();
    if (!con) return NextResponse.json({ error: "Khong tim thay muc nop" }, { status: 404 });
    if (user.role !== "admin" && String(con.user._id) !== String(me._id)) {
      return NextResponse.json({ error: "Ban khong co quyen tu nop giup nguoi khac" }, { status: 403 });
    }
    if (con.status === "approved") return NextResponse.json({ error: "Khoan nay da duoc nop va duyet" }, { status: 400 });

    const { proofImage, note, amount } = await req.json().catch(() => ({}));
    if (!proofImage) {
      return NextResponse.json({ error: "Vui long chup/upload anh bien lai chuyen khoan" }, { status: 400 });
    }

    const imageUrl = await uploadImage(proofImage, "selfpay-proof");
    const update = {
      status: "self_pending",
      payMethod: "bank_transfer",
      proofImage: imageUrl,
      paidAt: new Date(),
      note: note || "Tu chuyen khoan qua QR VietQR",
    };
    if (amount && Number(amount) > 0) update.amount = Number(amount);

    const updated = await Contribution.findByIdAndUpdate(params.id, update, { new: true });
    return NextResponse.json({
      contribution: updated,
      message: "Da gui yeu cau tu nop. Thu quy se kiem tra bien lai va duyet som nhat.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi tu nop" }, { status: 500 });
  }
}
