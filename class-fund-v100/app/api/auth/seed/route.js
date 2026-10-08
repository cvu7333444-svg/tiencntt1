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

    // Tạo mã hóa chuẩn cho mật khẩu "123456"
    const hashPassword = await bcrypt.hash("123456", 10);

    // Danh sách 3 tài khoản thử nghiệm
    const testAccounts = [
      {
        email: "cvu7333444@gmail.com",
        fullName: "Vũ Tiến Cường",
        studentId: "12",
        className: "CNTT1",
        role: "admin",
        isActive: true,
      },
      {
        email: "sv100@class.edu",
        fullName: "Sinh Viên 100",
        studentId: "SV100",
        className: "CNTT1",
        role: "adnmin",
        isActive: true,
      },
      {
        email: "test@gmail.com",
        fullName: "Tài Khoản Thử Nghiệm",
        studentId: "TEST01",
        className: "CNTT1",
        role: "student",
        isActive: true,
      },
    ];

    const results = [];

    for (const acc of testAccounts) {
      const cleanEmail = acc.email.trim().toLowerCase();

      const updatedUser = await User.findOneAndUpdate(
        { email: cleanEmail },
        {
          $set: {
            email: cleanEmail,
            passwordHash: hashPassword,
            password: hashPassword,
            fullName: acc.fullName,
            studentId: acc.studentId,
            className: acc.className,
            role: acc.role,
            isActive: acc.isActive,
          },
        },
        { upsert: true, new: true }
      );

      results.push({
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        matKhau: "123456",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã tạo / cập nhật thành công các tài khoản thử nghiệm!",
      accounts: results,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Lỗi tạo tài khoản" }, { status: 500 });
  }
}