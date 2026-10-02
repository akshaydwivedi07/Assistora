"use client";

import { FormEvent, useEffect, useState } from "react";

export type WidgetConfig = {
  enabled: boolean;
  primaryColor: string;
  position: "bottom-right" | "bottom-left";
  agentName: string;
  avatarUrl: string;
  welcomeMessage: string;
  buttonSize: "small" | "medium" | "large";
  borderRadius: "small" | "medium" | "large";
  showBranding: boolean;
};

export const defaultWidgetConfig: WidgetConfig = {
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

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetProps = {
  slug: string;
  compact?: boolean;
  config?: Partial<WidgetConfig>;
};

const radiusMap = {
  small: "18px",
  medium: "22px",
  large: "28px",
};

const buttonSizeMap = {
  small: 42,
  medium: 52,
  large: 60,
};

export default function ChatWidget({ slug, compact = false, config = defaultWidgetConfig }: ChatWidgetProps) {
  const resolvedConfig: WidgetConfig = {
    ...defaultWidgetConfig,
    ...config,
  };

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: resolvedConfig.welcomeMessage },
  ]);
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState(resolvedConfig.agentName);
  const [conversationId, setConversationId] = useState("");

  useEffect(() => {
    setAgentName(resolvedConfig.agentName);
    setMessages((previous) => {
      if (!previous.length) {
        return [{ role: "assistant", content: resolvedConfig.welcomeMessage }];
      }

      const hasWelcomeOnly = previous.length === 1 && previous[0]?.role === "assistant" && !previous[0]?.content.trim();

      if (hasWelcomeOnly) {
        return [{ role: "assistant", content: resolvedConfig.welcomeMessage }];
      }

      return previous;
    });
  }, [resolvedConfig.agentName, resolvedConfig.welcomeMessage]);

  if (!resolvedConfig.enabled) {
    return null;
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();

    if (!input.trim() || loading || !slug) {
      return;
    }

    const question = input.trim();
    setInput("");
    setMessages((previous) => [...previous, { role: "user", content: question }]);
    setLoading(true);

    try {
      const response = await fetch("/api/public/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          question,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to get response.");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.agent?.name) {
        setAgentName(data.agent.name);
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer || "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      console.error("Public chat error:", error);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const avatarContent = resolvedConfig.avatarUrl ? (
    <img src={resolvedConfig.avatarUrl} alt={agentName} className="h-11 w-11 rounded-full object-cover" />
  ) : (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
      {agentName.charAt(0).toUpperCase() || "A"}
    </div>
  );

  return (
    <div
      className={`flex w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl ${compact ? "h-full" : "h-140 max-w-md"}`}
      style={{
        borderRadius: radiusMap[resolvedConfig.borderRadius],
      }}
    >
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4" style={{ background: resolvedConfig.primaryColor }}>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-white">
          {avatarContent}
        </div>

        <div className="flex-1">
          <h1 className="text-sm font-semibold text-white">{agentName}</h1>
          <div className="mt-1 flex items-center gap-2 text-white/80">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs">Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] p-5">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "rounded-br-md text-white"
                  : "rounded-bl-md border border-gray-200 bg-white text-gray-700"
              }`}
              style={
                message.role === "user"
                  ? { background: resolvedConfig.primaryColor }
                  : undefined
              }
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 focus-within:border-gray-400" style={{ borderColor: `${resolvedConfig.primaryColor}66` }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex shrink-0 items-center justify-center rounded-xl text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              width: `${buttonSizeMap[resolvedConfig.buttonSize]}px`,
              height: `${buttonSizeMap[resolvedConfig.buttonSize]}px`,
              background: resolvedConfig.primaryColor,
            }}
          >
            →
          </button>
        </div>

        {resolvedConfig.showBranding ? (
          <p className="mt-3 text-center text-[11px] text-gray-400">Powered by Assistora AI</p>
        ) : null}
      </form>
    </div>
  );
}