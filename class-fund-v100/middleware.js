import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Chi admin moi vao duoc
const ADMIN_ONLY = ["/expense", "/members", "/reports", "/settings/bank"];

// FIX: dung `jose` thay cho `jsonwebtoken` vi middleware chay tren Edge Runtime
// (khong co Node `crypto` ma `jsonwebtoken` yeu cau -> loi build/runtime).
let encodedSecret;
function getSecret() {
  if (!encodedSecret) {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    encodedSecret = new TextEncoder().encode(secret);
  }
  return encodedSecret;
}

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Cho phep ledger va login va api va static
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/ledger") ||
    pathname === "/login" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = getSecret();
  // FIX: neu thieu JWT_SECRET thi khong crash edge, chuyen huong ve login
  if (!secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  // FIX: loai truon luon cac file tinh (icon png/svg, font, favicon...) va /api
  // neu khong request /icon-192.png se bi middleware redirect ve /login (khong co token) -> PWA bi hong.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
