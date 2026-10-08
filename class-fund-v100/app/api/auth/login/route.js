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

    // 1. Tìm user và lấy cả trường passwordHash / password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash +password");
    if (!user) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    // 2. Lấy chuỗi hash mật khẩu an toàn (MongoDB dùng passwordHash)
    const hash = user.passwordHash || user.password;
    if (!hash) {
      return NextResponse.json({ message: "Tài khoản chưa có mật khẩu" }, { status: 400 });
    }

    // 3. So sánh mật khẩu
    const isValid = await comparePassword(password, hash);
    if (!isValid) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ message: "Tài khoản đã bị khóa" }, { status: 403 });
    }

    // 4. Tạo token và set cookie
    const token = signToken(user);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id,
        _id: user._id,
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