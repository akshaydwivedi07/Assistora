"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";

type RecentConversation = {
  id: string;
  customerName: string;
  status: "open" | "resolved";
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
};

type DashboardData = {
  business: {
    name: string;
    plan: string;
    industry: string;
    website: string;
  };

  agent: {
    enabled: boolean;
    name: string;
  };

  stats: {
    conversations: number;
    resolved: number;
    knowledgeSources: number;
    responseTime: string;
    totalMessages?: number;
  };

  recentConversations: RecentConversation[];
};

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(
          "/api/dashboard/stats"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load dashboard"
          );
        }

        const result =
          await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-200" />

          <div className="mt-3 h-9 w-72 rounded bg-slate-200" />

          <div className="mt-3 h-4 w-96 rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          Unable to load your workspace.
        </div>
      </div>
    );
  }

  const resolutionRate =
    data.stats.conversations > 0
      ? Math.round(
          (data.stats.resolved /
            data.stats.conversations) *
            100
        )
      : 0;

  return (
    <div>
      {/* Header */}
      <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <div>
          <p className="text-xs text-slate-400">
            Workspace
          </p>

          <h1 className="text-lg font-semibold">
            Overview
          </h1>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {data.business.name
            .charAt(0)
            .toUpperCase()}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            AI SUPPORT WORKSPACE
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Good morning,{" "}
            {data.business.name} 👋
          </h2>

          <p className="mt-2 text-slate-500">
            Here's what's happening with your
            customer support.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            title="Conversations"
            value={data.stats.conversations.toString()}
            change="—"
            icon={MessageSquare}
          />

          <Stat
            title="AI resolution"
            value={
              data.stats.conversations > 0
                ? `${resolutionRate}%`
                : "—"
            }
            change="—"
            icon={Zap}
          />

          <Stat
            title="Customers helped"
            value={
              data.stats.conversations > 0
                ? data.stats.conversations.toString()
                : "—"
            }
            change="—"
            icon={Users}
          />

          <Stat
            title="Avg. response"
            value={data.stats.responseTime}
            change="—"
            icon={Activity}
          />
        </div>

        {/* Main */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Agent */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  AI Agent
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Current agent status
                </p>
              </div>

              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  data.agent.enabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    data.agent.enabled
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />

                {data.agent.enabled
                  ? "Live"
                  : "Paused"}
              </span>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Bot size={28} />
              </div>

              <div>
                <p className="font-semibold">
                  {data.agent.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {data.agent.enabled
                    ? "Responding normally"
                    : "Agent is currently paused"}
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              <Mini
                title="Resolution"
                value={
                  data.stats.conversations >
                  0
                    ? `${resolutionRate}%`
                    : "—"
                }
              />

              <Mini
                title="Knowledge"
                value={data.stats.knowledgeSources.toString()}
              />

              <Mini
                title="Plan"
                value={data.business.plan}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Recent activity
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Latest customer interactions.
                </p>
              </div>

              <a
                href="/dashboard/conversations"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600"
              >
                View all
                <ArrowUpRight size={13} />
              </a>
            </div>

            <div className="mt-6">
              {data.recentConversations.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <MessageSquare
                    size={24}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No conversations yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Customer conversations will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentConversations.map(
                    (conversation) => (
                      <a
                        key={conversation.id}
                        href={`/dashboard/conversations?id=${conversation.id}`}
                        className="block rounded-xl border border-slate-100 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                                {conversation.customerName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {
                                    conversation.customerName
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  {
                                    conversation.messageCount
                                  }{" "}
                                  messages
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 line-clamp-1 text-xs text-slate-500">
                              {conversation.lastMessage}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              conversation.status ===
                              "open"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {conversation.status ===
                            "open"
                              ? "Open"
                              : "Resolved"}
                          </span>
                        </div>

                        <div className="mt-3 text-[10px] text-slate-400">
                          {formatDate(
                            conversation.lastMessageAt
                          )}
                        </div>
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Getting started */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">
            Get started with Assistora
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Complete these steps to start
            automating customer support.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Setup
              number="01"
              title="Add knowledge"
              description="Upload FAQs, policies and documents."
              href="/dashboard/knowledge"
            />

            <Setup
              number="02"
              title="Configure AI"
              description="Customize your agent's behavior."
              href="/dashboard/agent"
            />

            <Setup
              number="03"
              title="Deploy chatbot"
              description="Add Assistora to your website."
              href="/dashboard/settings"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Recently";
  }

  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Stat({
  title,
  value,
  change,
  icon: Icon,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </div>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <p className="text-2xl font-bold">
          {value}
        </p>

        {change !== "—" && (
          <span className="mb-1 text-xs font-semibold text-emerald-600">
            {change}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-400">
        Current workspace
      </p>
    </div>
  );
}

function Mini({
  title,
  value,
}: any) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400">
        {title}
      </p>

      <p className="mt-1 font-semibold capitalize">
        {value}
      </p>
    </div>
  );
}

function Setup({
  number,
  title,
  description,
  href,
}: any) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-100 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
          {number}
        </div>

        <p className="font-medium">
          {title}
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </a>
  );
}