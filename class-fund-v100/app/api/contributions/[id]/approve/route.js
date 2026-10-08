import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Contribution, Transaction, Campaign, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/contributions/[id]/approve — Admin duyet (tu tao giao dich thu)
// Body: { action: "approve" | "reject", note? }
export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Chi admin duoc duyet" }, { status: 403 });

    const { action, note } = await req.json().catch(() => ({ action: "approve" }));
    await dbConnect();
    const con = await Contribution.findById(params.id).populate("user").populate("campaign").lean();
    if (!con) return NextResponse.json({ error: "Khong tim thay muc nop" }, { status: 404 });
    if (con.status === "approved") return NextResponse.json({ error: "Khoan nay da duoc duyet" }, { status: 400 });

    if (action === "reject") {
      const updated = await Contribution.findByIdAndUpdate(
        params.id,
        { status: "rejected", note: note || (con.note || "") + " | Bi tu choi" },
        { new: true }
      );
      return NextResponse.json({ contribution: updated });
    }

    // Approve -> tao giao dich thu (neu chua co)
    const existing = await Transaction.findOne({ contribution: con._id, type: "in" });
    if (!existing) {
      await Transaction.create({
        type: "in",
        amount: con.amount,
        description: `Thu quy - ${con.user?.name || ""} (${con.user?.studentId || ""}) - ${con.campaign?.title || ""}${con.payMethod === "bank_transfer" ? " [Tu chuyen khoan QR]" : ""}`,
        category: "Thu quy",
        image: con.proofImage || "",
        contribution: con._id,
        campaign: con.campaign?._id,
        createdBy: user.sub,
        date: con.paidAt || new Date(),
      });
    }
    const updated = await Contribution.findByIdAndUpdate(
      params.id,
      { status: "approved", approvedAt: new Date(), approvedBy: user.sub, note: note || con.note || "" },
      { new: true }
    );
    return NextResponse.json({ contribution: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi duyet" }, { status: 500 });
  }
}
