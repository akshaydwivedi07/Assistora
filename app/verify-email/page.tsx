"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const [token] = useState(() => searchParams.get("token"));
  const isNewSignup = searchParams.get("sent") === "1";

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setMessage(isNewSignup ? "We sent a verification link to your inbox." : "Verification token is missing or expired.");
        setLoading(false);
        return;
      }

      window.history.replaceState(null, "", "/verify-email");

      try {
        const response = await fetch(
          "/api/verify-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setMessage(
            data.message ||
              "Email verification failed."
          );
          return;
        }

        setSuccess(true);
        setMessage(
          "Your email has been verified successfully."
        );
      } catch {
        setMessage(
          "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, [token, isNewSignup]);

  const resendVerification = async () => {
    setResending(true);
    setResendMessage("");
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResendMessage(data.message || "If an unverified account exists, a link has been sent.");
    } catch {
      setResendMessage("Unable to send the email right now. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl">
          {loading
            ? "⏳"
            : success
            ? "✓"
            : "!"}
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          {loading
            ? "Verifying your email..."
            : isNewSignup
            ? "Check your inbox"
            : success
            ? "Email verified!"
            : "Verification failed"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message}
        </p>

        {!loading && !success && (
          <div className="mt-6 space-y-3 text-left">
            <label htmlFor="resend-email" className="block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="resend-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={resendVerification}
              disabled={resending || !email}
              className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendMessage && <p role="status" className="text-sm text-slate-600">{resendMessage}</p>}
          </div>
        )}

        {!loading && (
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><VerifyEmailContent /></Suspense>;
}