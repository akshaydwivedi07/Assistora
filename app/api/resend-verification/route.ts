import { NextResponse } from "next/server";
import { createRawToken, hashToken, normalizeEmail } from "@/lib/authSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";

const genericMessage = "If an unverified account exists with this email, a verification link has been sent.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const limited = await enforceRateLimit(
      request.headers,
      [
        { scope: "resend-verification-ip", identifierType: "ip", limit: 10, windowMs: 60 * 60_000 },
        { scope: "resend-verification-email", identifierType: "email", limit: 3, windowMs: 60 * 60_000 },
      ],
      email
    );
    if (limited) return limited;

    if (email && email.length <= 254) {
      const user = await User.findOne({ email });
      if (user && !user.emailVerified) {
        await VerificationToken.deleteMany({ userId: user._id });
        const token = createRawToken();
        await VerificationToken.create({
          userId: user._id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
        });
        try {
          await sendVerificationEmail({ email, name: user.name, token });
        } catch (error) {
          await VerificationToken.deleteMany({ userId: user._id });
          console.error("Verification email delivery failed", error instanceof Error ? error.name : "unknown error");
        }
      }
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Resend verification failed", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ message: genericMessage });
  }
}