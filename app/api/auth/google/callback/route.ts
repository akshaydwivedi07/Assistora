import { randomBytes, timingSafeEqual } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import User from "@/models/User";

const callbackPath = "/api/auth/google/callback";

function clearOAuthCookies(response: NextResponse) {
  for (const name of ["assistora_oauth_state", "assistora_oauth_nonce", "assistora_oauth_verifier"]) {
    response.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0, path: callbackPath });
  }
  return response;
}

function matchesState(provided: string | null, stored: string | undefined) {
  if (!provided || !stored) return false;
  const supplied = Buffer.from(provided);
  const expected = Buffer.from(stored);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function failed() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return clearOAuthCookies(NextResponse.redirect(new URL("/login?authError=google", appUrl)));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("assistora_oauth_state")?.value;
  const nonce = request.cookies.get("assistora_oauth_nonce")?.value;
  const codeVerifier = request.cookies.get("assistora_oauth_verifier")?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (searchParams.has("error") || !code || !matchesState(state, storedState) || !nonce || !codeVerifier || !clientId || !clientSecret) {
    return failed();
  }

  try {
    const redirectUri = new URL(callbackPath, appUrl).toString();
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await client.getToken({ code, codeVerifier });
    if (!tokens.id_token) return failed();

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const identity = ticket.getPayload();
    if (
      !identity?.sub ||
      !identity.email ||
      identity.email_verified !== true ||
      identity.nonce !== nonce
    ) {
      return failed();
    }

    await connectDB();
    let user = await User.findOne({ googleId: identity.sub }).select("+googleId");
    if (!user) {
      user = await User.findOne({ email: identity.email.toLowerCase() }).select("+googleId");
      if (user?.googleId && user.googleId !== identity.sub) return failed();
    }

    if (!user) {
      const displayName = identity.name?.trim() || identity.email.split("@")[0];
      try {
        user = await User.create({
          name: displayName,
          email: identity.email.toLowerCase(),
          googleId: identity.sub,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        user = await User.findOne({ email: identity.email.toLowerCase() }).select("+googleId");
        if (!user || (user.googleId && user.googleId !== identity.sub)) return failed();
      }
    }

    if (!user.googleId) user.googleId = identity.sub;
    user.emailVerified = true;
    user.emailVerifiedAt ??= new Date();

    if (!user.businessId) {
      const baseSlug = (identity.name || "workspace")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "workspace";
      const business = await Business.create({
        name: `${identity.name || "My"} workspace`,
        slug: `${baseSlug}-${Date.now()}-${randomBytes(3).toString("hex")}`,
        ownerId: user._id,
        supportEmail: user.email,
        plan: "starter",
      });
      user.businessId = business._id;
    }
    await user.save();

    const redirect = NextResponse.redirect(new URL("/dashboard", appUrl));
    const sessionToken = await createSessionToken({
      userId: user._id.toString(),
      businessId: user.businessId.toString(),
    });
    redirect.cookies.set("assistora_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return clearOAuthCookies(redirect);
  } catch {
    console.error("Google OAuth callback failed");
    return failed();
  }
}