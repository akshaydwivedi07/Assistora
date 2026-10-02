import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  createSessionCookieResponse,
  normalizeEmail,
} from "@/lib/authSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = body;

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json(
        {
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const limited = await enforceRateLimit(
      request.headers,
      [
        { scope: "login-ip", identifierType: "ip", limit: 30, windowMs: 15 * 60_000 },
        { scope: "login-email", identifierType: "ip-email", limit: 8, windowMs: 15 * 60_000 },
      ],
      normalizedEmail
    );
    if (limited) return limited;

    await connectDB();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user?.password) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          message:
            "Please verify your email before logging in.",
        },
        { status: 403 }
      );
    }

    if (!user.businessId) {
      return NextResponse.json(
        {
          message: "No business is associated with this account.",
        },
        { status: 400 }
      );
    }

    return createSessionCookieResponse(
      user._id.toString(),
      user.businessId.toString(),
      "Login successful."
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}