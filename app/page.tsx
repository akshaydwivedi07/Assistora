"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Moon,
  Send,
  Sparkles,
  Sun,
  Upload,
  Zap,
} from "lucide-react";

export default function Home() {
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-500 ${dark ? "bg-[#08090d] text-white" : "bg-white text-slate-950"
        }`}
    >
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={`absolute left-[10%] top-[10%] h-72 w-72 rounded-full blur-3xl transition-opacity duration-1000 ${dark ? "bg-indigo-600/10" : "bg-indigo-400/10"
            }`}
        />

        <div
          className={`absolute right-[5%] top-[40%] h-96 w-96 rounded-full blur-3xl transition-opacity duration-1000 ${dark ? "bg-purple-600/10" : "bg-purple-400/10"
            }`}
        />
      </div>

      {/* Navbar */}
      <nav
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-500 ${dark
          ? "border-white/10 bg-[#08090d]/80"
          : "border-slate-100 bg-white/80"
          }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <button
            onClick={() => scrollTo("home")}
            className="group text-2xl font-bold tracking-tight"
          >
            Assistora
            <span className="text-indigo-600 transition-colors duration-300 group-hover:text-purple-500">
              .
            </span>
          </button>

          {/* Navigation */}
          <div className="hidden items-center gap-8 text-sm md:flex">
            {[
              ["Features", "features"],
              ["How it works", "how-it-works"],
              ["Pricing", "pricing"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`relative py-2 transition-colors duration-300 ${dark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-950"
                  }`}
              >
                {label}

                <span className="absolute bottom-0 left-0 h-px w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${dark
                ? "border-white/10 bg-white/5 text-yellow-300 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/login"
              className={`hidden px-4 py-2 text-sm font-medium transition-colors md:block ${dark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-950"
                }`}
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-600/20"
            >
              Get started

              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="home"
        className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-28 pt-24"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Hero content */}
          <div
            className={`transition-all duration-1000 ${loaded
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
              }`}
          >
            <div
              className={`mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur transition-all duration-500 hover:-translate-y-0.5 ${dark
                ? "border-indigo-400/20 bg-indigo-500/10 text-indigo-300"
                : "border-indigo-100 bg-indigo-50 text-indigo-700"
                }`}
            >
              <Sparkles size={15} />
              AI customer support for modern businesses
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Your business deserves a{" "}
              <span className="bg-linear-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                smarter support agent.
              </span>
            </h1>

            <p
              className={`mt-7 max-w-xl text-lg leading-8 transition-colors duration-500 ${dark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Upload your FAQs, products, policies and documents.
              Assistora learns your business and answers customer questions
              automatically.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-600/20 active:translate-y-0"
              >
                Create your AI agent

                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <button
                onClick={() => scrollTo("how-it-works")}
                className={`rounded-xl border px-6 py-3.5 font-semibold transition-all duration-300 hover:-translate-y-0.5 ${dark
                  ? "border-white/10 hover:bg-white/5"
                  : "border-slate-200 hover:bg-slate-50"
                  }`}
              >
                See how it works
              </button>
            </div>

            <div
              className={`mt-8 flex flex-wrap gap-5 text-sm ${dark ? "text-slate-500" : "text-slate-500"
                }`}
            >
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-indigo-600" />
                No coding
              </span>

              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-indigo-600" />
                Train with your data
              </span>

              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-indigo-600" />
                Deploy in minutes
              </span>
            </div>
          </div>

          {/* Chat demo */}
          <div
            className={`transition-all delay-150 duration-1000 ${loaded
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
              }`}
          >
            <div
              className={`group relative rounded-3xl border p-4 shadow-2xl transition-all duration-500 hover:-translate-y-2 ${dark
                ? "border-white/10 bg-white/3 shadow-black/40"
                : "border-slate-200 bg-slate-50 shadow-slate-200/60"
                }`}
            >
              <div
                className={`rounded-2xl shadow-sm transition-colors duration-500 ${dark ? "bg-[#11131a]" : "bg-white"
                  }`}
              >
                {/* Chat header */}
                <div
                  className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-white/10" : "border-slate-100"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                      <Bot size={20} />
                    </div>

                    <div>
                      <div className="font-semibold">Assistora AI</div>

                      <div className="flex items-center gap-1.5 text-xs text-green-500">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        Online
                      </div>
                    </div>
                  </div>

                  <Sparkles size={17} className="text-indigo-500" />
                </div>

                {/* Messages */}
                <div className="space-y-5 p-6">
                  <div className="ml-auto max-w-xs rounded-2xl rounded-br-md bg-slate-950 p-4 text-sm text-white transition-transform duration-300 hover:-translate-x-1">
                    Can I return my order after 15 days?
                  </div>

                  <div
                    className={`max-w-sm rounded-2xl rounded-bl-md p-4 text-sm leading-6 transition-colors duration-500 ${dark
                      ? "bg-white/5 text-slate-300"
                      : "bg-slate-100 text-slate-700"
                      }`}
                  >
                    Yes! According to your return policy, you can return
                    eligible products within 30 days of delivery.
                    <br />
                    <br />
                    Would you like me to help you start a return?
                  </div>

                  {/* Typing */}
                  <div className="flex gap-1.5 px-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>

                {/* Input */}
                <div
                  className={`border-t p-4 ${dark ? "border-white/10" : "border-slate-100"
                    }`}
                >
                  <div
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${dark
                      ? "border-white/10 text-slate-500"
                      : "border-slate-200 text-slate-400"
                      }`}
                  >
                    <span>Ask anything...</span>

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <Send size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className={`scroll-mt-24 border-y transition-colors duration-500 ${dark
          ? "border-white/10 bg-white/2"
          : "border-slate-100 bg-slate-50"
          }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-28">
          <div className="max-w-2xl">
            <p className="font-semibold tracking-wide text-indigo-600">
              POWERFUL BY DEFAULT
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Everything your support team needs.
            </h2>

            <p
              className={`mt-4 text-lg ${dark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              One AI agent that understands your business and helps your
              customers 24/7.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Train on your knowledge",
                description:
                  "Upload PDFs, FAQs, product catalogs, policies and website content.",
              },
              {
                icon: Zap,
                title: "Answer instantly",
                description:
                  "Your AI agent finds the right information and responds in seconds.",
              },
              {
                icon: Globe,
                title: "Works 24/7",
                description:
                  "Handle customer questions around the clock without increasing your team.",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className={`group rounded-2xl border p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${dark
                    ? "border-white/10 bg-white/3 hover:border-indigo-500/30 hover:shadow-black/20"
                    : "border-slate-200 bg-white hover:border-indigo-100 hover:shadow-slate-200/60"
                    }`}
                  style={{
                    transitionDelay: `${index * 70}ms`,
                  }}
                >
                  <div
                    className={`mb-6 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 ${dark
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "bg-indigo-50 text-indigo-600"
                      }`}
                  >
                    <Icon size={20} />
                  </div>

                  <h3 className="text-xl font-semibold">{feature.title}</h3>

                  <p
                    className={`mt-3 leading-7 ${dark ? "text-slate-400" : "text-slate-600"
                      }`}
                  >
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-indigo-600 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    Learn more
                    <ChevronRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-6 py-28">
          <div className="text-center">
            <p className="font-semibold tracking-wide text-indigo-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              From business knowledge to AI agent.
            </h2>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: Upload,
                title: "Add your knowledge",
                description:
                  "Upload your documents, FAQs, products and policies.",
              },
              {
                number: "02",
                icon: Sparkles,
                title: "Customize your agent",
                description:
                  "Choose its personality, tone and behavior.",
              },
              {
                number: "03",
                icon: Globe,
                title: "Deploy everywhere",
                description:
                  "Add Assistora to your website and start helping customers.",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group relative transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-indigo-600">
                      {step.number}
                    </span>

                    <div
                      className={`h-px flex-1 ${dark ? "bg-white/10" : "bg-slate-200"
                        }`}
                    />
                  </div>

                  <div
                    className={`mt-7 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${dark
                      ? "bg-white/5 text-indigo-400"
                      : "bg-indigo-50 text-indigo-600"
                      }`}
                  >
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold">
                    {step.title}
                  </h3>

                  <p
                    className={`mt-3 leading-7 ${dark ? "text-slate-400" : "text-slate-600"
                      }`}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className={`scroll-mt-24 transition-colors duration-500 ${dark ? "bg-white/2" : "bg-slate-50"
          }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-28">
          <div className="text-center">
            <p className="font-semibold tracking-wide text-indigo-600">
              SIMPLE PRICING
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Start small. Scale as you grow.
            </h2>
          </div>

          <div
            className={`mx-auto mt-16 max-w-md rounded-3xl border p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 ${dark
              ? "border-white/10 bg-[#11131a] shadow-black/30"
              : "border-slate-200 bg-white shadow-slate-200/60"
              }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-indigo-600">STARTER</p>

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                Popular
              </span>
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-bold">₹999</span>
              <span
                className={`pb-1 ${dark ? "text-slate-500" : "text-slate-500"
                  }`}
              >
                /month
              </span>
            </div>

            <p
              className={`mt-4 ${dark ? "text-slate-400" : "text-slate-600"
                }`}
            >
              Everything you need to launch your first AI support agent.
            </p>

            <Link
              href="/signup"
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-600/20"
            >
              Start building

              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <div
              className={`mt-8 space-y-4 text-sm ${dark ? "text-slate-300" : "text-slate-700"
                }`}
            >
              {[
                "1 AI agent",
                "Knowledge base",
                "Website chatbot",
                "1,000 conversations",
                "Analytics",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Check size={12} />
                  </span>

                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 text-center text-white shadow-2xl sm:px-16">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative">
            <Sparkles className="mx-auto text-indigo-400" size={25} />

            <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Give your customers
              <br />
              better support.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-slate-400">
              Build your AI customer support agent with Assistora and deploy
              it in minutes.
            </p>

            <button className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-50 hover:shadow-xl">
              Create your AI agent
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t px-6 py-8 text-center text-sm transition-colors duration-500 ${dark
          ? "border-white/10 text-slate-500"
          : "border-slate-100 text-slate-500"
          }`}
      >
        © 2026 Assistora. AI customer support for every business.
      </footer>
    </main>
  );
}