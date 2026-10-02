"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import ChatWidget, { type WidgetConfig } from "@/app/components/ChatWidget";

const defaultConfig: WidgetConfig = {
  enabled: true,
  primaryColor: "#6366F1",
  position: "bottom-right",
  agentName: "Assistora AI",
  avatarUrl: "",
  welcomeMessage: "Hi! How can I help you today?",
  buttonSize: "medium",
  borderRadius: "large",
  showBranding: true,
};

export default function WidgetPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState("");
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    let ignore = false;

    async function loadConfig() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/public/widget/${encodeURIComponent(slug)}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Unable to load widget configuration.");
        }

        const widgetConfig = result?.data?.widget ?? result?.widget ?? defaultConfig;

        if (!ignore) {
          setConfig({
            enabled: widgetConfig.enabled !== false,
            primaryColor: widgetConfig.primaryColor || defaultConfig.primaryColor,
            position: widgetConfig.position === "bottom-left" ? "bottom-left" : "bottom-right",
            agentName: widgetConfig.agentName || defaultConfig.agentName,
            avatarUrl: widgetConfig.avatarUrl || "",
            welcomeMessage: widgetConfig.welcomeMessage || defaultConfig.welcomeMessage,
            buttonSize: widgetConfig.buttonSize || defaultConfig.buttonSize,
            borderRadius: widgetConfig.borderRadius || defaultConfig.borderRadius,
            showBranding: widgetConfig.showBranding !== false,
          });
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load widget configuration.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      ignore = true;
    };
  }, [slug]);

  if (!slug || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <p className="text-sm text-gray-500">Loading widget...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-sm rounded-2xl border border-red-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">Widget unavailable</p>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const isEmbedded = searchParams.get("embed") === "1";

  return (
    <main className={`w-full ${isEmbedded ? "h-screen bg-transparent p-2" : "min-h-screen bg-[#f4f6f8] p-4 md:p-8"}`}>
      <div className={isEmbedded ? "h-full" : "mx-auto max-w-md pt-16"}>
        <ChatWidget slug={slug} compact={isEmbedded} config={config} />
      </div>
    </main>
  );
}