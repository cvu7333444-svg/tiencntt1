import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Transaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

// GET /api/reports/export?format=excel|pdf
export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Chi admin duoc xuat bao cao" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "excel";
    await dbConnect();
    const txs = await Transaction.find({}).sort({ date: 1 }).lean();
    let balance = 0;
    const rows = txs.map((t) => {
      balance += t.type === "in" ? t.amount : -t.amount;
      return {
        date: new Date(t.date).toLocaleString("vi-VN"),
        type: t.type === "in" ? "Thu" : "Chi",
        amount: t.amount,
        description: t.description,
        category: t.category || "",
        balance,
      };
    });

    if (format === "excel") {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("So quy");
      ws.columns = [
        { header: "Ngay gio", key: "date", width: 20 },
        { header: "Loai", key: "type", width: 8 },
        { header: "So tien", key: "amount", width: 15 },
        { header: "Noi dung", key: "description", width: 50 },
        { header: "Danh muc", key: "category", width: 15 },
        { header: "So du", key: "balance", width: 15 },
      ];
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));
      const buf = await wb.xlsx.writeBuffer();
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="so-quy.xlsx"',
        },
      });
    }

    // PDF (pdfkit) — tao trong buffer
    const PDFDocument = (await import("pdfkit")).default;
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.on("data", (c) => chunks.push(c));
    doc.fontSize(16).text("BAO CAO SO QUY LOP HOC", { align: "center" });
    doc.moveDown();
    doc.fontSize(10);
    let y = doc.y;
    rows.forEach((r) => {
      if (y > 780) { doc.addPage(); y = 50; }
      doc.text(`${r.date} | ${r.type} | ${r.amount.toLocaleString("vi-VN")} đ | ${r.description} | Du: ${r.balance.toLocaleString("vi-VN")} đ`, 40, y, { width: 515 });
      y += 18;
    });
    doc.end();
    const buf = Buffer.concat(chunks);
    return new NextResponse(buf, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="so-quy.pdf"' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Loi xuat bao cao" }, { status: 500 });
  }
}
