import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User, Contribution } from "@/lib/models";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    await dbConnect();
    const members = await User.find({ role: "member" }).sort({ studentId: 1 }).lean();
    const result = [];
    for (const m of members) {
      const cons = await Contribution.find({ user: m._id }).lean();
      let paid = 0, pending = 0;
      for (const c of cons) {
        if (c.status === "approved") paid += c.amount;
        else pending += c.amount;
      }
      result.push({ id: m._id, name: m.name, studentId: m.studentId, email: m.email, phone: m.phone, active: m.active, paid, pending });
    }
    return NextResponse.json({ members: result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Chi admin duoc them thanh vien" }, { status: 403 });
    const { name, studentId, email, password, phone } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Thieu thong tin bat buoc" }, { status: 400 });
    await dbConnect();
    const exist = await User.findOne({ email: email.toLowerCase().trim() });
    if (exist) return NextResponse.json({ error: "Email da ton tai" }, { status: 400 });
    const m = await User.create({
      name, studentId: studentId || "", email: email.toLowerCase().trim(),
      password: hashPassword(password), role: "member", phone: phone || "",
    });
    // Tu them vao cac dot thu dang open
    const { Campaign } = await import("@/lib/models");
    const openCampaigns = await Campaign.find({ status: "open" }).lean();
    for (const c of openCampaigns) {
      await Contribution.create({ campaign: c._id, user: m._id, amount: c.amountPerPerson, status: "pending" });
    }
    return NextResponse.json({ member: { id: m._id, name: m.name, email: m.email } });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi them thanh vien" }, { status: 500 });
  }
}
