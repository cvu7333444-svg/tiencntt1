// Upload anh: uu tien Vercel Blob, fallback base64 (chi phu hop dev)
export async function uploadImage(dataUrlOrFile, name) {
  // Neu da co token Blob thi push len Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      let blob;
      if (typeof dataUrlOrFile === "string" && dataUrlOrFile.startsWith("data:")) {
        const res = await fetch(dataUrlOrFile);
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = dataUrlOrFile.slice(5, dataUrlOrFile.indexOf(";"));
        blob = await put(`${Date.now()}-${name || "image"}.${mime.split("/")[1] || "png"}`, buf, {
          access: "public",
          contentType: mime,
        });
      } else {
        blob = await put(`${Date.now()}-${name || "image"}`, dataUrlOrFile, { access: "public" });
      }
      return blob.url;
    } catch (e) {
      // fallback xuong base64
    }
  }
  // Fallback: luu base64 (gioi han kich thuoc ~1MB de tranh tran MongoDB)
  if (typeof dataUrlOrFile === "string" && dataUrlOrFile.startsWith("data:")) {
    if (dataUrlOrFile.length > 1_000_000) {
      throw new Error("Anh qua lon, vui long nho hon 1MB hoac bat Vercel Blob");
    }
    return dataUrlOrFile;
  }
  throw new Error("Khong the upload anh");
}
