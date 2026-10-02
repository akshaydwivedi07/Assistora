"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState(null, "", "/reset-password");
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "This reset link is invalid or has expired.");
        return;
      }
      setCompleted(true);
      setMessage(data.message);
    } catch {
      setError("Unable to reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">Back to login</Link>
        <h1 className="mt-8 text-3xl font-bold text-slate-950">Choose a new password</h1>
        <p className="mt-3 text-sm text-slate-600">Use at least 8 characters.</p>
        {!token && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">This reset link is invalid or has expired.</p>}
        {completed ? (
          <div className="mt-6 space-y-5">
            <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
            <Link href="/login" className="block rounded-xl bg-slate-950 px-5 py-4 text-center text-sm font-semibold text-white">Go to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-800">New password</label>
              <input id="password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="confirmation" className="mb-2 block text-sm font-medium text-slate-800">Confirm password</label>
              <input id="confirmation" type="password" minLength={8} required autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-indigo-500" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={loading || !token} className="w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><ResetPasswordForm /></Suspense>;
}