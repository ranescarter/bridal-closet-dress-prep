import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const STAFF_COOKIE = "staff_session";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getStaffSessionToken() {
  const password = process.env.STAFF_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password)
    .update("bridal-closet-staff-v1")
    .digest("hex");
}

export function verifyStaffPassword(password: string) {
  const expected = process.env.STAFF_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export function verifyStaffSessionToken(token: string | undefined) {
  if (!token) return false;
  const expected = getStaffSessionToken();
  if (!expected) return false;
  return safeEqual(token, expected);
}

export function staffCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function isStaffAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE)?.value;
  return verifyStaffSessionToken(token);
}

export async function requireStaffAuth() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function setStaffSessionCookie() {
  const token = getStaffSessionToken();
  if (!token) {
    throw new Error("Missing STAFF_PASSWORD");
  }
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, token, staffCookieOptions());
}

export async function clearStaffSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE);
}
