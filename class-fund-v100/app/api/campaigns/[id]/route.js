import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Campaign, Contribution, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    await dbConnect();

    // 1. Tìm thông tin người dùng đang đăng nhập
    const cleanEmail = (user.email || "").trim().toLowerCase();
    const me = await User.findOne({
      $or: [{ _id: user.id || user.sub }, { email: cleanEmail }],
    }).lean();

    if (!me) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    // 2. Lấy danh sách đợt thu
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).lean();

    const result = [];
    for (const c of campaigns) {
      const cons = await Contribution.find({ campaign: c._id })
        .populate("user", "fullName studentId email")
        .lean();

      let paid = 0, total = 0, selfPending = 0;
      let myContribution = null;

      for (const ct of cons) {
        total += ct.amount || 0;
        if (ct.status === "approved") paid += ct.amount || 0;
        if (ct.status === "self_pending") selfPending += 1;

        if (ct.user && String(ct.user._id || ct.user) === String(me._id)) {
          myContribution = ct;
        }
      }

      // TỰ ĐỘNG TẠO CONTRIBUTION CHO SINH VIÊN NẾU CHƯA CÓ
      if (!myContribution && me.role !== "admin" && c.status !== "closed") {
        const newCon = await Contribution.create({
          campaign: c._id,
          user: me._id,
          amount: c.amountPerPerson || c.amount || 0,
          status: "pending",
        });
        myContribution = newCon.toObject();
        cons.push(myContribution);
      }

      result.push({
        ...c,
        amount: c.amountPerPerson || c.amount || 0,
        contributions: cons,
        paid,
        total,
        selfPendingCount: selfPending,
        myContribution,
      });
    }

    return NextResponse.json({
      campaigns: result,
      me: {
        id: me._id.toString(),
        fullName: me.fullName || me.name,
        studentId: me.studentId,
        role: me.role,
        email: me.email,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Lỗi máy chủ" }, { status: 500 });
  }
}