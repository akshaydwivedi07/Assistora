import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

import Business from "@/models/Business";
import Conversation from "@/models/Conversation";
import KnowledgeSource from "@/models/KnowledgeSource";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("assistora_session")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(session.businessId) ||
      !mongoose.Types.ObjectId.isValid(session.userId)
    ) {
      return NextResponse.json(
        { message: "Invalid session data" },
        { status: 401 }
      );
    }

    await connectDB();

    const businessId = new mongoose.Types.ObjectId(
      session.businessId
    );

    const userId = new mongoose.Types.ObjectId(
      session.userId
    );

    // Verify business ownership
    const business = await Business.findOne({
      _id: businessId,
      ownerId: userId,
    }).lean();

    if (!business) {
      return NextResponse.json(
        { message: "Business not found." },
        { status: 404 }
      );
    }

    const [
      totalConversations,
      resolvedConversations,
      totalKnowledgeSources,
      messageStats,
      recentConversations,
      responseStats,
    ] = await Promise.all([
      // Total conversations
      Conversation.countDocuments({
        businessId,
      }),

      // Resolved conversations
      Conversation.countDocuments({
        businessId,
        status: "resolved",
      }),

      // Knowledge sources
      KnowledgeSource.countDocuments({
        businessId,
      }),

      // Total messages
      Conversation.aggregate([
        {
          $match: {
            businessId,
          },
        },
        {
          $project: {
            messageCount: {
              $size: {
                $ifNull: ["$messages", []],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMessages: {
              $sum: "$messageCount",
            },
          },
        },
      ]),

      // Recent conversations
      Conversation.find({
        businessId,
      })
        .sort({
          lastMessageAt: -1,
        })
        .limit(5)
        .select(
          "_id customerName status messages lastMessageAt createdAt"
        )
        .lean(),

      // Calculate average AI response time
      Conversation.aggregate([
        {
          $match: {
            businessId,
          },
        },
        {
          $unwind: "$messages",
        },
        {
          $sort: {
            "messages.createdAt": 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            messages: {
              $push: {
                role: "$messages.role",
                createdAt: "$messages.createdAt",
              },
            },
          },
        },
        {
          $project: {
            responseTimes: {
              $map: {
                input: {
                  $range: [
                    0,
                    {
                      $subtract: [
                        { $size: "$messages" },
                        1,
                      ],
                    },
                  ],
                },
                as: "index",
                in: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.role",
                                "$$index",
                              ],
                            },
                            "user",
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.role",
                                {
                                  $add: [
                                    "$$index",
                                    1,
                                  ],
                                },
                              ],
                            },
                            "assistant",
                          ],
                        },
                      ],
                    },
                    {
                      $subtract: [
                        {
                          $arrayElemAt: [
                            "$messages.createdAt",
                            {
                              $add: [
                                "$$index",
                                1,
                              ],
                            },
                          ],
                        },
                        {
                          $arrayElemAt: [
                            "$messages.createdAt",
                            "$$index",
                          ],
                        },
                      ],
                    },
                    null,
                  ],
                },
              },
            },
          },
        },
        {
          $unwind: "$responseTimes",
        },
        {
          $match: {
            responseTimes: {
              $ne: null,
              $gte: 0,
            },
          },
        },
        {
          $group: {
            _id: null,
            averageResponseTime: {
              $avg: "$responseTimes",
            },
            responseCount: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const totalMessages =
      messageStats[0]?.totalMessages || 0;

    // Average response time is returned by MongoDB in milliseconds.
    const averageResponseMilliseconds =
      responseStats[0]?.averageResponseTime || 0;

    let responseTime = "—";

    if (averageResponseMilliseconds > 0) {
      const seconds =
        averageResponseMilliseconds / 1000;

      if (seconds < 60) {
        responseTime = `${seconds.toFixed(1)}s`;
      } else {
        const minutes = seconds / 60;

        responseTime =
          minutes < 60
            ? `${minutes.toFixed(1)}m`
            : `${(minutes / 60).toFixed(1)}h`;
      }
    }

    const formattedRecentConversations =
      recentConversations.map((conversation) => {
        const messages =
          conversation.messages || [];

        const lastMessage =
          messages.length > 0
            ? messages[messages.length - 1]
            : null;

        return {
          id: conversation._id.toString(),

          customerName:
            conversation.customerName ||
            "Website Visitor",

          status: conversation.status,

          messageCount: messages.length,

          lastMessage:
            lastMessage?.content ||
            "No messages yet",

          lastMessageAt:
            conversation.lastMessageAt,

          createdAt:
            conversation.createdAt,
        };
      });

    return NextResponse.json({
      business: {
        name: business.name,
        plan: business.plan,
        industry: business.industry,
        website: business.website,
      },

      agent: {
        enabled:
          business.aiAgent?.enabled ?? true,

        name:
          business.aiAgent?.name ||
          "Assistora AI",
      },

      stats: {
        conversations:
          totalConversations,

        resolved:
          resolvedConversations,

        knowledgeSources:
          totalKnowledgeSources,

        responseTime,

        totalMessages,
      },

      recentConversations:
        formattedRecentConversations,
    });
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to load dashboard stats.",
      },
      { status: 500 }
    );
  }
}