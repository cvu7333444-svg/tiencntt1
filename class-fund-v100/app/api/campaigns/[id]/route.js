import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Campaign, Contribution, Transaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Chỉ admin được xem chi tiết đợt thu" }, { status: 403 });
    }

    await dbConnect();
    const campaign = await Campaign.findById(params.id).lean();
    if (!campaign) {
      return NextResponse.json({ error: "Không tìm thấy đợt thu" }, { status: 404 });
    }

    const contributions = await Contribution.find({ campaign: campaign._id })
      .populate("user", "name studentId email")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ campaign, contributions });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không tải được chi tiết đợt thu" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Chỉ admin được xóa đợt thu" }, { status: 403 });
    }
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: "Mã đợt thu không hợp lệ" }, { status: 400 });
    }

    await dbConnect();
    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        const campaign = await Campaign.findById(params.id).session(session).lean();
        if (!campaign) {
          result = { status: 404, body: { error: "Không tìm thấy đợt thu" } };
          return;
        }

        const contributions = await Contribution.find({ campaign: campaign._id })
          .select("_id status")
          .session(session)
          .lean();
        const hasApprovedContribution = contributions.some((item) => item.status === "approved");
        const hasRelatedTransaction = await Transaction.exists({
          $or: [
            { campaign: campaign._id },
            { contribution: { $in: contributions.map((item) => item._id) } },
          ],
        }).session(session);

        if (hasApprovedContribution || hasRelatedTransaction) {
          result = {
            status: 409,
            body: { error: "Không thể xóa đợt thu đã có khoản đóng góp được duyệt hoặc giao dịch tiền." },
          };
          return;
        }

        await Contribution.deleteMany({ campaign: campaign._id }, { session });
        await Campaign.deleteOne({ _id: campaign._id }, { session });
        result = { status: 200, body: { ok: true } };
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể xóa đợt thu" },
      { status: 500 }
    );
  }
}
