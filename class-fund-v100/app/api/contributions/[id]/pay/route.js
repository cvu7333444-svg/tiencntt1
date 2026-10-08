import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Contribution, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

// POST /api/contributions/[id]/pay — Sinh vien nop tien mat (cho thu quy xac nhan)
export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    await dbConnect();
    const me = await User.findOne({ email: user.email }).lean();
    if (!me) return NextResponse.json({ error: "Khong tim thay tai khoan" }, { status: 404 });

    const con = await Contribution.findById(params.id).populate("user").lean();
    if (!con) return NextResponse.json({ error: "Khong tim thay muc nop" }, { status: 404 });
    // Chi chinh chu tai khoan moi nop duoc (admin co the thay doi sau)
    if (user.role !== "admin" && String(con.user._id) !== String(me._id)) {
      return NextResponse.json({ error: "Ban khong co quyen nop giup nguoi khac" }, { status: 403 });
    }
    if (con.status === "approved") return NextResponse.json({ error: "Khoan nay da duoc nop va duyet" }, { status: 400 });

    const { note, proofImage } = await req.json().catch(() => ({}));
    const update = { status: "pending", payMethod: "cash", paidAt: new Date(), note: note || "" };
    if (proofImage) update.proofImage = await uploadImage(proofImage, "pay-proof");

    const updated = await Contribution.findByIdAndUpdate(params.id, update, { new: true });
    return NextResponse.json({ contribution: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi nop tien" }, { status: 500 });
  }
}
