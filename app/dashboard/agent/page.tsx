"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Save,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

const tones = [
  "Friendly",
  "Professional",
  "Casual",
  "Concise",
];

export default function AgentPage() {
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState("Assistora AI");
  const [tone, setTone] = useState("Friendly");
  const [welcome, setWelcome] = useState(
    "Hi! 👋 How can I help you today?"
  );
  const [instructions, setInstructions] = useState(
    "Help customers with questions about products, orders, returns and delivery. If you are unsure, ask for more information or hand the conversation to a human."
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load agent settings
  useEffect(() => {
    async function loadAgent() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/agent");

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Failed to load agent settings."
          );
        }

        const agent = result.agent;

        setEnabled(agent.enabled);
        setName(agent.name);
        setTone(agent.tone);
        setWelcome(agent.welcomeMessage);
        setInstructions(agent.instructions);
      } catch (error) {
        console.error("Agent load error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load agent settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, []);

  // Save agent settings
  const saveAgent = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const response = await fetch("/api/agent", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          name,
          welcomeMessage: welcome,
          tone,
          instructions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to save agent settings."
        );
      }

      // Use values returned by backend
      const agent = result.agent;

      setEnabled(agent.enabled);
      setName(agent.name);
      setWelcome(agent.welcomeMessage);
      setTone(agent.tone);
      setInstructions(agent.instructions);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error("Agent save error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save agent settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-200" />

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <div className="h-32 rounded-2xl bg-gray-200" />
              <div className="h-72 rounded-2xl bg-gray-200" />
              <div className="h-48 rounded-2xl bg-gray-200" />
              <div className="h-72 rounded-2xl bg-gray-200" />
            </div>

            <div className="h-150 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              AI Agent
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                enabled
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {enabled ? "Active" : "Paused"}
            </span>
          </div>

          <p className="mt-1 text-gray-500">
            Configure your AI customer support agent.
          </p>
        </div>

        <button
          onClick={saveAgent}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />

          {saving
            ? "Saving..."
            : saved
            ? "Saved!"
            : "Save changes"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">

        {/* SETTINGS */}
        <div className="space-y-6">

          {/* Agent Status */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                  <Bot size={24} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Agent status
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Allow AI to automatically answer customers.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative h-7 w-12 rounded-full ${
                  enabled ? "bg-black" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    enabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* General */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">
              General settings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configure the identity of your AI agent.
            </p>

            <div className="mt-6 space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Agent name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Welcome message
                </label>

                <textarea
                  rows={3}
                  value={welcome}
                  onChange={(e) => setWelcome(e.target.value)}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          {/* Personality */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />

              <h2 className="font-semibold">
                Personality
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Choose how your AI communicates.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {tones.map((item) => (
                <button
                  key={item}
                  onClick={() => setTone(item)}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    tone === item
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* Instructions */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} />

              <h2 className="font-semibold">
                Agent instructions
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Tell the AI how it should behave.
            </p>

            <textarea
              rows={8}
              value={instructions}
              onChange={(e) =>
                setInstructions(e.target.value)
              }
              className="mt-5 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none focus:border-black"
            />
          </section>
        </div>

        {/* PREVIEW */}
        <div>
          <div className="sticky top-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">

            <div className="bg-black p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <Bot size={20} />
                </div>

                <div>
                  <p className="font-semibold">
                    {name || "Assistora AI"}
                  </p>

                  <p className="text-xs text-gray-300">
                    {enabled ? "● Online" : "● Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-105 space-y-5 bg-gray-50 p-5">

              <div className="flex gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                  <Bot size={15} />
                </div>

                <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white p-3 shadow-sm">
                  <p className="text-sm text-gray-700">
                    {welcome}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-black p-3 text-sm text-white">
                  Where is my order?
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                  <Bot size={15} />
                </div>

                <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white p-3 shadow-sm">
                  <p className="text-sm text-gray-700">
                    I'd be happy to help! Please share your
                    order number and I'll check the status
                    for you.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t p-4">
              <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-400">
                Type a message...
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <Zap size={13} />
                Powered by Assistora
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}