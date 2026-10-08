// Seed du lieu mau: chay bang `npm run seed` (node --env-file=.env lib/seed.js)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Thieu MONGODB_URI trong .env");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "member" },
  phone: String,
  active: { type: Boolean, default: true },
});
const CampaignSchema = new mongoose.Schema({
  title: String,
  description: String,
  amountPerPerson: Number,
  deadline: Date,
  status: { type: String, default: "open" },
  createdBy: mongoose.Schema.Types.ObjectId,
});
const ContributionSchema = new mongoose.Schema({
  campaign: mongoose.Schema.Types.ObjectId,
  user: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: { type: String, default: "pending" },
  payMethod: { type: String, default: "cash" },
  proofImage: String,
  note: String,
  paidAt: Date,
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
});
const TransactionSchema = new mongoose.Schema({
  type: String,
  amount: Number,
  description: String,
  category: String,
  image: String,
  contribution: mongoose.Schema.Types.ObjectId,
  campaign: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
});
const SettingsSchema = new mongoose.Schema({ key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed });

const User = mongoose.model("User", UserSchema);
const Campaign = mongoose.model("Campaign", CampaignSchema);
const Contribution = mongoose.model("Contribution", ContributionSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);
const Settings = mongoose.model("Settings", SettingsSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Da ket noi MongoDB. Dang xoa du lieu cu...");
  await Promise.all([User.deleteMany({}), Campaign.deleteMany({}), Contribution.deleteMany({}), Transaction.deleteMany({})]);

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const admin = await User.create({
    name: "Thu Quy",
    studentId: "ADMIN",
    email: "thuquy@class.edu",
    password: hash("admin123"),
    role: "admin",
    phone: "0901234567",
  });

  const members = [];
  for (let i = 0; i < 5; i++) {
    const m = await User.create({
      name: `Sinh Vien ${100 + i}`,
      studentId: `SV${100 + i}`,
      email: `sv${100 + i}@class.edu`,
      password: hash("123456"),
      role: "member",
    });
    members.push(m);
  }

  const campaign = await Campaign.create({
    title: "Quy hoc ky I - 2026",
    description: "Thu quy hoat dong lop hoc ky 1",
    amountPerPerson: 100000,
    deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    status: "open",
    createdBy: admin._id,
  });

  // Tao contribution cho moi thanh vien (moi nguoi 1 dong trong dot thu)
  let totalIn = 0;
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    // 2 nguoi dau da nop (approved), nguoi thu 3 tu chuyen khoan cho duyet (self_pending), con lai chua nop
    let status = "pending";
    let payMethod = "cash";
    let paidAt = null;
    if (i === 0 || i === 1) {
      status = "approved";
      paidAt = new Date();
    } else if (i === 2) {
      status = "self_pending"; // v100: da tu chuyen khoan qua QR, cho duyet
      payMethod = "bank_transfer";
      paidAt = new Date();
    }
    const c = await Contribution.create({
      campaign: campaign._id,
      user: m._id,
      amount: campaign.amountPerPerson,
      status,
      payMethod,
      paidAt,
      approvedAt: status === "approved" ? new Date() : null,
      approvedBy: status === "approved" ? admin._id : null,
      note: status === "self_pending" ? "Da chuyen khoan qua QR VietQR" : "",
    });
    if (status === "approved") {
      await Transaction.create({
        type: "in",
        amount: c.amount,
        description: `Thu quy - ${m.name} (${m.studentId}) - ${campaign.title}`,
        category: "Thu quy",
        contribution: c._id,
        campaign: campaign._id,
        createdBy: admin._id,
        date: new Date(),
      });
      totalIn += c.amount;
    }
  }

  // Mot khoan chi mau
  if (totalIn > 0) {
    await Transaction.create({
      type: "out",
      amount: 50000,
      description: "Mua phan thiet bi lop hoc",
      category: "Tien hoc tap",
      createdBy: admin._id,
      date: new Date(),
    });
  }

  // Cau hinh mac dinh thong tin ngan hang quy (v100)
  await Settings.findOneAndUpdate(
    { key: "fund_bank" },
    {
      key: "fund_bank",
      value: {
        bin: process.env.FUND_BANK_BIN || "970422",
        accountNumber: process.env.FUND_BANK_ACCOUNT || "0123456789",
        accountName: process.env.FUND_BANK_NAME || "QUY LOP",
        accountHolder: process.env.FUND_BANK_HOLDER || "",
      },
    },
    { upsert: true }
  );

  console.log("✅ Seed xong!");
  console.log("   Admin : thuquy@class.edu / admin123");
  console.log("   Member: sv100@class.edu -> sv104@class.edu / 123456");
  console.log("   (sv102 dang o trang thai self_pending - da tu chuyen khoan qua QR cho duyet)");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
