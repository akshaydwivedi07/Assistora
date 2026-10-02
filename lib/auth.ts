import { jwtVerify, SignJWT } from "jose";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is missing in .env.local");
}

const secretKey = new TextEncoder().encode(secret);

export async function createSessionToken(data: {
  userId: string;
  businessId: string;
}) {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    const userId = payload.userId as string | undefined;
    const businessId = payload.businessId as string | undefined;

    if (!userId || !businessId) {
      return null;
    }

    await connectDB();
    const user = await User.findById(userId).select("+passwordChangedAt");

    if (!user) {
      return null;
    }

    const issuedAt = Number(payload.iat ?? 0);
    const passwordChangedAt = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;

    if (passwordChangedAt && issuedAt < passwordChangedAt) {
      return null;
    }

    return {
      userId,
      businessId,
    };
  } catch {
    return null;
  }
}