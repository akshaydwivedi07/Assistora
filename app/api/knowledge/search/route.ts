import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import KnowledgeChunk from "@/models/KnowledgeChunk";
import { createEmbedding } from "@/lib/embeddings";

async function getSession() {
  const cookieStore = await cookies();

  const session = cookieStore.get(
    "assistora_session"
  );

  if (!session?.value) {
    return null;
  }

  return await verifySessionToken(session.value);
}

export async function POST(request: Request) {
  try {
    // -----------------------------
    // 1. Authenticate user
    // -----------------------------

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // -----------------------------
    // 2. Read question
    // -----------------------------

    const body = await request.json();

    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        {
          message: "Question is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 3. Create query embedding
    // -----------------------------

    const queryEmbedding = await createEmbedding(
      question,
      "retrieval.query"
    );

    // -----------------------------
    // 4. Connect MongoDB
    // -----------------------------

    await connectDB();

    // -----------------------------
    // 5. Convert businessId
    // -----------------------------

    const businessObjectId =
      new mongoose.Types.ObjectId(
        session.businessId
      );

    // -----------------------------
    // 6. Vector Search
    // -----------------------------

    const results =
      await KnowledgeChunk.aggregate([
        {
          $vectorSearch: {
            index:
              "knowledge_vector_index",

            path: "embedding",

            queryVector: queryEmbedding,

            numCandidates: 50,

            limit: 5,

            filter: {
              businessId: businessObjectId,
            },
          },
        },

        // -----------------------------
        // 7. Return relevant fields
        // -----------------------------

        {
          $project: {
            _id: 0,

            content: 1,

            sourceId: 1,

            chunkIndex: 1,

            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ]);

    // -----------------------------
    // 8. Return results
    // -----------------------------

    return NextResponse.json({
      question,

      results: results.map((result) => ({
        content: result.content,
        sourceId:
          result.sourceId?.toString(),
        chunkIndex: result.chunkIndex,
        score: result.score,
      })),
    });
  } catch (error) {
    console.error(
      "Knowledge search error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to search knowledge base.",
      },
      { status: 500 }
    );
  }
}