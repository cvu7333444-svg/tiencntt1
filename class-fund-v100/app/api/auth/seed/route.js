import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();

    let bcrypt;
    try {
      bcrypt = require("bcryptjs");
    } catch {
      bcrypt = require("bcrypt");
    }

    // Tạo mã hóa mật khẩu 123456 chuẩn (không bị dính khoảng trắng)
    const newHash = await bcrypt.hash("123456", 10);

    // Lấy tất cả user trong DB và làm sạch khoảng trắng
    const users = await User.find({});
    
    for (const u of users) {
      const cleanEmail = (u.email || "").trim().toLowerCase();
      const cleanStudentId = (u.studentId || "").trim();
      const cleanFullName = (u.fullName || "").trim();
      const cleanClassName = (u.className || "").trim();
      const cleanRole = (u.role || "student").trim();

      await User.updateOne(
        { _id: u._id },
        {
          $set: {
            email: cleanEmail,
            passwordHash: newHash,
            password: newHash,
            studentId: cleanStudentId,
            fullName: cleanFullName,
            className: cleanClassName,
            role: cleanRole,
            isActive: true
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã dọn dẹp toàn bộ khoảng trắng thừa trong MongoDB và reset mật khẩu về 123456 thành công!",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}