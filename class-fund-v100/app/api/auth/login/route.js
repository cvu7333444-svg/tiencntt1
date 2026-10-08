import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    // 1. Làm sạch input gửi lên từ client
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const cleanPassword = (body.password || "").trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ message: "Thiếu email hoặc mật khẩu" }, { status: 400 });
    }

    // 2. Tìm user trong DB bằng Regex để bỏ qua khoảng trắng thừa ở đầu/cuối trong Database
    const user = await User.findOne({
      email: { $regex: new RegExp("^\\s*" + cleanEmail + "\\s*$", "i") },
    }).lean();

    if (!user) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    // 3. Lấy chuỗi hash và XÓA SẠCH khoảng trắng thừa (.trim())
    const rawHash = user.passwordHash || user.password || "";
    const cleanHash = rawHash.trim();

    if (!cleanHash) {
      return NextResponse.json({ message: "Tài khoản chưa có mật khẩu" }, { status: 400 });
    }

    // 4. So sánh mật khẩu đã được làm sạch
    const isValid = await comparePassword(cleanPassword, cleanHash);
    if (!isValid) {
      return NextResponse.json({ message: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ message: "Tài khoản đã bị khóa" }, { status: 403 });
    }

    // 5. Tạo token và set cookie đăng nhập
    const token = signToken(user);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        fullName: (user.fullName || "").trim(),
        email: (user.email || "").trim(),
        role: user.role,
        studentId: user.studentId,
        className: user.className,
      },
    });
  } catch (err) {
    return NextResponse.json({ message: err.message || "Lỗi máy chủ" }, { status: 500 });
  }
}