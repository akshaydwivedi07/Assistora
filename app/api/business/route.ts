import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import Business from "@/models/Business";

export const runtime = "nodejs";

const BUSINESS_NAME_MAX = 120;
const WEBSITE_MAX = 200;
const INDUSTRY_MAX = 80;
const SUPPORT_EMAIL_MAX = 160;

function isValidWebsite(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !["javascript:", "data:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function getAuthenticatedBusiness() {
  const token = (await cookies()).get("assistora_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(session.businessId) || !mongoose.Types.ObjectId.isValid(session.userId)) {
    return null;
  }

  await connectDB();

  const business = await Business.findOne({
    _id: new mongoose.Types.ObjectId(session.businessId),
    ownerId: new mongoose.Types.ObjectId(session.userId),
  }).lean();

  if (!business) {
    return null;
  }

  return business;
}

export async function GET() {
  try {
    const business = await getAuthenticatedBusiness();

    if (!business) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const payload = {
      id: business._id.toString(),
      name: business.name,
      slug: business.slug,
      industry: business.industry ?? "",
      website: business.website ?? "",
      supportEmail: business.supportEmail ?? "",
      plan: business.plan,
      aiAgent: business.aiAgent ?? {},
      widget: {
        enabled: business.widget?.enabled ?? true,
        primaryColor: business.widget?.primaryColor ?? "#6366F1",
        position: business.widget?.position ?? "bottom-right",
        agentName: business.widget?.agentName ?? business.aiAgent?.name ?? "Assistora AI",
        avatarUrl: business.widget?.avatarUrl ?? "",
        welcomeMessage: business.widget?.welcomeMessage ?? business.aiAgent?.welcomeMessage ?? "Hi! How can I help you today?",
        buttonSize: business.widget?.buttonSize ?? "medium",
        borderRadius: business.widget?.borderRadius ?? "large",
        showBranding: business.widget?.showBranding ?? true,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Business settings loaded successfully.",
      data: { business: payload },
      business: payload,
    });
  } catch (error) {
    console.error("Business API error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const business = await getAuthenticatedBusiness();

    if (!business) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const allowedFields = new Set(["name", "website", "industry", "supportEmail"]);
    const unsupported = Object.keys(body).filter((key) => !allowedFields.has(key));

    if (unsupported.length > 0) {
      return NextResponse.json(
        { success: false, message: "Unsupported business fields were supplied." },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Business name is required." },
        { status: 400 }
      );
    }

    if (name.length > BUSINESS_NAME_MAX) {
      return NextResponse.json(
        { success: false, message: "Business name is too long." },
        { status: 400 }
      );
    }

    const websiteValue = typeof body.website === "string" ? body.website.trim() : "";
    if (websiteValue && websiteValue.length > WEBSITE_MAX) {
      return NextResponse.json(
        { success: false, message: "Website is too long." },
        { status: 400 }
      );
    }

    if (websiteValue && !isValidWebsite(websiteValue)) {
      return NextResponse.json(
        { success: false, message: "Website must be a valid http(s) URL." },
        { status: 400 }
      );
    }

    const industryValue = typeof body.industry === "string" ? body.industry.trim() : "";
    if (industryValue.length > INDUSTRY_MAX) {
      return NextResponse.json(
        { success: false, message: "Industry is too long." },
        { status: 400 }
      );
    }

    const supportEmailValue = typeof body.supportEmail === "string" ? body.supportEmail.trim() : "";
    if (supportEmailValue && supportEmailValue.length > SUPPORT_EMAIL_MAX) {
      return NextResponse.json(
        { success: false, message: "Support email is too long." },
        { status: 400 }
      );
    }

    if (supportEmailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmailValue)) {
      return NextResponse.json(
        { success: false, message: "Support email must be a valid email address." },
        { status: 400 }
      );
    }

    const updatedBusiness = await Business.findOneAndUpdate(
      {
        _id: business._id,
        ownerId: business.ownerId,
      },
      {
        $set: {
          name,
          website: websiteValue,
          industry: industryValue,
          supportEmail: supportEmailValue,
        },
      },
      { new: true }
    );

    if (!updatedBusiness) {
      return NextResponse.json(
        { success: false, message: "Business not found or access denied." },
        { status: 403 }
      );
    }

    const payload = {
      id: updatedBusiness._id.toString(),
      name: updatedBusiness.name,
      slug: updatedBusiness.slug,
      industry: updatedBusiness.industry ?? "",
      website: updatedBusiness.website ?? "",
      supportEmail: updatedBusiness.supportEmail ?? "",
      plan: updatedBusiness.plan,
      aiAgent: updatedBusiness.aiAgent ?? {},
      widget: {
        enabled: updatedBusiness.widget?.enabled ?? true,
        primaryColor: updatedBusiness.widget?.primaryColor ?? "#6366F1",
        position: updatedBusiness.widget?.position ?? "bottom-right",
        agentName: updatedBusiness.widget?.agentName ?? updatedBusiness.aiAgent?.name ?? "Assistora AI",
        avatarUrl: updatedBusiness.widget?.avatarUrl ?? "",
        welcomeMessage: updatedBusiness.widget?.welcomeMessage ?? updatedBusiness.aiAgent?.welcomeMessage ?? "Hi! How can I help you today?",
        buttonSize: updatedBusiness.widget?.buttonSize ?? "medium",
        borderRadius: updatedBusiness.widget?.borderRadius ?? "large",
        showBranding: updatedBusiness.widget?.showBranding ?? true,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Business settings updated successfully.",
      data: { business: payload },
      business: payload,
    });
  } catch (error) {
    console.error("Business PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}