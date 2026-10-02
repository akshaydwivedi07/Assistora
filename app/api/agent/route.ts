import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import Business from "@/models/Business";

const allowedTones = [
  "Friendly",
  "Professional",
  "Casual",
  "Concise",
] as const;

const DEFAULT_INSTRUCTIONS =
  "Help customers with questions about products, orders, returns and delivery.";

const DEFAULT_WELCOME_MESSAGE =
  "Hi! 👋 How can I help you today?";

// --------------------------------
// Get authenticated business
// --------------------------------

async function getBusinessFromSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      "assistora_session"
    )?.value;

  if (!token) {
    return null;
  }

  const sessionData =
    await verifySessionToken(token);

  if (!sessionData) {
    return null;
  }

  // Validate both IDs from the session
  if (
    !mongoose.Types.ObjectId.isValid(
      sessionData.businessId
    ) ||
    !mongoose.Types.ObjectId.isValid(
      sessionData.userId
    )
  ) {
    return null;
  }

  await connectDB();

  // IMPORTANT:
  // Business is resolved using BOTH:
  // - businessId from the verified session
  // - userId from the verified session
  //
  // This prevents an incorrectly mapped session
  // from accessing another business.
  const business =
    await Business.findOne({
      _id: new mongoose.Types.ObjectId(
        sessionData.businessId
      ),
      ownerId: new mongoose.Types.ObjectId(
        sessionData.userId
      ),
    });

  return business;
}

// --------------------------------
// GET - Agent settings
// --------------------------------

export async function GET() {
  try {
    const business =
      await getBusinessFromSession();

    if (!business) {
      return NextResponse.json(
        {
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const agent = {
      enabled:
        business.aiAgent?.enabled ??
        true,

      name:
        business.aiAgent?.name ||
        "Assistora AI",

      welcomeMessage:
        business.aiAgent
          ?.welcomeMessage ||
        DEFAULT_WELCOME_MESSAGE,

      tone:
        business.aiAgent?.tone ||
        "Friendly",

      instructions:
        business.aiAgent?.instructions ||
        DEFAULT_INSTRUCTIONS,
    };

    return NextResponse.json({
      success: true,
      message: "Agent settings loaded successfully.",
      data: { agent },
      agent,
    });
  } catch (error) {
    console.error(
      "Agent GET error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}

// --------------------------------
// PATCH - Update agent settings
// --------------------------------

export async function PATCH(
  request: Request
) {
  try {
    const business =
      await getBusinessFromSession();

    if (!business) {
      return NextResponse.json(
        {
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const {
      enabled,
      name,
      welcomeMessage,
      tone,
      instructions,
    } = body;

    // --------------------------------
    // Validate enabled
    // --------------------------------

    if (
      typeof enabled !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid enabled value.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Validate name
    // --------------------------------

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "Agent name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        {
          message:
            "Agent name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Validate welcome message
    // --------------------------------

    if (
      typeof welcomeMessage !==
        "string" ||
      !welcomeMessage.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "Welcome message is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      welcomeMessage.trim().length >
      500
    ) {
      return NextResponse.json(
        {
          message:
            "Welcome message is too long.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Validate tone
    // --------------------------------

    if (
      !allowedTones.includes(
        tone
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid agent tone.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Validate instructions
    // --------------------------------

    const cleanedInstructions =
      typeof instructions ===
      "string"
        ? instructions.trim()
        : "";

    if (
      cleanedInstructions.length >
      5000
    ) {
      return NextResponse.json(
        {
          message:
            "Agent instructions are too long.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Update only this business
    // --------------------------------

    business.aiAgent = {
      enabled,

      name:
        name.trim(),

      welcomeMessage:
        welcomeMessage.trim(),

      tone,

      instructions:
        cleanedInstructions,
    };

    await business.save();

    // --------------------------------
    // Response
    // --------------------------------

    const agent = {
      enabled:
        business.aiAgent.enabled,

      name:
        business.aiAgent.name,

      welcomeMessage:
        business.aiAgent
          .welcomeMessage,

      tone:
        business.aiAgent.tone,

      instructions:
        business.aiAgent
          .instructions,
    };

    return NextResponse.json({
      success: true,
      message:
        "AI Agent settings saved successfully.",
      data: { agent },
      agent,
    });
  } catch (error) {
    console.error(
      "Agent PATCH error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}