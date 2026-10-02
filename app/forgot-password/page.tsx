"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.status === 429) throw new Error(data.message);
      setMessage(data.message || "If an account exists with this email, a reset link has been sent.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">Back to login</Link>
        <h1 className="mt-8 text-3xl font-bold text-slate-950">Forgot password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter your account email and we’ll send a reset link if an account matches.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-800">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-indigo-500" />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </section>
    </main>
  );
}