"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Palette, Save, Sparkles } from "lucide-react";

import ChatWidget, { defaultWidgetConfig, type WidgetConfig } from "@/app/components/ChatWidget";

const positionOptions = [
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
];

const sizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const radiusOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export default function DashboardWidgetPage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultWidgetConfig);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadWidget() {
      try {
        setLoading(true);
        setError("");

        const [businessResponse, widgetResponse] = await Promise.all([
          fetch("/api/business"),
          fetch("/api/widget"),
        ]);

        const businessData = await businessResponse.json();
        const widgetData = await widgetResponse.json();

        if (!businessResponse.ok) {
          throw new Error(businessData?.message || "Unable to load business information.");
        }

        if (!widgetResponse.ok) {
          throw new Error(widgetData?.message || "Unable to load widget settings.");
        }

        const businessWidget = widgetData?.widget ?? defaultWidgetConfig;
        const business = businessData?.data?.business ?? businessData?.business ?? {};

        setSlug(business.slug || "");
        setConfig({
          enabled: businessWidget.enabled !== false,
          primaryColor: businessWidget.primaryColor || defaultWidgetConfig.primaryColor,
          position: businessWidget.position === "bottom-left" ? "bottom-left" : "bottom-right",
          agentName: businessWidget.agentName || defaultWidgetConfig.agentName,
          avatarUrl: businessWidget.avatarUrl || "",
          welcomeMessage: businessWidget.welcomeMessage || defaultWidgetConfig.welcomeMessage,
          buttonSize: businessWidget.buttonSize || defaultWidgetConfig.buttonSize,
          borderRadius: businessWidget.borderRadius || defaultWidgetConfig.borderRadius,
          showBranding: businessWidget.showBranding !== false,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load widget settings.");
      } finally {
        setLoading(false);
      }
    }

    loadWidget();
  }, []);

  const saveWidgetSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const response = await fetch("/api/widget", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...config,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to save widget settings.");
      }

      setConfig({
        enabled: result.widget.enabled !== false,
        primaryColor: result.widget.primaryColor || defaultWidgetConfig.primaryColor,
        position: result.widget.position === "bottom-left" ? "bottom-left" : "bottom-right",
        agentName: result.widget.agentName || defaultWidgetConfig.agentName,
        avatarUrl: result.widget.avatarUrl || "",
        welcomeMessage: result.widget.welcomeMessage || defaultWidgetConfig.welcomeMessage,
        buttonSize: result.widget.buttonSize || defaultWidgetConfig.buttonSize,
        borderRadius: result.widget.borderRadius || defaultWidgetConfig.borderRadius,
        showBranding: result.widget.showBranding !== false,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save widget settings.");
    } finally {
      setSaving(false);
    }
  };

  const embedCode = `
<script
  src="${typeof window !== "undefined" ? window.location.origin : "https://your-assistora-domain"}/widget.js"
  data-business="${slug || "YOUR_BUSINESS_SLUG"}">
</script>
  `.trim();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access was blocked. Please copy the code manually.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-44 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <div className="h-155 rounded-2xl bg-white" />
            <div className="h-155 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Widget</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {config.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Customize your embeddable Assistora widget and preview it live.</p>
        </div>

        <button onClick={saveWidgetSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
          <Save size={16} />
          {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Widget settings</h2>
              <p className="text-sm text-gray-500">Update the public chat widget.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-medium text-gray-900">Enable widget</p>
                <p className="text-sm text-gray-500">Let visitors open the chat widget on your website.</p>
              </div>
              <button type="button" onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))} className={`relative h-7 w-12 rounded-full transition ${config.enabled ? "bg-black" : "bg-gray-300"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${config.enabled ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Agent name</label>
              <input value={config.agentName} onChange={(e) => setConfig((prev) => ({ ...prev, agentName: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Primary color</label>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                <input type="color" value={config.primaryColor} onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))} className="h-10 w-12 cursor-pointer border-0 bg-transparent p-0" />
                <input value={config.primaryColor} onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Position</label>
                <select value={config.position} onChange={(e) => setConfig((prev) => ({ ...prev, position: e.target.value as WidgetConfig["position"] }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black">
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Button size</label>
                <select value={config.buttonSize} onChange={(e) => setConfig((prev) => ({ ...prev, buttonSize: e.target.value as WidgetConfig["buttonSize"] }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black">
                  {sizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Border radius</label>
              <select value={config.borderRadius} onChange={(e) => setConfig((prev) => ({ ...prev, borderRadius: e.target.value as WidgetConfig["borderRadius"] }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black">
                {radiusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Avatar URL</label>
              <input value={config.avatarUrl} onChange={(e) => setConfig((prev) => ({ ...prev, avatarUrl: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" placeholder="https://example.com/avatar.png" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Welcome message</label>
              <textarea value={config.welcomeMessage} onChange={(e) => setConfig((prev) => ({ ...prev, welcomeMessage: e.target.value }))} className="min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-medium text-gray-900">Show Assistora branding</p>
                <p className="text-sm text-gray-500">Display the powered-by badge in the chat window.</p>
              </div>
              <button type="button" onClick={() => setConfig((prev) => ({ ...prev, showBranding: !prev.showBranding }))} className={`relative h-7 w-12 rounded-full transition ${config.showBranding ? "bg-black" : "bg-gray-300"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${config.showBranding ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Live preview</h2>
              <p className="text-sm text-gray-500">This matches the actual widget styling.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-slate-50 to-white p-4">
            <ChatWidget slug={slug || "demo-business"} compact={false} config={config} />
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900">Install widget</h3>
              <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">Copy this snippet and paste it before the closing body tag on your website.</p>
            <pre className="overflow-x-auto rounded-xl bg-gray-900 p-3 text-xs text-gray-100">{embedCode}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
