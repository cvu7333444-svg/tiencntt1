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

    // Tạo mã hóa mật khẩu 123456 chuẩn bằng chính thư viện của Server
    const hash = await bcrypt.hash("123456", 10);

    // Cập nhật vào tài khoản trong Database
    const user = await User.findOneAndUpdate(
      { email: "cvu7333444@gmail.com" },
      { $set: { passwordHash: hash, password: hash } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy tài khoản cvu7333444@gmail.com trong Database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật mật khẩu tài khoản cvu7333444@gmail.com về 123456 thành công!",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
