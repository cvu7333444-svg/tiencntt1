import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // Tạo mã hóa chuẩn cho mật khẩu "123456"
    const hashPassword = await bcrypt.hash("123456", 10);

    // Danh sách 3 tài khoản thử nghiệm
    const testAccounts = [
      {
        email: "cvu7333444@gmail.com",
        name: "Vũ Tiến Cường",
        studentId: "12",
        role: "admin",
        active: true,
      },
      {
        email: "sv100@class.edu",
        name: "Sinh Viên 100",
        studentId: "SV100",
        role: "admin",
        active: true,
      },
      {
        email: "test@gmail.com",
        name: "Tài Khoản Thử Nghiệm",
        studentId: "TEST01",
        role: "member",
        active: true,
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
            name: acc.name,
            password: hashPassword,
            studentId: acc.studentId,
            role: acc.role,
            active: acc.active,
          },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );

      results.push({
        email: updatedUser.email,
        name: updatedUser.name,
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