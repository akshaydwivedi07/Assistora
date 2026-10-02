import { NextResponse } from "next/server";
import { createRawToken, hashToken, normalizeEmail } from "@/lib/authSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";
import PasswordResetToken from "@/models/PasswordResetToken";
import User from "@/models/User";

const genericMessage = "If an account exists with this email, a password reset link has been sent.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const limited = await enforceRateLimit(
      request.headers,
      [
        { scope: "forgot-password-ip", identifierType: "ip", limit: 10, windowMs: 60 * 60_000 },
        { scope: "forgot-password-email", identifierType: "email", limit: 3, windowMs: 60 * 60_000 },
      ],
      email
    );
    if (limited) return limited;

    if (email && email.length <= 254) {
      const user = await User.findOne({ email }).select("+password");
      if (user?.password) {
        await PasswordResetToken.deleteMany({ userId: user._id });
        const token = createRawToken();
        await PasswordResetToken.create({
          userId: user._id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60_000),
        });
        try {
          await sendPasswordResetEmail({ email, name: user.name, token });
        } catch (error) {
          await PasswordResetToken.deleteMany({ userId: user._id });
          console.error("Password reset email delivery failed", error instanceof Error ? error.name : "unknown error");
        }
      }
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password request failed", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ message: genericMessage });
  }
}