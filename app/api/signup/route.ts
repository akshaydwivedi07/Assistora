import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Business from "@/models/Business";
import VerificationToken from "@/models/VerificationToken";
import { sendVerificationEmail } from "@/lib/email";
import { createRawToken, hashToken, normalizeEmail } from "@/lib/authSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      password,
      businessName,
      industry,
      website,
    } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof businessName !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !businessName.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        {
          message: "Password must be at least 8 characters and no more than 72 bytes.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const limited = await enforceRateLimit(
      request.headers,
      [
        { scope: "signup-ip", identifierType: "ip", limit: 5, windowMs: 60 * 60_000 },
        { scope: "signup-email", identifierType: "email", limit: 3, windowMs: 60 * 60_000 },
      ],
      normalizedEmail
    );
    if (limited) return limited;

    await connectDB();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return NextResponse.json(
        { message: "If this email can be registered, you will receive the next step by email. You can also log in or reset your password." },
        { status: 201 }
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const slug =
      businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now();

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    try {
      // Create business
      const business =
        await Business.create({
          name: businessName.trim(),
          slug,
          ownerId: user._id,
          industry: industry || "",
          website: website || "",
          supportEmail: normalizedEmail,
          plan: "starter",
        });

      // Link user to business
      user.businessId = business._id;

      await user.save();

      /*
       * Generate secure random verification token.
       */
      const rawToken = createRawToken();

      /*
       * Only the hash is stored in MongoDB.
       */
      const tokenHash = hashToken(rawToken);

      console.info("Verification token created", {
        userId: user._id.toString(),
        tokenLength: rawToken.length,
        tokenHashPrefix: tokenHash.slice(0, 12),
      });

      /*
       * Remove any old verification tokens
       * for this user.
       */
      await VerificationToken.deleteMany({
        userId: user._id,
      });

      /*
       * Token expires after 24 hours.
       */
      const expiresAt =
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        );

      await VerificationToken.create({
        userId: user._id,
        tokenHash,
        expiresAt,
        usedAt: null,
      });

      /*
       * Send raw token by email.
       *
       * The raw token is NEVER stored in DB.
       */
      await sendVerificationEmail({
        email: normalizedEmail,
        name: user.name,
        token: rawToken,
      });

      return NextResponse.json(
        { message: "If this email can be registered, you will receive the next step by email. You can also log in or reset your password." },
        { status: 201 }
      );
    } catch (error) {
      /*
       * Roll back newly created user if
       * business/token/email creation fails.
       */
      await User.deleteOne({
        _id: user._id,
      });

      await Business.deleteOne({
        ownerId: user._id,
      });

      await VerificationToken.deleteMany({
        userId: user._id,
      });

      throw error;
    }
  } catch (error) {
    console.error("Signup failed", error instanceof Error ? error.name : "unknown error");

    return NextResponse.json(
      {
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}