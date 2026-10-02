import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import UsageEvent from "@/models/UsageEvent";

export const runtime = "nodejs";

export async function GET() {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

    const cookieStore =
      await cookies();

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
      await verifySessionToken(
        token
      );

    if (!session) {
      return NextResponse.json(
        {
          message:
            "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // Database
    // --------------------------------

    await connectDB();

    // --------------------------------
    // Date range
    // Last 30 days
    // --------------------------------

    const now =
      new Date();

    const startDate =
      new Date();

    startDate.setDate(
      now.getDate() - 29
    );

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    // --------------------------------
    // Get conversations
    // --------------------------------

    const conversations =
      await Conversation.find({
        businessId:
          session.businessId,

        createdAt: {
          $gte: startDate,
          $lte: now,
        },
      })
        .select(
          "customerName customerId status messages createdAt lastMessageAt"
        )
        .lean();

    // --------------------------------
    // Basic conversation metrics
    // --------------------------------

    const totalConversations =
      conversations.length;

    const openConversations =
      conversations.filter(
        (conversation) =>
          conversation.status ===
          "open"
      ).length;

    const resolvedConversations =
      conversations.filter(
        (conversation) =>
          conversation.status ===
          "resolved"
      ).length;

    const totalMessages =
      conversations.reduce(
        (total, conversation) =>
          total +
          (conversation.messages
            ?.length || 0),
        0
      );

    const averageMessages =
      totalConversations > 0
        ? Number(
            (
              totalMessages /
              totalConversations
            ).toFixed(1)
          )
        : 0;

    const resolutionRate =
      totalConversations > 0
        ? Math.round(
            (resolvedConversations /
              totalConversations) *
              100
          )
        : 0;

    // --------------------------------
    // Usage events
    // --------------------------------

    const usageStats =
      await UsageEvent.aggregate([
        {
          $match: {
            businessId:
              session.businessId,

            createdAt: {
              $gte: startDate,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    // --------------------------------
    // Convert usage stats to object
    // --------------------------------

    let customerMessages = 0;
    let knowledgeSearches = 0;
    let aiResponses = 0;

    for (const item of usageStats) {
      if (
        item._id ===
        "customer_message"
      ) {
        customerMessages =
          item.count;
      }

      if (
        item._id ===
        "knowledge_search"
      ) {
        knowledgeSearches =
          item.count;
      }

      if (
        item._id ===
        "ai_response"
      ) {
        aiResponses =
          item.count;
      }
    }

    // --------------------------------
    // Daily analytics
    // --------------------------------

    const dailyMap =
      new Map<
        string,
        {
          conversations: number;
          messages: number;
        }
      >();

    for (
      let i = 0;
      i < 30;
      i++
    ) {
      const date =
        new Date();

      date.setDate(
        now.getDate() -
          (29 - i)
      );

      const key =
        date
          .toISOString()
          .slice(0, 10);

      dailyMap.set(
        key,
        {
          conversations: 0,
          messages: 0,
        }
      );
    }

    for (
      const conversation of
        conversations
    ) {
      const key =
        new Date(
          conversation.createdAt
        )
          .toISOString()
          .slice(0, 10);

      const existing =
        dailyMap.get(key);

      if (!existing) {
        continue;
      }

      existing.conversations +=
        1;

      existing.messages +=
        conversation.messages
          ?.length || 0;
    }

    const daily =
      Array.from(
        dailyMap.entries()
      ).map(
        ([
          date,
          values,
        ]) => ({
          date,

          label:
            new Date(
              `${date}T00:00:00`
            ).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
              }
            ),

          conversations:
            values.conversations,

          messages:
            values.messages,
        })
      );

    // --------------------------------
    // Top customer questions
    // --------------------------------

    const questionMap =
      new Map<
        string,
        {
          question: string;
          count: number;
        }
      >();

    for (
      const conversation of
        conversations
    ) {
      for (
        const message of
          conversation.messages ||
        []
      ) {
        if (
          message.role !==
          "user"
        ) {
          continue;
        }

        const question =
          message.content
            ?.trim()
            .replace(/\s+/g, " ");

        if (
          !question ||
          question.length < 3
        ) {
          continue;
        }

        const normalized =
          question.toLowerCase();

        const existing =
          questionMap.get(
            normalized
          );

        if (existing) {
          existing.count += 1;
        } else {
          questionMap.set(
            normalized,
            {
              question,
              count: 1,
            }
          );
        }
      }
    }

    const topQuestions =
      Array.from(
        questionMap.values()
      )
        .sort(
          (a, b) =>
            b.count - a.count
        )
        .slice(0, 5);

    // --------------------------------
    // Return
    // --------------------------------

    return NextResponse.json({
      period: {
        start:
          startDate,

        end:
          now,

        days: 30,
      },

      summary: {
        // Existing metrics
        totalConversations,

        openConversations,

        resolvedConversations,

        resolutionRate,

        totalMessages,

        averageMessages,

        // Usage metrics
        customerMessages,

        knowledgeSearches,

        aiResponses,
      },

      daily,

      topQuestions,
    });
  } catch (error) {
    console.error(
      "Analytics GET error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load analytics.",
      },
      {
        status: 500,
      }
    );
  }
}