import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Campaign, Contribution, Transaction, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { isCampaignDeadlinePassed } from "@/lib/format";

// So quy cong khai (ai cung xem duoc)
export async function GET(req) {
  try {
    const currentUser = await getCurrentUser();
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const txs = await Transaction.find({}).sort({ date: -1, createdAt: -1 }).limit(limit).lean();
    let balance = 0;
    const sorted = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const t of sorted) balance += t.type === "in" ? t.amount : -t.amount;

    const [members, campaigns, viewer] = await Promise.all([
      User.find({ role: { $in: ["member", "student"] } })
        .select("_id name studentId")
        .sort({ name: 1 })
        .lean(),
      Campaign.find({})
        .select("_id title amountPerPerson status deadline createdBy")
        .sort({ createdAt: -1 })
        .lean(),
      currentUser?.sub
        ? User.findById(currentUser.sub).select("_id name studentId role").lean()
        : Promise.resolve(null),
    ]);
    const campaignMembers =
      viewer && !members.some((member) => String(member._id) === String(viewer._id))
        ? [...members, viewer]
        : members;
    const contributions = await Contribution.find({
      campaign: { $in: campaigns.map((campaign) => campaign._id) },
      user: { $in: campaignMembers.map((member) => member._id) },
    })
      .select("campaign user status amount approvedAt paidAt")
      .lean();
    const contributionsByMemberAndCampaign = new Map(
      contributions.map((contribution) => [
        `${contribution.campaign}:${contribution.user}`,
        contribution,
      ])
    );
    const paymentStatuses = campaigns
      .filter((campaign) => !isCampaignDeadlinePassed(campaign.deadline))
      .map((campaign) => {
        const ownerId = currentUser?.sub || campaign.createdBy;
        const campaignRows = campaignMembers.map((member) => {
          const contribution = contributionsByMemberAndCampaign.get(
            `${campaign._id}:${member._id}`
          );
          const isViewer = String(member._id) === String(currentUser?.sub);
          return {
            id: member._id,
            name: member.name,
            studentId: member.studentId,
            status: contribution?.status || (isViewer && member.role === "admin" ? "not_applicable" : "pending"),
            amount: contribution?.amount ?? campaign.amountPerPerson,
            paidAt: contribution?.approvedAt || contribution?.paidAt || null,
            isOwner: String(member._id) === String(ownerId),
            isViewer,
          };
        });
        campaignRows.sort((a, b) => {
          if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
          const aPaid = a.status === "approved";
          const bPaid = b.status === "approved";
          if (aPaid !== bPaid) return aPaid ? -1 : 1;
          if (aPaid && bPaid) {
            return new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime();
          }
          return a.name.localeCompare(b.name, "vi");
        });

        return {
          id: campaign._id,
          title: campaign.title,
          amountPerPerson: campaign.amountPerPerson,
          status: campaign.status,
          deadline: campaign.deadline,
          members: campaignRows,
        };
      });

    return NextResponse.json({ transactions: txs, balance, paymentStatuses });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
