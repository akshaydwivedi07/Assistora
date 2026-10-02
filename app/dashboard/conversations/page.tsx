"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  MessageSquare,
  CheckCircle2,
  Clock3,
  User,
  ArrowLeft,
  Check,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

type ConversationSummary = {
  id: string;
  customerId: string;
  customerName: string;
  status: "open" | "resolved";
  messageCount: number;
  lastMessage: string;
  lastMessageRole:
    | "user"
    | "assistant"
    | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ConversationDetail = {
  id: string;
  customerId: string;
  customerName: string;
  status: "open" | "resolved";
  messages: Message[];
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

type Filter =
  | "all"
  | "open"
  | "resolved";

export default function ConversationsPage() {
  const [
    conversations,
    setConversations,
  ] = useState<
    ConversationSummary[]
  >([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] =
    useState<ConversationDetail | null>(
      null
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<Filter>("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // --------------------------------
  // Load conversations
  // --------------------------------

  const loadConversations =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (
          search.trim()
        ) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (
          filter !== "all"
        ) {
          params.set(
            "status",
            filter
          );
        }

        const response =
          await fetch(
            `/api/conversations?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load conversations."
          );
        }

        setConversations(
          result.conversations ||
            []
        );
      } catch (error) {
        console.error(
          "Conversations load error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load conversations."
        );
      } finally {
        setLoading(false);
      }
    };

  // --------------------------------
  // Initial load
  // --------------------------------

  useEffect(() => {
    loadConversations();
  }, [filter]);

  // --------------------------------
  // Search debounce
  // --------------------------------

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        loadConversations();
      }, 350);

    return () =>
      clearTimeout(
        timeout
      );
  }, [search]);

  // --------------------------------
  // Load conversation detail
  // --------------------------------

  const openConversation =
    async (
      id: string
    ) => {
      try {
        setDetailLoading(
          true
        );
        setError("");

        const response =
          await fetch(
            `/api/conversations/${id}`,
            {
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load conversation."
          );
        }

        setSelectedConversation(
          result.conversation
        );
      } catch (error) {
        console.error(
          "Conversation detail error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load conversation."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // --------------------------------
  // Update status
  // --------------------------------

  const updateStatus =
    async (
      id: string,
      status:
        | "open"
        | "resolved"
    ) => {
      try {
        setUpdating(true);
        setError("");

        const response =
          await fetch(
            `/api/conversations/${id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                status,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to update conversation."
          );
        }

        // Update list
        setConversations(
          (current) =>
            current.map(
              (
                conversation
              ) =>
                conversation.id ===
                id
                  ? {
                      ...conversation,
                      status,
                    }
                  : conversation
            )
        );

        // Update detail
        setSelectedConversation(
          (current) =>
            current &&
            current.id === id
              ? {
                  ...current,
                  status,
                }
              : current
        );

        // If current filter no longer includes it,
        // refresh the list.
        if (
          filter !== "all" &&
          filter !== status
        ) {
          await loadConversations();
        }
      } catch (error) {
        console.error(
          "Conversation status error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to update conversation."
        );
      } finally {
        setUpdating(false);
      }
    };

  // --------------------------------
  // Stats
  // --------------------------------

  const stats =
    useMemo(() => {
      const open =
        conversations.filter(
          (item) =>
            item.status ===
            "open"
        ).length;

      const resolved =
        conversations.filter(
          (item) =>
            item.status ===
            "resolved"
        ).length;

      return {
        total:
          conversations.length,
        open,
        resolved,
      };
    }, [conversations]);

  // --------------------------------
  // Helpers
  // --------------------------------

  const formatTime = (
    date: string
  ) => {
    const value =
      new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    return value.toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getInitial = (
    name: string
  ) => {
    return (
      name
        ?.trim()
        .charAt(0)
        .toUpperCase() ||
      "V"
    );
  };

  // --------------------------------
  // Detail view
  // --------------------------------

  if (
    selectedConversation
  ) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        {/* Header */}

        <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setSelectedConversation(
                  null
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft
                size={17}
              />
            </button>

            <div>
              <p className="text-xs text-slate-400">
                Conversations
              </p>

              <h1 className="text-lg font-semibold">
                {
                  selectedConversation.customerName
                }
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge
              status={
                selectedConversation.status
              }
            />

            {selectedConversation.status ===
            "open" ? (
              <button
                onClick={() =>
                  updateStatus(
                    selectedConversation.id,
                    "resolved"
                  )
                }
                disabled={
                  updating
                }
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check
                  size={16}
                />

                {updating
                  ? "Updating..."
                  : "Resolve"}
              </button>
            ) : (
              <button
                onClick={() =>
                  updateStatus(
                    selectedConversation.id,
                    "open"
                  )
                }
                disabled={
                  updating
                }
                className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <RotateCcw
                  size={16}
                />

                {updating
                  ? "Updating..."
                  : "Reopen"}
              </button>
            )}
          </div>
        </header>

        {/* Content */}

        <div className="mx-auto max-w-5xl p-6 lg:p-8">
          {/* Customer info */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
                {getInitial(
                  selectedConversation.customerName
                )}
              </div>

              <div>
                <p className="font-semibold">
                  {
                    selectedConversation.customerName
                  }
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Customer ID:{" "}
                  {
                    selectedConversation.customerId
                  }
                </p>
              </div>

              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">
                  Started
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatTime(
                    selectedConversation.createdAt
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}

          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold">
                Conversation
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {
                  selectedConversation.messages
                    .length
                }{" "}
                messages
              </p>
            </div>

            <div className="space-y-5 p-6">
              {selectedConversation
                .messages.length ===
              0 ? (
                <div className="py-12 text-center">
                  <MessageSquare
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    No messages yet.
                  </p>
                </div>
              ) : (
                selectedConversation.messages.map(
                  (
                    message,
                    index
                  ) => (
                    <div
                      key={
                        message._id ||
                        index
                      }
                      className={`flex ${
                        message.role ===
                        "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.role ===
                          "user"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                            message.role ===
                            "user"
                              ? "rounded-br-md bg-indigo-600 text-white"
                              : "rounded-bl-md bg-slate-100 text-slate-700"
                          }`}
                        >
                          {message.content}
                        </div>

                        {message.createdAt && (
                          <p
                            className={`mt-1 text-[10px] text-slate-400 ${
                              message.role ===
                              "user"
                                ? "text-right"
                                : ""
                            }`}
                          >
                            {formatTime(
                              message.createdAt
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------
  // Main conversations view
  // --------------------------------

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}

      <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <div>
          <p className="text-xs text-slate-400">
            Workspace
          </p>

          <h1 className="text-lg font-semibold">
            Conversations
          </h1>
        </div>

        <button
          onClick={
            loadConversations
          }
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
        </button>
      </header>

      {/* Content */}

      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            CUSTOMER SUPPORT
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Customer conversations
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review customer conversations,
            track open requests and resolve
            completed conversations.
          </p>
        </div>

        {/* Error */}

        {error && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
              className="font-medium hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ConversationStat
            label="Total"
            value={stats.total}
            icon={MessageSquare}
          />

          <ConversationStat
            label="Open"
            value={stats.open}
            icon={Clock3}
          />

          <ConversationStat
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
          />
        </div>

        {/* Toolbar */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search customer or conversation..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Filters */}

            <div className="flex rounded-xl bg-slate-100 p-1">
              {(
                [
                  "all",
                  "open",
                  "resolved",
                ] as Filter[]
              ).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() =>
                      setFilter(
                        item
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${
                      filter ===
                      item
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Conversation list */}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[
                1,
                2,
                3,
                4,
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-4 p-5"
                  >
                    <div className="h-11 w-11 rounded-full bg-slate-200" />

                    <div className="flex-1">
                      <div className="h-4 w-40 rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-72 rounded bg-slate-100" />
                    </div>

                    <div className="h-6 w-16 rounded-full bg-slate-100" />
                  </div>
                )
              )}
            </div>
          ) : detailLoading ? (
            <div className="p-12 text-center">
              Loading conversation...
            </div>
          ) : conversations.length ===
            0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <MessageSquare
                  size={25}
                />
              </div>

              <p className="mt-4 text-sm font-semibold">
                {search
                  ? "No conversations found"
                  : filter ===
                    "open"
                  ? "No open conversations"
                  : filter ===
                    "resolved"
                  ? "No resolved conversations"
                  : "No conversations yet"}
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                {search
                  ? "Try another search term."
                  : "Customer conversations will appear here when visitors chat with your AI agent."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map(
                (
                  conversation
                ) => (
                  <button
                    key={
                      conversation.id
                    }
                    onClick={() =>
                      openConversation(
                        conversation.id
                      )
                    }
                    className="group flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50"
                  >
                    {/* Avatar */}

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600">
                      {getInitial(
                        conversation.customerName
                      )}
                    </div>

                    {/* Main */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {
                            conversation.customerName
                          }
                        </p>

                        {conversation.status ===
                          "open" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {conversation.lastMessage ||
                          "No messages"}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>
                          {
                            conversation.messageCount
                          }{" "}
                          messages
                        </span>

                        <span>
                          ·
                        </span>

                        <span>
                          {formatTime(
                            conversation.lastMessageAt
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Status */}

                    <div className="hidden shrink-0 sm:block">
                      <StatusBadge
                        status={
                          conversation.status
                        }
                      />
                    </div>

                    {/* Arrow */}

                    <div className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">
                      →
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------
// Conversation Stat
// --------------------------------

function ConversationStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

// --------------------------------
// Status Badge
// --------------------------------

function StatusBadge({
  status,
}: {
  status:
    | "open"
    | "resolved";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        status ===
        "open"
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {status ===
      "open"
        ? "Open"
        : "Resolved"}
    </span>
  );
}