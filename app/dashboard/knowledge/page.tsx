"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FileText,
  Globe,
  Link2,
  Plus,
  Search,
  Upload,
  CheckCircle2,
  MoreHorizontal,
  Database,
  X,
  Trash2,
} from "lucide-react";

type Source = {
  id: string;
  name: string;
  type: string;
  status: string;
  chunks: number;
  createdAt: string;
  updatedAt: string;
};

export default function KnowledgePage() {
  const [showModal, setShowModal] =
    useState(false);

  const [showTextForm, setShowTextForm] =
    useState(false);

  const [showURLForm, setShowURLForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [sources, setSources] =
    useState<Source[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingFile, setUploadingFile] =
    useState(false);

  const [importingURL, setImportingURL] =
    useState(false);

  const [deleting, setDeleting] =
    useState<string | null>(null);

  const [sourceName, setSourceName] =
    useState("");

  const [sourceContent, setSourceContent] =
    useState("");

  const [websiteUrl, setWebsiteUrl] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // --------------------------------
  // Load knowledge sources
  // --------------------------------

  const loadSources = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/knowledge"
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to load knowledge sources."
        );
      }

      setSources(
        result.sources || []
      );
    } catch (error) {
      console.error(
        "Knowledge load error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load knowledge sources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  // --------------------------------
  // Search
  // --------------------------------

  const filteredSources =
    useMemo(() => {
      return sources.filter(
        (source) =>
          source.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [sources, search]);

  // --------------------------------
  // Add text / FAQ
  // --------------------------------

  const addTextSource = async () => {
    if (!sourceName.trim()) {
      setError(
        "Please enter a source name."
      );

      return;
    }

    if (!sourceContent.trim()) {
      setError(
        "Please enter some knowledge content."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/knowledge",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: sourceName,
              type: "text",
              content: sourceContent,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to add knowledge source."
        );
      }

      setSources(
        (current) => [
          result.source,
          ...current,
        ]
      );

      setSourceName("");
      setSourceContent("");
      setShowTextForm(false);
      setShowURLForm(false);
      setShowModal(false);

      setSuccess(
        "Knowledge source added successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Knowledge save error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add knowledge source."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Import Website / URL
  // --------------------------------

  const importWebsite = async () => {
    if (!websiteUrl.trim()) {
      setError(
        "Please enter a website URL."
      );

      return;
    }

    try {
      setImportingURL(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/knowledge/url",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              url: websiteUrl.trim(),
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to import website."
        );
      }

      setWebsiteUrl("");
      setShowURLForm(false);
      setShowTextForm(false);
      setShowModal(false);

      await loadSources();

      const pagesCrawled =
        result?.source?.pagesCrawled;

      const chunks =
        result?.source?.chunks;

      setSuccess(
        `${result.source.name} imported successfully.${
          pagesCrawled
            ? ` ${pagesCrawled} pages crawled.`
            : ""
        }${
          chunks
            ? ` ${chunks} chunks created.`
            : ""
        }`
      );

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      console.error(
        "Website import error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to import website."
      );
    } finally {
      setImportingURL(false);
    }
  };

  // --------------------------------
  // Upload PDF / DOCX / TXT / CSV
  // --------------------------------

  const uploadFile = async (
    file: File
  ) => {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const allowedExtensions = [
      "pdf",
      "docx",
      "txt",
      "csv",
    ];

    if (
      !extension ||
      !allowedExtensions.includes(
        extension
      )
    ) {
      setError(
        "Only PDF, DOCX, TXT and CSV files are supported."
      );

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "File size must be less than 10 MB."
      );

      return;
    }

    if (file.size === 0) {
      setError(
        "The selected file is empty."
      );

      return;
    }

    try {
      setUploadingFile(true);
      setError("");
      setSuccess("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/knowledge/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to upload file."
        );
      }

      setSuccess(
        `${result.source.name} uploaded successfully. ${result.source.chunks} chunks created.`
      );

      setShowModal(false);
      setShowTextForm(false);
      setShowURLForm(false);

      await loadSources();

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      console.error(
        "File upload error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload file."
      );
    } finally {
      setUploadingFile(false);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  };

  // --------------------------------
  // Delete source
  // --------------------------------

  const deleteSource = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this knowledge source?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(id);
      setError("");

      const response =
        await fetch(
          `/api/knowledge?id=${id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to delete knowledge source."
        );
      }

      setSources(
        (current) =>
          current.filter(
            (source) =>
              source.id !== id
          )
      );

      setSuccess(
        "Knowledge source deleted."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Knowledge delete error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete knowledge source."
      );
    } finally {
      setDeleting(null);
    }
  };

  // --------------------------------
  // Format source type
  // --------------------------------

  const formatSourceType = (
    type: string
  ) => {
    switch (type) {
      case "text":
        return "Text";

      case "faq":
        return "FAQ";

      case "document":
        return "Document";

      case "website":
        return "Website";

      case "url":
        return "URL";

      default:
        return type;
    }
  };

  // --------------------------------
  // Source icon
  // --------------------------------

  const getIcon = (
    type: string
  ) => {
    if (type === "website") {
      return Globe;
    }

    if (type === "url") {
      return Link2;
    }

    return FileText;
  };

  // --------------------------------
  // Stats
  // --------------------------------

  const totalChunks =
    sources.reduce(
      (total, source) =>
        total +
        (source.chunks || 0),
      0
    );

  const lastUpdated =
    sources.length > 0
      ? new Date(
          Math.max(
            ...sources.map(
              (source) =>
                new Date(
                  source.updatedAt
                ).getTime()
            )
          )
        ).toLocaleString()
      : "—";

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="min-h-screen">
      {/* Header */}

      <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <div>
          <p className="text-xs text-slate-400">
            Workspace
          </p>

          <h1 className="text-lg font-semibold">
            Knowledge Base
          </h1>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setShowTextForm(false);
            setShowURLForm(false);
            setError("");
          }}
          className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600"
        >
          <Plus size={17} />

          Add source
        </button>
      </header>

      {/* Content */}

      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Intro */}

        <div>
          <p className="text-sm font-semibold text-indigo-600">
            BUSINESS KNOWLEDGE
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Teach your AI about your business
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add FAQs, policies, product
            information, documents and
            website content. Assistora uses
            this information to answer
            customer questions accurately.
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
              className="text-red-400 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success */}

        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2
              size={16}
            />

            {success}
          </div>
        )}

        {/* Stats */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <InfoCard
            label="Total sources"
            value={sources.length.toString()}
            icon={Database}
          />

          <InfoCard
            label="Knowledge chunks"
            value={totalChunks.toString()}
            icon={FileText}
          />

          <InfoCard
            label="Last synced"
            value={lastUpdated}
            icon={CheckCircle2}
          />
        </div>

        {/* Search */}

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold">
              Your sources
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Content available to your AI
              agent.
            </p>
          </div>

          <div className="relative">
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
              placeholder="Search sources..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-64"
            />
          </div>
        </div>

        {/* Sources */}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-4 px-5 py-5"
                  >
                    <div className="h-11 w-11 rounded-xl bg-slate-200" />

                    <div className="flex-1">
                      <div className="h-4 w-48 rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-64 rounded bg-slate-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : filteredSources.length >
            0 ? (
            <div className="divide-y divide-slate-100">
              {filteredSources.map(
                (source) => {
                  const Icon =
                    getIcon(
                      source.type
                    );

                  return (
                    <div
                      key={source.id}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                    >
                      {/* Icon */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon size={20} />
                      </div>

                      {/* Details */}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {source.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatSourceType(
                            source.type
                          )}

                          {" · "}

                          {source.chunks}{" "}
                          chunks

                          {" · "}

                          {new Date(
                            source.updatedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Status */}

                      <div className="hidden items-center gap-2 sm:flex">
                        <span
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            source.status ===
                            "ready"
                              ? "bg-emerald-50 text-emerald-700"
                              : source.status ===
                                "processing"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />

                          {source.status}
                        </span>
                      </div>

                      {/* Delete */}

                      <button
                        onClick={() =>
                          deleteSource(
                            source.id
                          )
                        }
                        disabled={
                          deleting ===
                          source.id
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete source"
                      >
                        {deleting ===
                        source.id ? (
                          <span className="text-xs">
                            ...
                          </span>
                        ) : (
                          <Trash2
                            size={16}
                          />
                        )}
                      </button>

                      {/* More */}

                      <button
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:flex"
                      >
                        <MoreHorizontal
                          size={17}
                        />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Database
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium">
                {search
                  ? "No sources found"
                  : "No knowledge sources yet"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {search
                  ? "Try another search term."
                  : "Add your first source to teach Assistora."}
              </p>

              {!search && (
                <button
                  onClick={() =>
                    setShowModal(true)
                  }
                  className="mt-5 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Add source
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add knowledge CTA */}

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Upload size={21} />
          </div>

          <h3 className="mt-4 font-semibold">
            Add more knowledge
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Upload documents or connect
            your website so your AI agent
            can answer more customer
            questions.
          </p>

          <button
            onClick={() =>
              setShowModal(true)
            }
            className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
          >
            Add knowledge
          </button>
        </div>
      </div>

      {/* Hidden file input */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv"
        className="hidden"
        onChange={(event) => {
          const file =
            event.target.files?.[0];

          if (file) {
            uploadFile(file);
          }
        }}
      />

      {/* Add Source Modal */}

      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {showURLForm
                    ? "Import website"
                    : showTextForm
                    ? "Add text or FAQ"
                    : "Add knowledge"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {showURLForm
                    ? "Import content from a public website."
                    : showTextForm
                    ? "Add information your AI should know."
                    : "Choose how you want to teach Assistora."}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(
                    false
                  );

                  setShowTextForm(
                    false
                  );

                  setShowURLForm(
                    false
                  );

                  setError("");
                }}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* URL Form */}

            {showURLForm ? (
              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Website URL
                  </label>

                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) =>
                      setWebsiteUrl(
                        e.target.value
                      )
                    }
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Assistora will crawl the
                    public website, extract
                    readable content and add it
                    to your knowledge base.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowURLForm(
                        false
                      );

                      setError("");
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    Back
                  </button>

                  <button
                    onClick={
                      importWebsite
                    }
                    disabled={
                      importingURL ||
                      !websiteUrl.trim()
                    }
                    className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importingURL
                      ? "Importing..."
                      : "Import website"}
                  </button>
                </div>
              </div>
            ) : showTextForm ? (
              /* Text Form */

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Source name
                  </label>

                  <input
                    value={sourceName}
                    onChange={(e) =>
                      setSourceName(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Return & Refund Policy"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Knowledge
                  </label>

                  <textarea
                    rows={9}
                    value={
                      sourceContent
                    }
                    onChange={(e) =>
                      setSourceContent(
                        e.target.value
                      )
                    }
                    placeholder="Paste your FAQs, policies, product information or other business knowledge..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowTextForm(
                        false
                      );

                      setError("");
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    Back
                  </button>

                  <button
                    onClick={
                      addTextSource
                    }
                    disabled={saving}
                    className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Adding..."
                      : "Add knowledge"}
                  </button>
                </div>
              </div>
            ) : (
              /* Source Options */

              <div className="mt-6 space-y-3">
                <SourceOption
                  icon={Upload}
                  title="Upload document"
                  description={
                    uploadingFile
                      ? "Processing your file..."
                      : "PDF, DOCX, TXT or CSV up to 10 MB"
                  }
                  onClick={() => {
                    if (
                      uploadingFile
                    ) {
                      return;
                    }

                    setError("");

                    fileInputRef.current?.click();
                  }}
                  disabled={
                    uploadingFile
                  }
                />

                <SourceOption
                  icon={Globe}
                  title="Connect a website"
                  description="Crawl and import content from a public website"
                  onClick={() => {
                    setShowURLForm(
                      true
                    );

                    setShowTextForm(
                      false
                    );

                    setError("");
                  }}
                />

                <SourceOption
                  icon={Link2}
                  title="Add a URL"
                  description="Import a specific webpage"
                  onClick={() => {
                    setShowURLForm(
                      true
                    );

                    setShowTextForm(
                      false
                    );

                    setError("");
                  }}
                />

                <SourceOption
                  icon={FileText}
                  title="Add text or FAQ"
                  description="Paste your own business knowledge"
                  onClick={() => {
                    setShowTextForm(
                      true
                    );

                    setShowURLForm(
                      false
                    );

                    setError("");
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------
// Info Card
// --------------------------------

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
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
// Source Option
// --------------------------------

function SourceOption({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-indigo-200 hover:bg-indigo-50/30"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
        <Icon size={18} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">
        →
      </span>
    </button>
  );
}