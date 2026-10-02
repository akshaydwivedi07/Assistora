import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

import Business from "@/models/Business";
import KnowledgeSource from "@/models/KnowledgeSource";
import KnowledgeChunk from "@/models/KnowledgeChunk";

import { chunkText } from "@/lib/chunkText";
import { createEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

const DEFAULT_INSTRUCTIONS =
  "Help customers with questions about products, orders, returns and delivery.";

async function getAuthenticatedBusiness() {
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
    ) ||
    !mongoose.Types.ObjectId.isValid(
      session.userId
    )
  ) {
    return null;
  }

  await connectDB();

  // IMPORTANT:
  // Both the business and owner must match
  // the authenticated session.
  const business =
    await Business.findOne({
      _id: new mongoose.Types.ObjectId(
        session.businessId
      ),
      ownerId: new mongoose.Types.ObjectId(
        session.userId
      ),
    });

  if (!business) {
    return null;
  }

  return {
    business,
    businessId: new mongoose.Types.ObjectId(
      session.businessId
    ),
  };
}

// --------------------------------
// GET - List knowledge sources
// --------------------------------

export async function GET() {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if (!auth) {
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

    const { businessId } = auth;

    const sources =
      await KnowledgeSource.find({
        // IMPORTANT TENANT FILTER
        businessId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json({
      sources:
        sources.map(
          (source) => ({
            id:
              source._id.toString(),

            name:
              source.name,

            type:
              source.type,

            status:
              source.status,

            chunks:
              source.chunks || 0,

            createdAt:
              source.createdAt,

            updatedAt:
              source.updatedAt,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Knowledge GET error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load knowledge sources.",
      },
      {
        status: 500,
      }
    );
  }
}

// --------------------------------
// POST - Add text / FAQ
// --------------------------------

export async function POST(
  request: Request
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if (!auth) {
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

    const { businessId } =
      auth;

    const body =
      await request.json();

    const name =
      typeof body?.name ===
      "string"
        ? body.name.trim()
        : "";

    const content =
      typeof body?.content ===
      "string"
        ? body.content.trim()
        : "";

    const type =
      body?.type === "faq"
        ? "faq"
        : "text";

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Source name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          message:
            "Knowledge content is required.",
        },
        {
          status: 400,
        }
      );
    }

    // Prevent extremely large text submissions.
    if (content.length > 100000) {
      return NextResponse.json(
        {
          message:
            "Knowledge content is too large. Maximum 100,000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Create source
    // --------------------------------

    const source =
      await KnowledgeSource.create({
        // IMPORTANT:
        // Never use businessId from request body.
        businessId,

        name,

        type,

        content,

        status:
          "processing",

        chunks: 0,
      });

    try {
      // --------------------------------
      // Chunk text
      // --------------------------------

      const chunks =
        chunkText(content);

      if (!chunks.length) {
        throw new Error(
          "No usable content chunks were created."
        );
      }

      console.log(
        `📚 ${name} → ${chunks.length} chunks`
      );

      // --------------------------------
      // Generate embeddings
      // --------------------------------

      const chunkDocuments = [];

      for (
        let index = 0;
        index < chunks.length;
        index++
      ) {
        const chunk =
          chunks[index];

        console.log(
          `🧠 Embedding ${index + 1}/${chunks.length}`
        );

        const embedding =
          await createEmbedding(
            chunk,
            "retrieval.passage"
          );

        chunkDocuments.push({
          // IMPORTANT TENANT FILTER
          businessId,

          sourceId:
            source._id,

          content:
            chunk,

          chunkIndex:
            index,

          embedding,
        });
      }

      // --------------------------------
      // Save chunks
      // --------------------------------

      await KnowledgeChunk.insertMany(
        chunkDocuments
      );

      // --------------------------------
      // Mark source ready
      // --------------------------------

      source.status =
        "ready";

      source.chunks =
        chunks.length;

      await source.save();

      return NextResponse.json({
        success: true,

        source: {
          id:
            source._id.toString(),

          name:
            source.name,

          type:
            source.type,

          status:
            source.status,

          chunks:
            source.chunks,

          createdAt:
            source.createdAt,

          updatedAt:
            source.updatedAt,
        },
      });
    } catch (
      processingError
    ) {
      console.error(
        "Knowledge processing error:",
        processingError
      );

      // Delete chunks created for this
      // source if processing fails.
      await KnowledgeChunk.deleteMany({
        sourceId:
          source._id,

        businessId,
      });

      source.status =
        "failed";

      source.chunks = 0;

      await source.save();

      throw processingError;
    }
  } catch (error) {
    console.error(
      "Knowledge POST error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to add knowledge source.",
      },
      {
        status: 500,
      }
    );
  }
}

// --------------------------------
// DELETE - Delete source + chunks
// --------------------------------

export async function DELETE(
  request: Request
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if (!auth) {
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

    const { businessId } =
      auth;

    // --------------------------------
    // Read source ID
    // --------------------------------

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          message:
            "Knowledge source ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid knowledge source ID.",
        },
        {
          status: 400,
        }
      );
    }

    const sourceId =
      new mongoose.Types.ObjectId(id);

    // --------------------------------
    // Find source
    // --------------------------------

    // IMPORTANT:
    // Source ID alone is NOT enough.
    // Business ID must also match.
    const source =
      await KnowledgeSource.findOne({
        _id: sourceId,

        businessId,
      });

    if (!source) {
      return NextResponse.json(
        {
          message:
            "Knowledge source not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------
    // Delete chunks
    // --------------------------------

    await KnowledgeChunk.deleteMany({
      sourceId:
        source._id,

      businessId,
    });

    // --------------------------------
    // Delete source
    // --------------------------------

    await KnowledgeSource.deleteOne({
      _id:
        source._id,

      businessId,
    });

    return NextResponse.json({
      success: true,

      message:
        "Knowledge source deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Knowledge DELETE error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete knowledge source.",
      },
      {
        status: 500,
      }
    );
  }
}