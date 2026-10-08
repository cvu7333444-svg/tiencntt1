import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Campaign, Contribution, User, Transaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

// GET: danh sach dot thu (login)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    await dbConnect();
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).lean();
    const me = await User.findOne({ email: user.email }).lean();

    const result = [];
    for (const c of campaigns) {
      const cons = await Contribution.find({ campaign: c._id }).populate("user", "name studentId email").lean();
      let paid = 0, total = 0, selfPending = 0;
      let myContribution = null;
      for (const ct of cons) {
        total += ct.amount;
        if (ct.status === "approved") paid += ct.amount;
        if (ct.status === "self_pending") selfPending += 1;
        if (me && ct.user && String(ct.user._id) === String(me._id)) myContribution = ct;
      }
      result.push({ ...c, contributions: cons, paid, total, selfPendingCount: selfPending, myContribution });
    }
    return NextResponse.json({ campaigns: result, me: me ? { id: me._id, name: me.name, studentId: me.studentId, role: me.role } : null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: tao dot thu (admin)
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Chi admin duoc tao dot thu" }, { status: 403 });

    const { title, description, amountPerPerson, deadline } = await req.json();
    if (!title || !amountPerPerson || amountPerPerson <= 0) {
      return NextResponse.json({ error: "Thieu tieu de hoac so tien" }, { status: 400 });
    }
    await dbConnect();
    const campaign = await Campaign.create({
      title, description, amountPerPerson: Number(amountPerPerson),
      deadline: deadline ? new Date(deadline) : null,
      status: "open", createdBy: user.sub,
    });
    // Tu dong tao contribution (pending) cho moi thanh vien
    const members = await User.find({ role: "member", active: true }).lean();
    for (const m of members) {
      await Contribution.create({ campaign: campaign._id, user: m._id, amount: campaign.amountPerPerson, status: "pending" });
    }
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi tao dot thu" }, { status: 500 });
  }
}
