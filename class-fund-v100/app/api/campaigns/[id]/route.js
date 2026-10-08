import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Campaign, Contribution, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    await dbConnect();
    const campaign = await Campaign.findById(params.id).lean();
    if (!campaign) return NextResponse.json({ error: "Khong tim thay dot thu" }, { status: 404 });
    const cons = await Contribution.find({ campaign: params.id }).populate("user", "name studentId email").lean();
    const me = await User.findOne({ email: user.email }).lean();
    let myContribution = null;
    for (const c of cons) {
      if (me && c.user && String(c.user._id) === String(me._id)) myContribution = c;
    }
    return NextResponse.json({ campaign, contributions: cons, myContribution, me: me ? { id: me._id, name: me.name, studentId: me.studentId, role: me.role } : null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
