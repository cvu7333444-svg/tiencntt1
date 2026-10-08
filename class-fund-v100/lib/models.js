import mongoose from "mongoose";

// ===== User (thanh vien + admin) =====
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    studentId: { type: String, unique: true, sparse: true }, // ma sinh vien (vd: SV100)
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, // bcrypt hash
    role: { type: String, enum: ["admin", "member"], default: "member" },
    phone: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ===== Campaign (dot thu quy) =====
const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // vd: "Quy ky I - hoc ky 1"
    description: String,
    amountPerPerson: { type: Number, required: true, min: 0 }, // so tien moi nguoi phai nop
    deadline: Date,
    status: { type: String, enum: ["open", "closed"], default: "open" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ===== Contribution (muc nop cua 1 sinh vien trong 1 dot thu) =====
const ContributionSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    // v100: trang thai mo rong
    // pending      -> da nop tien mat / cho thu quy xac nhan
    // self_pending -> sinh vien tu chuyen khoan qua QR, cho admin duyet bien lai
    // approved     -> da duyet (da tao transaction thu)
    // rejected     -> tu choi (can nop lai)
    status: {
      type: String,
      enum: ["pending", "self_pending", "approved", "rejected"],
      default: "pending",
    },
    payMethod: { type: String, enum: ["cash", "bank_transfer"], default: "cash" }, // v100
    proofImage: String, // url/base64 anh bien lai / chung tu
    note: String,
    paidAt: Date, // thoi gian sinh vien nop / chuyen khoan
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
ContributionSchema.index({ campaign: 1, user: 1 }, { unique: true });

// ===== Transaction (so quy: thu + chi) =====
const TransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["in", "out"], required: true }, // in = thu, out = chi
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    category: String,
    image: String, // anh hoa don (bat buoc voi khoan chi)
    contribution: { type: mongoose.Schema.Types.ObjectId, ref: "Contribution" }, // lien ket neu la khoan thu tu contribution
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ===== Settings (cau hinh chung, v100: thong tin ngan hang quy) =====
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
export const Contribution =
  mongoose.models.Contribution || mongoose.model("Contribution", ContributionSchema);
export const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
