"use client";

import { Suspense, useState } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const querySuccess = searchParams.get("verification") === "sent"
    ? "Check your inbox for a verification link before logging in."
    : "";
  const queryError = searchParams.get("authError") === "google"
    ? "Google sign-in could not be completed. Please try again."
    : "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        setShowResend(response.status === 403);
        return;
      }

      
     

      // Go to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResendLoading(true);
    setSuccess("");
    setError("");
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setSuccess(data.message || "If an unverified account exists, a link has been sent.");
      setShowResend(false);
    } catch {
      setError("Unable to send the email right now. Please try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}
        <div className="hidden bg-[#050510] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              Assistora<span className="text-gray-500">.</span>
            </Link>
          </div>

          <div className="max-w-xl">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              ✨
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Your AI support team is waiting.
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-400">
              Manage your AI agent, knowledge base,
              conversations and customer support from
              one powerful workspace.
            </p>
          </div>

          <p className="text-sm text-gray-500">
            © 2026 Assistora
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">

            {/* Back */}
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
            >
              <ArrowLeft size={16} />
              Back to homepage
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900">
                Log in to Assistora
              </h2>

              <p className="mt-3 text-gray-500">
                Continue managing your AI customer support agent.
              </p>
            </div>

            {/* Error */}
            {(error || queryError) && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error || queryError}
              </div>
            )}
            {(success || querySuccess) && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success || querySuccess}
              </div>
            )}

            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 px-5 py-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <span aria-hidden="true" className="text-lg font-bold">G</span>
              Continue with Google
            </a>
            <div className="my-6 flex items-center gap-4 text-xs uppercase text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or continue with email
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Form */}
            <form
              onSubmit={handleLogin}
              className="space-y-6"
            >

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-4 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Password
                  </label>

                  <Link href="/forgot-password" className="text-sm font-medium text-indigo-700 hover:text-black">
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-200 px-4 py-4 pr-12 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            {showResend && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={resendLoading || !email}
                className="mt-4 w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>
            )}

            {/* Signup */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-700 hover:text-black"
              >
                Create one
              </Link>
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-white" />}><LoginContent /></Suspense>;
}