import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import User from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit(
      request.headers,
      [
        {
          scope: "account-password-ip",
          identifierType: "ip",
          limit: 5,
          windowMs: 15 * 60_000,
        },
      ]
    );

    if (limited) return limited;

    const token = (await cookies()).get("assistora_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session expired or invalid." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(newPassword, "utf8") > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_LENGTH} bytes.` },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.userId).select("+password +passwordChangedAt +googleId");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "This account uses Google sign-in. Set a password through account recovery before using password login." },
        { status: 400 }
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: "New password must be different from the current password." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.password = passwordHash;
    user.passwordChangedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
      data: {},
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
