import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import Business from "@/models/Business";

export const runtime = "nodejs";

function normalizePublicWidget(business: Record<string, any>) {
  const widget = business.widget ?? {};
  const agentName = widget.agentName || business.aiAgent?.name || "Assistora AI";
  const welcomeMessage = widget.welcomeMessage || business.aiAgent?.welcomeMessage || "Hi! How can I help you today?";

  return {
    enabled: widget.enabled !== false,
    primaryColor: widget.primaryColor || "#6366F1",
    position: widget.position === "bottom-left" ? "bottom-left" : "bottom-right",
    agentName,
    avatarUrl: widget.avatarUrl || "",
    welcomeMessage,
    buttonSize: widget.buttonSize || "medium",
    borderRadius: widget.borderRadius || "large",
    showBranding: widget.showBranding !== false,
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim().toLowerCase() : "";

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ success: false, message: "Invalid business slug." }, { status: 400 });
    }

    await connectDB();

    const business = await Business.findOne({ slug }).lean();

    if (!business) {
      return NextResponse.json({ success: false, message: "Business not found." }, { status: 404 });
    }

    const widget = normalizePublicWidget(business);

    return NextResponse.json({
      success: true,
      data: { widget },
      widget,
    });
  } catch (error) {
    console.error("Public widget config error:", error);
    return NextResponse.json({ success: false, message: "Unable to load widget configuration." }, { status: 500 });
  }
}
