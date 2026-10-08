import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Transaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Chi admin duoc ghi chi" }, { status: 403 });

    const { amount, description, category, image } = await req.json();
    if (!amount || amount <= 0 || !description) {
      return NextResponse.json({ error: "Thieu thong tin khoan chi" }, { status: 400 });
    }
    if (!image) {
      return NextResponse.json({ error: "Vui long dinh kem anh hoa don/chung tu" }, { status: 400 });
    }

    await dbConnect();
    // Kiem tra so du: khong cho chi vuot so du
    const txs = await Transaction.find({}).lean();
    let balance = 0;
    for (const t of txs) balance += t.type === "in" ? t.amount : -t.amount;
    if (Number(amount) > balance) {
      return NextResponse.json({ error: `So du khong du (con ${balance.toLocaleString("vi-VN")} đ)` }, { status: 400 });
    }

    const imageUrl = await uploadImage(image, "expense");
    const tx = await Transaction.create({
      type: "out",
      amount: Number(amount),
      description,
      category: category || "Khoan chi",
      image: imageUrl,
      createdBy: user.sub,
      date: new Date(),
    });
    return NextResponse.json({ transaction: tx });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi ghi chi" }, { status: 500 });
  }
}
