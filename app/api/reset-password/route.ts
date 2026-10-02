import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { hashToken } from "@/lib/authSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";
import PasswordResetToken from "@/models/PasswordResetToken";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const limited = await enforceRateLimit(
      request.headers,
      [{ scope: "reset-password-ip", identifierType: "ip", limit: 10, windowMs: 15 * 60_000 }]
    );
    if (limited) return limited;

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters and no more than 72 bytes." },
        { status: 400 }
      );
    }
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
    }

    await connectDB();
    const tokenHash = hashToken(token);
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const session = await mongoose.startSession();
    let updated = false;
    try {
      await session.withTransaction(async () => {
        const resetToken = await PasswordResetToken.findOne({ tokenHash }).session(session);
        if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) return;

        const user = await User.findById(resetToken.userId).select("+password").session(session);
        if (!user) return;

        resetToken.usedAt = now;
        await resetToken.save({ session });
        user.password = passwordHash;
        await user.save({ session });
        await PasswordResetToken.deleteMany({ userId: user._id }, { session });
        updated = true;
      });
    } finally {
      await session.endSession();
    }

    if (!updated) {
      return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
    }

    return NextResponse.json({ message: "Password updated. You can now log in." });
  } catch (error) {
    console.error("Password reset failed", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ message: "Unable to reset your password. Please try again." }, { status: 500 });
  }
}