import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    const { image, name } = await req.json();
    if (!image) return NextResponse.json({ error: "Thieu hinh anh" }, { status: 400 });
    const url = await uploadImage(image, name || "upload");
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi upload" }, { status: 500 });
  }
}
