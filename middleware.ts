import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is missing");
}

const secretKey = new TextEncoder().encode(secret);

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("assistora_session");

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard")) {
    if (!session?.value) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    try {
      await jwtVerify(session.value, secretKey);

      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(
        new URL("/login", request.url)
      );

      response.cookies.delete("assistora_session");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};