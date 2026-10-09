import mongoose from "mongoose";

// Cache connection cho serverless (tránh mở nhiều connection liên tiếp)
const globalAny = globalThis;
if (!globalAny._mongoose) globalAny._mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (globalAny._mongoose.conn) return globalAny._mongoose.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI chua duoc cau hinh");
  if (!globalAny._mongoose.promise) {
    globalAny._mongoose.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .catch((error) => {
        globalAny._mongoose.promise = null;
        throw error;
      });
  }
  globalAny._mongoose.conn = await globalAny._mongoose.promise;
  return globalAny._mongoose.conn;
}

export default dbConnect;
