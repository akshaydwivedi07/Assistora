import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { verifySessionToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";

export const runtime = "nodejs";

const WIDGET_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const VALID_POSITIONS = new Set(["bottom-right", "bottom-left"]);
const VALID_BUTTON_SIZES = new Set(["small", "medium", "large"]);
const VALID_BORDER_RADII = new Set(["small", "medium", "large"]);
const VALID_WIDGET_KEYS = new Set([
  "enabled",
  "primaryColor",
  "position",
  "agentName",
  "avatarUrl",
  "welcomeMessage",
  "buttonSize",
  "borderRadius",
  "showBranding",
]);

function sanitizeWidgetValue(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeWidget(widget: Record<string, unknown> | undefined, aiAgent?: Record<string, unknown>) {
  const source = widget ?? {};
  const agentName = typeof aiAgent?.name === "string" ? aiAgent.name.trim() : "Assistora AI";
  const welcomeMessage = typeof aiAgent?.welcomeMessage === "string" ? aiAgent.welcomeMessage.trim() : "Hi! How can I help you today?";

  const enabled = typeof source.enabled === "boolean" ? source.enabled : true;
  const primaryColor = typeof source.primaryColor === "string" && WIDGET_COLOR_RE.test(source.primaryColor.trim()) ? source.primaryColor.trim() : "#6366F1";
  const position = typeof source.position === "string" && VALID_POSITIONS.has(source.position) ? source.position : "bottom-right";
  const widgetAgentName = typeof source.agentName === "string" && source.agentName.trim() ? source.agentName.trim() : agentName;
  const avatarUrl = typeof source.avatarUrl === "string" ? source.avatarUrl.trim() : "";
  const widgetWelcomeMessage = typeof source.welcomeMessage === "string" && source.welcomeMessage.trim() ? source.welcomeMessage.trim() : welcomeMessage;
  const buttonSize = typeof source.buttonSize === "string" && VALID_BUTTON_SIZES.has(source.buttonSize) ? source.buttonSize : "medium";
  const borderRadius = typeof source.borderRadius === "string" && VALID_BORDER_RADII.has(source.borderRadius) ? source.borderRadius : "large";
  const showBranding = typeof source.showBranding === "boolean" ? source.showBranding : true;

  return {
    enabled,
    primaryColor,
    position,
    agentName: widgetAgentName,
    avatarUrl,
    welcomeMessage: widgetWelcomeMessage,
    buttonSize,
    borderRadius,
    showBranding,
  };
}

async function getAuthenticatedBusiness() {
  const token = (await cookies()).get("assistora_session")?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);

  if (!session || !session.userId || !session.businessId) return null;

  if (!mongoose.Types.ObjectId.isValid(session.userId) || !mongoose.Types.ObjectId.isValid(session.businessId)) {
    return null;
  }

  await connectDB();

  const business = await Business.findOne({
    _id: new mongoose.Types.ObjectId(session.businessId),
    ownerId: new mongoose.Types.ObjectId(session.userId),
  }).lean();

  return business;
}

export async function GET() {
  try {
    const business = await getAuthenticatedBusiness();

    if (!business) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const widget = normalizeWidget(business.widget, business.aiAgent);

    return NextResponse.json({
      success: true,
      message: "Widget settings loaded successfully.",
      data: { widget },
      widget,
    });
  } catch (error) {
    console.error("Widget API GET error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();

    if (!business) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }

    const incoming = body.widget && typeof body.widget === "object" && !Array.isArray(body.widget) ? body.widget : body;
    const unsupported = Object.keys(incoming).filter((key) => !VALID_WIDGET_KEYS.has(key));

    if (unsupported.length > 0) {
      return NextResponse.json({ success: false, message: "Unsupported widget fields were supplied." }, { status: 400 });
    }

    const currentWidget = normalizeWidget(business.widget, business.aiAgent);
    const nextWidget = {
      ...currentWidget,
      enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : currentWidget.enabled,
      primaryColor: typeof incoming.primaryColor === "string" && WIDGET_COLOR_RE.test(incoming.primaryColor.trim()) ? incoming.primaryColor.trim() : currentWidget.primaryColor,
      position: typeof incoming.position === "string" && VALID_POSITIONS.has(incoming.position) ? incoming.position : currentWidget.position,
      agentName: typeof incoming.agentName === "string" && incoming.agentName.trim() ? incoming.agentName.trim() : currentWidget.agentName,
      avatarUrl: typeof incoming.avatarUrl === "string" ? incoming.avatarUrl.trim() : currentWidget.avatarUrl,
      welcomeMessage: typeof incoming.welcomeMessage === "string" && incoming.welcomeMessage.trim() ? incoming.welcomeMessage.trim() : currentWidget.welcomeMessage,
      buttonSize: typeof incoming.buttonSize === "string" && VALID_BUTTON_SIZES.has(incoming.buttonSize) ? incoming.buttonSize : currentWidget.buttonSize,
      borderRadius: typeof incoming.borderRadius === "string" && VALID_BORDER_RADII.has(incoming.borderRadius) ? incoming.borderRadius : currentWidget.borderRadius,
      showBranding: typeof incoming.showBranding === "boolean" ? incoming.showBranding : currentWidget.showBranding,
    };

    if (nextWidget.agentName.length > 60) {
      return NextResponse.json({ success: false, message: "Agent name is too long." }, { status: 400 });
    }

    if (nextWidget.welcomeMessage.length > 280) {
      return NextResponse.json({ success: false, message: "Welcome message is too long." }, { status: 400 });
    }

    if (nextWidget.avatarUrl) {
      try {
        const url = new URL(nextWidget.avatarUrl);

        if (!["http:", "https:"].includes(url.protocol)) {
          return NextResponse.json({ success: false, message: "Avatar URL must use http or https." }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ success: false, message: "Avatar URL is invalid." }, { status: 400 });
      }
    }

    const updatedBusiness = await Business.findOneAndUpdate(
      {
        _id: business._id,
        ownerId: business.ownerId,
      },
      {
        $set: {
          widget: nextWidget,
        },
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return NextResponse.json({ success: false, message: "Business not found or access denied." }, { status: 403 });
    }

    const widget = normalizeWidget(updatedBusiness.widget, updatedBusiness.aiAgent);

    return NextResponse.json({
      success: true,
      message: "Widget settings updated successfully.",
      data: { widget },
      widget,
    });
  } catch (error) {
    console.error("Widget API PATCH error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
