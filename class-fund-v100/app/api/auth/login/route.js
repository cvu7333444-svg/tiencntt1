import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Vui long nhap day du email va mat khau" }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash +password");
    if (!user || !comparePassword(password, user.password)) {
      return NextResponse.json({ error: "Email hoac mat khau khong dung" }, { status: 401 });
    }
    if (!user.active) {
      return NextResponse.json({ error: "Tai khoan da bi khoa" }, { status: 403 });
    }
    const token = signToken(user);
    setAuthCookie(token);
    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi dang nhap" }, { status: 500 });
  }
}
