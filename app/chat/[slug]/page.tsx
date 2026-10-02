"use client";

import { useEffect, useState } from "react";

import ChatWidget from "@/app/components/ChatWidget";

export default function PublicChatPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const [slug, setSlug] =
    useState("");

  useEffect(() => {
    async function loadParams() {
      const resolvedParams =
        await params;

      setSlug(
        resolvedParams.slug
      );
    }

    loadParams();
  }, [params]);

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
        <p className="text-sm text-gray-500">
          Loading chat...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-4">
      <ChatWidget slug={slug} />
    </main>
  );
}