import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "token";

export function normalizeRole(role) {
  return role === "student" ? "member" : role;
}

export function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}
export function comparePassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: normalizeRole(user.role), name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function setAuthCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

// Lay user hien tai tu cookie (dung trong server component / route handler)
export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return { ...payload, role: normalizeRole(payload.role) }; // { sub, email, role, name }
}

export { COOKIE_NAME };
