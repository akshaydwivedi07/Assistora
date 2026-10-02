import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import Conversation from "@/models/Conversation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // --------------------------------
    // 1. Authentication
    // --------------------------------

    const cookieStore = await cookies();

    const token =
      cookieStore.get(
        "assistora_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        {
          message: "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // 2. Validate business ID
    // --------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        session.businessId
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid business session.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // 3. Query params
    // --------------------------------

    const { searchParams } =
      new URL(request.url);

    const status =
      searchParams.get("status") ||
      "all";

    const search =
      searchParams.get("search") ||
      "";

    // --------------------------------
    // 4. Database
    // --------------------------------

    await connectDB();

    // IMPORTANT:
    // Every conversation query is scoped
    // to the authenticated tenant.
    const filter: Record<
      string,
      unknown
    > = {
      businessId:
        new mongoose.Types.ObjectId(
          session.businessId
        ),
    };

    // --------------------------------
    // 5. Status filter
    // --------------------------------

    if (
      status === "open" ||
      status === "resolved"
    ) {
      filter.status = status;
    }

    // --------------------------------
    // 6. Search filter
    // --------------------------------

    const cleanedSearch =
      search.trim();

    if (cleanedSearch) {
      // Escape regex special characters so
      // user input cannot create an unintended
      // regular expression.
      const escapedSearch =
        cleanedSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex =
        new RegExp(
          escapedSearch,
          "i"
        );

      filter.$or = [
        {
          customerName:
            regex,
        },
        {
          customerId:
            regex,
        },
        {
          "messages.content":
            regex,
        },
      ];
    }

    // --------------------------------
    // 7. Fetch conversations
    // --------------------------------

    const conversations =
      await Conversation.find(
        filter
      )
        .sort({
          lastMessageAt: -1,
        })
        .lean();

    // --------------------------------
    // 8. Response
    // --------------------------------

    return NextResponse.json({
      conversations:
        conversations.map(
          (conversation) => {
            const messages =
              conversation.messages ||
              [];

            const lastMessage =
              messages.length
                ? messages[
                    messages.length - 1
                  ]
                : null;

            return {
              id:
                conversation._id.toString(),

              customerId:
                conversation.customerId,

              customerName:
                conversation.customerName ||
                "Website Visitor",

              status:
                conversation.status,

              messageCount:
                messages.length,

              lastMessage:
                lastMessage?.content ||
                "",

              lastMessageRole:
                lastMessage?.role ||
                null,

              lastMessageAt:
                conversation.lastMessageAt,

              createdAt:
                conversation.createdAt,

              updatedAt:
                conversation.updatedAt,
            };
          }
        ),
    });
  } catch (error) {
    console.error(
      "Conversations GET error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load conversations.",
      },
      {
        status: 500,
      }
    );
  }
}