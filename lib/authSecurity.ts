import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";

export function createRawToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createSessionCookieResponse(
  userId: string,
  businessId: string,
  message: string
) {
  const { createSessionToken } = await import("@/lib/auth");
  const token = await createSessionToken({ userId, businessId });
  const response = NextResponse.json({ message });

  response.cookies.set("assistora_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  return (
    headers.get("x-real-ip") ||
    forwardedFor?.split(",")[0]?.trim() ||
    "unknown"
  );
}