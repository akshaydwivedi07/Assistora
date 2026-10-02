import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Verification token is missing.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * Hash the raw token received from
     * the verification URL.
     */
    const tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const session = await mongoose.startSession();
    let verified = false;
    const diagnostic: { current: { userId: string; tokenRecordId: string; expiresAt: Date } | null } = { current: null };
    try {
      await session.withTransaction(async () => {
        const verificationToken = await VerificationToken.findOne({ tokenHash }).session(session);
        if (!verificationToken) return;

        diagnostic.current = {
          userId: verificationToken.userId.toString(),
          tokenRecordId: verificationToken._id.toString(),
          expiresAt: verificationToken.expiresAt,
        };
        const user = await User.findById(verificationToken.userId).session(session);
        if (!user) return;

        if (verificationToken.usedAt) {
          verified = user.emailVerified;
          return;
        }

        const now = new Date();
        if (verificationToken.expiresAt <= now) return;

        user.emailVerified = true;
        user.emailVerifiedAt = now;
        await user.save({ session });

        verificationToken.usedAt = now;
        await verificationToken.save({ session });
        verified = true;
      });
    } finally {
      await session.endSession();
    }

    if (!verified) {
      console.warn("Email verification token rejected", {
        userId: diagnostic.current?.userId,
        tokenRecordId: diagnostic.current?.tokenRecordId,
        tokenLength: token.length,
        tokenHashPrefix: tokenHash.slice(0, 12),
        expired: diagnostic.current ? diagnostic.current.expiresAt <= new Date() : null,
      });
      return NextResponse.json(
        { success: false, message: "This verification link is invalid or has expired." },
        { status: 400 }
      );
    }

    console.info("Email verified successfully", {
      userId: diagnostic.current?.userId,
      tokenRecordId: diagnostic.current?.tokenRecordId,
      tokenLength: token.length,
      tokenHashPrefix: tokenHash.slice(0, 12),
      expired: false,
    });
    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Email verification error", error instanceof Error ? error.name : "unknown error");

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while verifying your email.",
      },
      { status: 500 }
    );
  }
}