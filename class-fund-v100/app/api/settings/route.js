import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Settings } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { getFundBankInfo } from "@/lib/qr";

// GET: lay cau hinh (thong tin ngan hang quy)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    const bank = await getFundBankInfo();
    return NextResponse.json({ fundBank: bank });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: admin cap nhat thong tin ngan hang quy
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Chi admin duoc cap nhat" }, { status: 403 });
    const { bin, accountNumber, accountName, accountHolder } = await req.json();
    if (!bin || !accountNumber) return NextResponse.json({ error: "Thieu BIN hoac so tai khoan" }, { status: 400 });
    await dbConnect();
    await Settings.findOneAndUpdate(
      { key: "fund_bank" },
      { key: "fund_bank", value: { bin, accountNumber, accountName: accountName || "", accountHolder: accountHolder || "" } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi cap nhat" }, { status: 500 });
  }
}
