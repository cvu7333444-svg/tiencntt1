import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Transaction } from "@/lib/models";

// So quy cong khai (ai cung xem duoc)
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const txs = await Transaction.find({}).sort({ date: -1, createdAt: -1 }).limit(limit).lean();
    let balance = 0;
    const sorted = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const t of sorted) balance += t.type === "in" ? t.amount : -t.amount;
    return NextResponse.json({ transactions: txs, balance });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
