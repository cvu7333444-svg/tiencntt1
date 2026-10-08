import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Thiếu email hoặc mật khẩu" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    // Lấy hash và xóa sạch khoảng trắng thừa
    const hash = (user.passwordHash || user.password || "").trim();
    if (!hash) {
      return NextResponse.json({ message: "Tài khoản chưa có mật khẩu" }, { status: 400 });
    }

    const isValid = await comparePassword(password, hash);
    if (!isValid) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ message: "Tài khoản đã bị khóa" }, { status: 403 });
    }

    const token = signToken(user);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        className: user.className,
      },
    });
  } catch (err) {
    return NextResponse.json({ message: err.message || "Lỗi máy chủ" }, { status: 500 });
  }
}