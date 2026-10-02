import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RateLimit from "@/models/RateLimit";
import { getClientIp, normalizeEmail } from "@/lib/authSecurity";

type RateLimitRule = {
  scope: string;
  identifierType: "ip" | "email" | "ip-email";
  identifier: string;
  limit: number;
  windowMs: number;
};

async function consume(rule: RateLimitRule, now: number) {
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  const identityHash = createHash("sha256")
    .update(`${rule.scope}:${rule.identifier}`)
    .digest("hex");
  const bucket = `${identityHash}:${windowStart}`;

  let record;
  try {
    record = await RateLimit.findOneAndUpdate(
      { bucket },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          expiresAt: new Date(windowStart + rule.windowMs + 60_000),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    record = await RateLimit.findOneAndUpdate(
      { bucket },
      { $inc: { count: 1 } },
      { new: true }
    );
  }

  if (!record || record.count <= rule.limit) return null;
  return Math.max(1, Math.ceil((windowStart + rule.windowMs - now) / 1000));
}

export async function enforceRateLimit(
  headers: Headers,
  rules: Omit<RateLimitRule, "identifier">[],
  email?: string
) {
  await connectDB();
  const ip = getClientIp(headers);
  const now = Date.now();

  for (const rule of rules) {
    const normalizedEmail = normalizeEmail(email || "");
    const identifier =
      rule.identifierType === "email"
        ? normalizedEmail
        : rule.identifierType === "ip-email"
          ? `${ip}:${normalizedEmail}`
          : ip;
    if (!identifier) continue;

    const retryAfter = await consume({ ...rule, identifier }, now);
    if (retryAfter) {
      const response = NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
      response.headers.set("Retry-After", String(retryAfter));
      return response;
    }
  }

  return null;
}