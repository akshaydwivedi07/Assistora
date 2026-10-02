"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";

type BusinessForm = {
  name: string;
  website: string;
  industry: string;
  supportEmail: string;
};

type AccountForm = {
  name: string;
  email: string;
  emailVerified: boolean;
};

type AgentForm = {
  enabled: boolean;
  name: string;
  welcomeMessage: string;
  tone: "Friendly" | "Professional" | "Casual" | "Concise";
  instructions: string;
};

const defaultBusiness: BusinessForm = {
  name: "",
  website: "",
  industry: "",
  supportEmail: "",
};

const defaultAccount: AccountForm = {
  name: "",
  email: "",
  emailVerified: false,
};

const defaultAgent: AgentForm = {
  enabled: true,
  name: "Assistora AI",
  welcomeMessage: "Hi! 👋 How can I help you today?",
  tone: "Friendly",
  instructions: "Help customers with questions about products, orders, returns and delivery.",
};

const tones = ["Friendly", "Professional", "Casual", "Concise"] as const;

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });

  let result: any = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result?.message || "Something went wrong.");
  }

  return result;
}

export default function SettingsPage() {
  const router = useRouter();

  const [businessForm, setBusinessForm] = useState<BusinessForm>(defaultBusiness);
  const [accountForm, setAccountForm] = useState<AccountForm>(defaultAccount);
  const [agentForm, setAgentForm] = useState<AgentForm>(defaultAgent);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(true);
  const [busLoading, setBusLoading] = useState(false);
  const [acctLoading, setAcctLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [businessStatus, setBusinessStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [accountStatus, setAccountStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [agentStatus, setAgentStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [deleteStatus, setDeleteStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteControls, setShowDeleteControls] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const [businessResult, accountResult, agentResult] = await Promise.all([
          requestJson("/api/business"),
          requestJson("/api/account"),
          requestJson("/api/agent"),
        ]);

        const business = businessResult?.data?.business ?? businessResult?.business ?? defaultBusiness;
        const account = accountResult?.data?.user ?? accountResult?.user ?? defaultAccount;
        const agent = agentResult?.data?.agent ?? agentResult?.agent ?? defaultAgent;

        setBusinessForm({
          name: business.name ?? "",
          website: business.website ?? "",
          industry: business.industry ?? "",
          supportEmail: business.supportEmail ?? "",
        });

        setAccountForm({
          name: account.name ?? "",
          email: account.email ?? "",
          emailVerified: Boolean(account.emailVerified),
        });

        setAgentForm({
          enabled: Boolean(agent.enabled),
          name: agent.name ?? defaultAgent.name,
          welcomeMessage: agent.welcomeMessage ?? defaultAgent.welcomeMessage,
          tone: tones.includes(agent.tone as any) ? (agent.tone as AgentForm["tone"]) : "Friendly",
          instructions: agent.instructions ?? defaultAgent.instructions,
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
        setBusinessStatus({
          type: "error",
          message: error instanceof Error ? error.message : "The settings could not be loaded.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function saveBusiness() {
    try {
      setBusLoading(true);
      setBusinessStatus({ type: "idle", message: "" });

      const result = await requestJson("/api/business", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: businessForm.name,
          website: businessForm.website,
          industry: businessForm.industry,
          supportEmail: businessForm.supportEmail,
        }),
      });

      const payload = result?.data?.business ?? result?.business ?? businessForm;
      setBusinessForm({
        name: payload.name ?? "",
        website: payload.website ?? "",
        industry: payload.industry ?? "",
        supportEmail: payload.supportEmail ?? "",
      });
      setBusinessStatus({ type: "success", message: result.message || "Business settings saved." });
    } catch (error) {
      setBusinessStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save business settings.",
      });
    } finally {
      setBusLoading(false);
    }
  }

  async function saveAccount() {
    try {
      setAcctLoading(true);
      setAccountStatus({ type: "idle", message: "" });

      const result = await requestJson("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: accountForm.name,
        }),
      });

      const payload = result?.data?.user ?? result?.user ?? accountForm;
      setAccountForm({
        name: payload.name ?? "",
        email: payload.email ?? accountForm.email,
        emailVerified: Boolean(payload.emailVerified),
      });
      setAccountStatus({ type: "success", message: result.message || "Account updated." });
    } catch (error) {
      setAccountStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update account.",
      });
    } finally {
      setAcctLoading(false);
    }
  }

  async function savePassword() {
    try {
      setPasswordLoading(true);
      setPasswordStatus({ type: "idle", message: "" });

      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordStatus({ type: "error", message: "Please fill in all password fields." });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordStatus({ type: "error", message: "New passwords do not match." });
        return;
      }

      const result = await requestJson("/api/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordStatus({ type: "success", message: result.message || "Password updated." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to change password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function saveAgent() {
    try {
      setAgentLoading(true);
      setAgentStatus({ type: "idle", message: "" });

      const result = await requestJson("/api/agent", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: agentForm.enabled,
          name: agentForm.name,
          welcomeMessage: agentForm.welcomeMessage,
          tone: agentForm.tone,
          instructions: agentForm.instructions,
        }),
      });

      const payload = result?.data?.agent ?? result?.agent ?? agentForm;
      setAgentForm({
        enabled: Boolean(payload.enabled),
        name: payload.name ?? defaultAgent.name,
        welcomeMessage: payload.welcomeMessage ?? defaultAgent.welcomeMessage,
        tone: tones.includes(payload.tone as any) ? (payload.tone as AgentForm["tone"]) : "Friendly",
        instructions: payload.instructions ?? defaultAgent.instructions,
      });
      setAgentStatus({ type: "success", message: result.message || "Agent settings saved." });
    } catch (error) {
      setAgentStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save agent settings.",
      });
    } finally {
      setAgentLoading(false);
    }
  }

  async function deleteAccount() {
    try {
      setDeleteLoading(true);
      setDeleteStatus({ type: "idle", message: "" });

      if (deleteConfirmation !== "DELETE") {
        setDeleteStatus({ type: "error", message: "Type DELETE to confirm the account deletion." });
        return;
      }

      await requestJson("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      setDeleteStatus({ type: "success", message: "Account deleted. Redirecting..." });
      router.push("/login");
      router.refresh();
    } catch (error) {
      setDeleteStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete account.",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
          <div className="h-80 rounded-2xl bg-white" />
          <div className="h-80 rounded-2xl bg-white" />
          <div className="h-80 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business, account, agent, and security settings.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Building2 size={20} className="text-gray-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Business</h2>
                <p className="text-sm text-gray-500">Update your business information.</p>
              </div>
            </div>
            <button onClick={saveBusiness} disabled={busLoading} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} />
              {busLoading ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Business name</label>
              <input value={businessForm.name} onChange={(e) => setBusinessForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Website</label>
              <div className="relative">
                <Globe size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={businessForm.website} onChange={(e) => setBusinessForm((prev) => ({ ...prev, website: e.target.value }))} className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-black" placeholder="https://example.com" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Industry</label>
              <input value={businessForm.industry} onChange={(e) => setBusinessForm((prev) => ({ ...prev, industry: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" placeholder="Retail, SaaS, restaurants, etc." />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Support email</label>
              <input type="email" value={businessForm.supportEmail} onChange={(e) => setBusinessForm((prev) => ({ ...prev, supportEmail: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" placeholder="support@example.com" />
            </div>

            {businessStatus.message ? (
              <p className={`text-sm ${businessStatus.type === "success" ? "text-green-600" : businessStatus.type === "error" ? "text-red-600" : "text-gray-500"}`}>
                {businessStatus.message}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <User size={20} className="text-gray-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Account</h2>
                <p className="text-sm text-gray-500">Update your profile details.</p>
              </div>
            </div>
            <button onClick={saveAccount} disabled={acctLoading} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} />
              {acctLoading ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
              <input value={accountForm.name} onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input value={accountForm.email} disabled className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500" />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              {accountForm.emailVerified ? <CheckCircle2 size={16} className="text-green-600" /> : <Shield size={16} className="text-amber-500" />}
              <span className={accountForm.emailVerified ? "text-green-700" : "text-amber-700"}>
                {accountForm.emailVerified ? "Email verified" : "Email not verified"}
              </span>
            </div>

            {accountStatus.message ? (
              <p className={`text-sm ${accountStatus.type === "success" ? "text-green-600" : accountStatus.type === "error" ? "text-red-600" : "text-gray-500"}`}>
                {accountStatus.message}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Lock size={20} className="text-gray-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Password</h2>
                <p className="text-sm text-gray-500">Update your password securely.</p>
              </div>
            </div>
            <button onClick={savePassword} disabled={passwordLoading} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} />
              {passwordLoading ? "Updating..." : "Update"}
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Current password</label>
              <div className="relative">
                <input type={passwordVisibility.current ? "text" : "password"} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm outline-none focus:border-black" />
                <button type="button" onClick={() => setPasswordVisibility((prev) => ({ ...prev, current: !prev.current }))} className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                  {passwordVisibility.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">New password</label>
              <div className="relative">
                <input type={passwordVisibility.new ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm outline-none focus:border-black" />
                <button type="button" onClick={() => setPasswordVisibility((prev) => ({ ...prev, new: !prev.new }))} className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                  {passwordVisibility.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm new password</label>
              <div className="relative">
                <input type={passwordVisibility.confirm ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm outline-none focus:border-black" />
                <button type="button" onClick={() => setPasswordVisibility((prev) => ({ ...prev, confirm: !prev.confirm }))} className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                  {passwordVisibility.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {passwordStatus.message ? (
              <p className={`text-sm ${passwordStatus.type === "success" ? "text-green-600" : passwordStatus.type === "error" ? "text-red-600" : "text-gray-500"}`}>
                {passwordStatus.message}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Bot size={20} className="text-gray-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">AI agent</h2>
                <p className="text-sm text-gray-500">Configure your customer support agent.</p>
              </div>
            </div>
            <button onClick={saveAgent} disabled={agentLoading} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} />
              {agentLoading ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-medium text-gray-900">Agent enabled</p>
                <p className="text-sm text-gray-500">Turn the AI assistant on or off.</p>
              </div>
              <button type="button" onClick={() => setAgentForm((prev) => ({ ...prev, enabled: !prev.enabled }))} className={`relative h-7 w-12 rounded-full transition ${agentForm.enabled ? "bg-black" : "bg-gray-300"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${agentForm.enabled ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Agent name</label>
              <input value={agentForm.name} onChange={(e) => setAgentForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Welcome message</label>
              <textarea value={agentForm.welcomeMessage} onChange={(e) => setAgentForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))} className="min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tone</label>
              <select value={agentForm.tone} onChange={(e) => setAgentForm((prev) => ({ ...prev, tone: e.target.value as AgentForm["tone"] }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black">
                {tones.map((tone) => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Instructions</label>
              <textarea value={agentForm.instructions} onChange={(e) => setAgentForm((prev) => ({ ...prev, instructions: e.target.value }))} className="min-h-32 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>

            {agentStatus.message ? (
              <p className={`text-sm ${agentStatus.type === "success" ? "text-green-600" : agentStatus.type === "error" ? "text-red-600" : "text-gray-500"}`}>
                {agentStatus.message}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-red-600"><AlertTriangle size={18} /> Danger zone</h2>
              <p className="mt-2 text-sm text-gray-600">Delete your account and all associated business data permanently.</p>
            </div>
            <button type="button" onClick={() => setShowDeleteControls((prev) => !prev)} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
              {showDeleteControls ? "Close" : "Delete account"}
            </button>
          </div>

          {showDeleteControls ? (
            <div className="mt-6 space-y-4 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-red-700">This action is permanent. Type DELETE in the box below to confirm.</p>
              <input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400" placeholder="DELETE" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={deleteAccount} disabled={deleteLoading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <Trash2 size={16} />
                  {deleteLoading ? "Deleting..." : "Confirm deletion"}
                </button>
              </div>
              {deleteStatus.message ? (
                <p className={`text-sm ${deleteStatus.type === "success" ? "text-green-600" : deleteStatus.type === "error" ? "text-red-600" : "text-gray-500"}`}>
                  {deleteStatus.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}