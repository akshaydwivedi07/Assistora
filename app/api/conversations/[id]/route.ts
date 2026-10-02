import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import Conversation from "@/models/Conversation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// --------------------------------
// Helper - authenticate dashboard
// --------------------------------

async function getAuthenticatedSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      "assistora_session"
    )?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      session.businessId
    )
  ) {
    return null;
  }

  return session;
}

// --------------------------------
// GET - Conversation details
// --------------------------------

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    // --------------------------------
    // 1. Validate conversation ID
    // --------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid conversation ID.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 2. Authentication
    // --------------------------------

    const session =
      await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          message:
            "Unauthorized. Please login again.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // 3. Database
    // --------------------------------

    await connectDB();

    // IMPORTANT:
    //
    // Conversation can only be returned when
    // BOTH the conversation ID and business ID
    // match the authenticated tenant.
    const conversation =
      await Conversation.findOne({
        _id: new mongoose.Types.ObjectId(id),

        businessId:
          new mongoose.Types.ObjectId(
            session.businessId
          ),
      }).lean();

    if (!conversation) {
      return NextResponse.json(
        {
          message:
            "Conversation not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------
    // 4. Response
    // --------------------------------

    return NextResponse.json({
      conversation: {
        id:
          conversation._id.toString(),

        customerId:
          conversation.customerId,

        customerName:
          conversation.customerName ||
          "Website Visitor",

        status:
          conversation.status,

        messages:
          conversation.messages || [],

        lastMessageAt:
          conversation.lastMessageAt,

        createdAt:
          conversation.createdAt,

        updatedAt:
          conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Conversation GET error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load conversation.",
      },
      {
        status: 500,
      }
    );
  }
}

// --------------------------------
// PATCH - Resolve / Reopen
// --------------------------------

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    // --------------------------------
    // 1. Validate conversation ID
    // --------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid conversation ID.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 2. Authentication
    // --------------------------------

    const session =
      await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          message:
            "Unauthorized. Please login again.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // 3. Read request body
    // --------------------------------

    const body =
      await request.json();

    const status =
      body?.status;

    if (
      status !== "open" &&
      status !== "resolved"
    ) {
      return NextResponse.json(
        {
          message:
            "Status must be either open or resolved.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 4. Database
    // --------------------------------

    await connectDB();

    // IMPORTANT TENANT ISOLATION:
    //
    // A conversation can only be updated
    // when its ID belongs to the authenticated
    // business.
    const conversation =
      await Conversation.findOneAndUpdate(
        {
          _id:
            new mongoose.Types.ObjectId(id),

          businessId:
            new mongoose.Types.ObjectId(
              session.businessId
            ),
        },
        {
          $set: {
            status,
          },
        },
        {
          new: true,
        }
      ).lean();

    if (!conversation) {
      return NextResponse.json(
        {
          message:
            "Conversation not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------
    // 5. Response
    // --------------------------------

    return NextResponse.json({
      success: true,

      conversation: {
        id:
          conversation._id.toString(),

        customerId:
          conversation.customerId,

        customerName:
          conversation.customerName ||
          "Website Visitor",

        status:
          conversation.status,

        messages:
          conversation.messages || [],

        lastMessageAt:
          conversation.lastMessageAt,

        createdAt:
          conversation.createdAt,

        updatedAt:
          conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Conversation PATCH error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update conversation.",
      },
      {
        status: 500,
      }
    );
  }
}