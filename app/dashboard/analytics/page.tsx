"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

type DailyData = {
  date: string;
  label: string;
  conversations: number;
  messages: number;
};

type AnalyticsData = {
  period: {
    start: string;
    end: string;
    days: number;
  };

  summary: {
    totalConversations: number;
    openConversations: number;
    resolvedConversations: number;
    resolutionRate: number;
    totalMessages: number;
    averageMessages: number;
  };

  daily: DailyData[];

  topQuestions: {
    question: string;
    count: number;
  }[];
};

export default function AnalyticsPage() {
  const [data, setData] =
    useState<AnalyticsData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  // --------------------------------
  // Load analytics
  // --------------------------------

  const loadAnalytics =
    async (
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await fetch(
            "/api/analytics",
            {
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load analytics."
          );
        }

        setData(result);
      } catch (error) {
        console.error(
          "Analytics error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load analytics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // --------------------------------
  // Chart max
  // --------------------------------

  const maxConversations =
    useMemo(() => {
      if (!data?.daily.length) {
        return 1;
      }

      return Math.max(
        ...data.daily.map(
          (item) =>
            item.conversations
        ),
        1
      );
    }, [data]);

  const maxMessages =
    useMemo(() => {
      if (!data?.daily.length) {
        return 1;
      }

      return Math.max(
        ...data.daily.map(
          (item) =>
            item.messages
        ),
        1
      );
    }, [data]);

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-5 w-32 rounded bg-slate-200" />

          <div className="mt-3 h-9 w-64 rounded bg-slate-200" />

          <div className="mt-3 h-4 w-96 rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              1,
              2,
              3,
              4,
            ].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-slate-200" />

            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------
  // Error
  // --------------------------------

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            {error ||
              "Unable to load analytics."}

            <button
              onClick={() =>
                loadAnalytics()
              }
              className="ml-4 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}

      <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <div>
          <p className="text-xs text-slate-400">
            Workspace
          </p>

          <h1 className="text-lg font-semibold">
            Analytics
          </h1>
        </div>

        <button
          onClick={() =>
            loadAnalytics(true)
          }
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </header>

      {/* Content */}

      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Intro */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              AI SUPPORT INSIGHTS
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Support analytics
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Real customer support activity
              from the last 30 days.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-500">
            Last 30 days
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* KPI Cards */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Conversations"
            value={data.summary.totalConversations.toString()}
            subtitle="Last 30 days"
            icon={MessageSquare}
          />

          <StatCard
            title="Resolution rate"
            value={`${data.summary.resolutionRate}%`}
            subtitle={`${data.summary.resolvedConversations} resolved`}
            icon={CheckCircle2}
          />

          <StatCard
            title="Total messages"
            value={data.summary.totalMessages.toString()}
            subtitle={`${data.summary.averageMessages} avg. per conversation`}
            icon={Activity}
          />

          <StatCard
            title="Open conversations"
            value={data.summary.openConversations.toString()}
            subtitle="Currently unresolved"
            icon={Clock3}
          />
        </div>

        {/* Charts */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Conversations chart */}

          <ChartCard
            title="Conversations"
            description="Daily customer conversations"
            icon={MessageSquare}
          >
            <div className="mt-8">
              <SimpleBarChart
                data={data.daily}
                valueKey="conversations"
                maxValue={
                  maxConversations
                }
              />
            </div>
          </ChartCard>

          {/* Messages chart */}

          <ChartCard
            title="Messages"
            description="Daily customer and AI messages"
            icon={BarChart3}
          >
            <div className="mt-8">
              <SimpleBarChart
                data={data.daily}
                valueKey="messages"
                maxValue={
                  maxMessages
                }
              />
            </div>
          </ChartCard>
        </div>

        {/* Bottom */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Resolution */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Conversation status
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Current status of conversations in this period.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp
                  size={18}
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{
                    width: `${data.summary.resolutionRate}%`,
                  }}
                />

                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{
                    width: `${100 - data.summary.resolutionRate}%`,
                  }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <StatusMetric
                  label="Resolved"
                  value={
                    data.summary
                      .resolvedConversations
                  }
                  percentage={
                    data.summary
                      .resolutionRate
                  }
                  dotClass="bg-emerald-500"
                />

                <StatusMetric
                  label="Open"
                  value={
                    data.summary
                      .openConversations
                  }
                  percentage={
                    100 -
                    data.summary
                      .resolutionRate
                  }
                  dotClass="bg-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Top questions */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Top customer questions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Most frequently asked questions.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users
                  size={18}
                />
              </div>
            </div>

            <div className="mt-6">
              {data.topQuestions
                .length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <MessageSquare
                    size={22}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No customer questions yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Questions will appear here as customers use your AI agent.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topQuestions.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.question}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-500">
                          {index +
                            1}
                        </div>

                        <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
                          {
                            item.question
                          }
                        </p>

                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                          {item.count}{" "}
                          {item.count ===
                          1
                            ? "time"
                            : "times"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3
                size={18}
              />
            </div>

            <div>
              <h3 className="font-semibold">
                Support overview
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your AI handled{" "}
                <span className="font-semibold text-slate-700">
                  {
                    data.summary.totalConversations
                  }
                </span>{" "}
                conversations containing{" "}
                <span className="font-semibold text-slate-700">
                  {
                    data.summary.totalMessages
                  }
                </span>{" "}
                messages in the last 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------
// Stat card
// --------------------------------

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-5 text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

// --------------------------------
// Chart card
// --------------------------------

function ChartCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={18} />
        </div>
      </div>

      {children}
    </div>
  );
}

// --------------------------------
// Simple chart
// --------------------------------

function SimpleBarChart({
  data,
  valueKey,
  maxValue,
}: {
  data: DailyData[];
  valueKey:
    | "conversations"
    | "messages";
  maxValue: number;
}) {
  const visibleData =
    data.filter(
      (_, index) =>
        index % 3 === 0 ||
        index ===
          data.length - 1
    );

  return (
    <div>
      <div className="flex h-48 items-end gap-1.5">
        {visibleData.map(
          (item) => {
            const value =
              item[valueKey];

            const height =
              maxValue > 0
                ? Math.max(
                    (value /
                      maxValue) *
                      100,
                    value > 0
                      ? 5
                      : 1
                  )
                : 1;

            return (
              <div
                key={item.date}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <div className="relative flex h-full items-end">
                  {value > 0 && (
                    <div
                      className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white group-hover:block"
                    >
                      {value}
                    </div>
                  )}

                  <div
                    className="w-full min-w-1 rounded-t-md bg-indigo-500 transition-all duration-300 group-hover:bg-indigo-600"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="mt-3 flex gap-1.5">
        {visibleData.map(
          (item) => (
            <div
              key={item.date}
              className="flex-1 truncate text-center text-[9px] text-slate-400"
            >
              {item.label}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// --------------------------------
// Status metric
// --------------------------------

function StatusMetric({
  label,
  value,
  percentage,
  dotClass,
}: {
  label: string;
  value: number;
  percentage: number;
  dotClass: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${dotClass}`}
        />

        <span className="text-xs text-slate-500">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-xl font-bold">
          {value}
        </p>

        <p className="text-xs font-semibold text-slate-400">
          {percentage}%
        </p>
      </div>
    </div>
  );
}