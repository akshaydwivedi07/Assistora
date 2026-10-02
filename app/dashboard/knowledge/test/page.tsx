"use client";

import { useEffect, useState } from "react";

type Source = {
  content: string;
  score?: number;
};

type Business = {
  id: string;
  name: string;
  slug: string;
};

export default function KnowledgeSearchTestPage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [sources, setSources] =
    useState<Source[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingBusiness, setLoadingBusiness] =
    useState(true);

  const [error, setError] =
    useState("");

  // --------------------------------
  // Load current business
  // --------------------------------

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoadingBusiness(true);

        const response =
          await fetch("/api/business");

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load business."
          );
        }

        setBusiness({
          id: data.id,
          name: data.name,
          slug: data.slug,
        });
      } catch (error) {
        console.error(
          "Business load error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load business."
        );
      } finally {
        setLoadingBusiness(false);
      }
    }

    loadBusiness();
  }, []);

  // --------------------------------
  // Ask AI
  // --------------------------------

  async function handleChat() {
    if (
      !question.trim() ||
      loading ||
      !business?.slug
    ) {
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);
    setError("");

    try {
      const response =
        await fetch("/api/chat", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            slug: business.slug,
            question:
              question.trim(),
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to generate AI response."
        );
      }

      setAnswer(
        data.answer || ""
      );

      setSources(
        data.sources || []
      );
    } catch (error) {
      console.error(
        "Chat test error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-6 lg:p-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-indigo-600">
            Assistora AI
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            AI Support Test
          </h1>

          <p className="mt-2 text-gray-500">
            Test your AI agent using your business
            knowledge base.
          </p>

          {/* Business */}

          {loadingBusiness ? (
            <p className="mt-3 text-sm text-gray-400">
              Loading business...
            </p>
          ) : business ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />

              <span>
                Testing:
              </span>

              <span className="font-medium text-gray-900">
                {business.name}
              </span>
            </div>
          ) : null}
        </div>

        {/* Chat Input */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Ask your AI agent
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  handleChat();
                }
              }}
              placeholder="What is your return policy?"
              disabled={
                loadingBusiness ||
                !business
              }
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <button
              onClick={handleChat}
              disabled={
                loading ||
                loadingBusiness ||
                !business ||
                !question.trim()
              }
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Thinking..."
                : "Ask AI"}
            </button>

          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* AI Answer */}

        {answer && (
          <div className="mt-8">

            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Assistora AI
            </h2>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm text-white">
                  AI
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {business?.name
                      ? `${business.name} AI`
                      : "Assistora AI"}
                  </p>

                  <p className="text-xs text-gray-400">
                    Knowledge-based response
                  </p>
                </div>

              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {answer}
              </p>

            </div>
          </div>
        )}

        {/* Sources */}

        {sources.length > 0 && (
          <div className="mt-8">

            <div className="mb-4">

              <h2 className="text-lg font-semibold text-gray-900">
                Retrieved Knowledge
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Knowledge used to generate the answer.
              </p>

            </div>

            <div className="space-y-4">

              {sources.map(
                (source, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >

                    <div className="mb-3 flex items-center justify-between">

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        Source {index + 1}
                      </span>

                      {typeof source.score ===
                        "number" && (
                        <span className="text-xs text-gray-400">
                          Score:{" "}
                          {source.score.toFixed(
                            4
                          )}
                        </span>
                      )}

                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {source.content}
                    </p>

                  </div>
                )
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}