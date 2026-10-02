"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import {
  LayoutDashboard,
  BookOpen,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  LayoutTemplate,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Knowledge Base",
    href: "/dashboard/knowledge",
    icon: BookOpen,
  },
  {
    name: "AI Agent",
    href: "/dashboard/agent",
    icon: Bot,
  },
  {
    name: "Widget",
    href: "/dashboard/widget",
    icon: LayoutTemplate,
  },
  {
    name: "Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

type Business = {
  name: string;
  plan: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(
    null
  );

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const response = await fetch("/api/business");

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setBusiness(data.business);
      } catch (error) {
        console.error(
          "Failed to load business:",
          error
        );
      }
    };

    loadBusiness();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-200 bg-white lg:flex lg:flex-col">

      {/* Logo */}
      <div className="flex h-20 items-center border-b border-gray-100 px-6">
        <Link
          href="/dashboard"
          className="text-2xl font-bold tracking-tight text-gray-900"
        >
          Assistora<span className="text-gray-400">.</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Workspace
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />

              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Business */}
      <div className="border-t border-gray-100 p-4">

        <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
            {business?.name?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {business?.name || "Loading..."}
            </p>

            <p className="truncate text-xs capitalize text-gray-400">
              {business?.plan || "starter"} plan
            </p>
          </div>

        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />

          Log out
        </button>

      </div>
    </aside>
  );
}