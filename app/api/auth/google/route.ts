import { randomBytes } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";

const callbackPath = "/api/auth/google/callback";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?authError=google", appUrl));
  }

  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const redirectUri = new URL(callbackPath, appUrl).toString();
  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
  if (!codeChallenge) {
    return NextResponse.redirect(new URL("/login?authError=google", appUrl));
  }
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  for (const [name, value] of [["assistora_oauth_state", state], ["assistora_oauth_nonce", nonce], ["assistora_oauth_verifier", codeVerifier]]) {
    response.cookies.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: callbackPath,
    });
  }
  return response;
}