import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Campaign, Contribution, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

// GET: Danh sách đợt thu (Cả Admin và Sinh viên đều gọi được)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    await dbConnect();

    // 1. Tìm thông tin user hiện tại
    const cleanEmail = (user.email || "").trim().toLowerCase();
    const me = await User.findOne({ email: cleanEmail }).lean();

    // 2. Lấy danh sách đợt thu
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).lean();

    const result = [];
    for (const c of campaigns) {
      // Populate đúng trường fullName
      const cons = await Contribution.find({ campaign: c._id })
        .populate("user", "fullName studentId email")
        .lean();

      let paid = 0, total = 0, selfPending = 0;
      let myContribution = null;

      for (const ct of cons) {
        total += ct.amount || 0;
        if (ct.status === "approved") paid += ct.amount || 0;
        if (ct.status === "self_pending") selfPending += 1;
        if (me && ct.user && String(ct.user._id) === String(me._id)) {
          myContribution = ct;
        }
      }

      result.push({
        ...c,
        amount: c.amountPerPerson || c.amount || 0, // Chuẩn hóa tên trường số tiền
        contributions: cons,
        paid,
        total,
        selfPendingCount: selfPending,
        myContribution,
      });
    }

    return NextResponse.json({
      campaigns: result,
      me: me
        ? {
            id: me._id.toString(),
            fullName: me.fullName || me.name,
            studentId: me.studentId,
            role: me.role,
          }
        : null,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Lỗi lấy đợt thu" }, { status: 500 });
  }
}

// POST: Tạo đợt thu mới (Chỉ dành cho Admin)
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Chỉ admin mới được tạo đợt thu" }, { status: 403 });
    }

    const { title, description, amountPerPerson, deadline } = await req.json();
    if (!title || !amountPerPerson || amountPerPerson <= 0) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc số tiền" }, { status: 400 });
    }

    await dbConnect();

    // 1. Tạo campaign mới
    const campaign = await Campaign.create({
      title,
      description,
      amountPerPerson: Number(amountPerPerson),
      deadline: deadline ? new Date(deadline) : null,
      status: "open",
      createdBy: user.sub || user.id,
    });

    // 2. Tìm tất cả Sinh viên (role: "student" hoặc "member") để tự động tạo khoản thu pending
    const members = await User.find({
      $or: [{ role: "student" }, { role: "member" }],
      isActive: { $ne: false },
    }).lean();

    // 3. Tạo contribution cho từng sinh viên
    for (const m of members) {
      await Contribution.create({
        campaign: campaign._id,
        user: m._id,
        amount: campaign.amountPerPerson,
        status: "pending",
      });
    }

    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Lỗi tạo đợt thu" }, { status: 500 });
  }
}