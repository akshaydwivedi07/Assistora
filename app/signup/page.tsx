"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    industry: "",
    website: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed.");
        return;
      }

      router.push("/verify-email?sent=1");
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left side */}
        <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-25 -top-25 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              Assistora<span className="text-indigo-400">.</span>
            </Link>
          </div>

          <div className="relative max-w-lg">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
              <Sparkles size={22} />
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Build your AI support agent in minutes.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              Give Assistora your business knowledge and let AI handle
              repetitive customer questions automatically.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-300">
              {[
                "Train AI on your business knowledge",
                "Answer customers 24/7",
                "No coding required",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                    <Check size={14} />
                  </span>

                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative text-sm text-slate-500">
            © 2026 Assistora
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="text-2xl font-bold tracking-tight"
              >
                Assistora<span className="text-indigo-600">.</span>
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-indigo-600">
                GET STARTED
              </p>

              <h2 className="mt-2 text-4xl font-bold tracking-tight">
                Create your workspace
              </h2>

              <p className="mt-3 text-slate-500">
                Set up your business and start building your AI agent.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <a
                href="/api/auth/google"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-semibold transition hover:bg-slate-50"
              >
                <span aria-hidden="true" className="text-lg font-bold">G</span>
                Continue with Google
              </a>
              <div className="flex items-center gap-4 text-xs uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or create with email
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Your name
                </label>

                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="Akshay"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Work email
                </label>

                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      updateField("password", e.target.value)
                    }
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="my-7 h-px bg-slate-100" />

              <div>
                <p className="text-lg font-semibold">
                  Tell us about your business
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  This helps personalize your AI workspace.
                </p>
              </div>

              {/* Business */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Business name
                </label>

                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    updateField("businessName", e.target.value)
                  }
                  placeholder="Acme Store"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Industry
                </label>

                <select
                  value={form.industry}
                  onChange={(e) =>
                    updateField("industry", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">Select industry</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Travel">Travel</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Website */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Website{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    updateField("website", e.target.value)
                  }
                  placeholder="https://yourbusiness.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating workspace..." : "Create workspace"}

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}