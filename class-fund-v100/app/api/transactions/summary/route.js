import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Transaction, Campaign, Contribution, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    await dbConnect();

    const txs = await Transaction.find({}).lean();
    let totalIn = 0, totalOut = 0;
    for (const t of txs) {
      if (t.type === "in") totalIn += t.amount;
      else totalOut += t.amount;
    }
    const balance = totalIn - totalOut;

    const campaigns = await Campaign.find({ status: "open" }).lean();
    let myPending = 0, myPaid = 0;
    if (user.role === "member") {
      const me = await User.findOne({ email: user.email }).lean();
      if (me) {
        const cons = await Contribution.find({ user: me._id }).lean();
        for (const c of cons) {
          if (c.status === "approved") myPaid += c.amount;
          else myPending += c.amount;
        }
      }
    }
    const memberCount = await User.countDocuments({ role: "member", active: true });
    const approvedCount = await Contribution.countDocuments({ status: "approved" });
    const selfPendingCount = await Contribution.countDocuments({ status: "self_pending" });

    // 7 ngay gan nhat
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      let inn = 0, out = 0;
      for (const t of txs) {
        const td = new Date(t.date);
        if (td >= d && td < next) {
          if (t.type === "in") inn += t.amount; else out += t.amount;
        }
      }
      days.push({ date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), in: inn, out });
    }

    return NextResponse.json({
      totalIn, totalOut, balance,
      openCampaigns: campaigns.length,
      memberCount, approvedCount, selfPendingCount,
      myPending, myPaid,
      chart: days,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
