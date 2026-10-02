import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import KnowledgeChunk from "@/models/KnowledgeChunk";
import { createEmbedding } from "@/lib/embeddings";

export async function searchKnowledge(
  question: string,
  businessId: string,
  limit = 5
) {
  // Validate business ID before doing anything else
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    throw new Error("Invalid business ID.");
  }

  // Clean the question
  const cleanedQuestion = question.trim();

  if (!cleanedQuestion) {
    return [];
  }

  // Prevent invalid/huge limits
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  // Create embedding for the user's question
  const queryEmbedding = await createEmbedding(
    cleanedQuestion,
    "retrieval.query"
  );

  await connectDB();

  const businessObjectId = new mongoose.Types.ObjectId(
    businessId
  );

  const results = await KnowledgeChunk.aggregate([
    {
      $vectorSearch: {
        index: "knowledge_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,

        // Search a larger candidate pool for better retrieval
        numCandidates: Math.max(safeLimit * 10, 50),

        limit: safeLimit,

        // IMPORTANT:
        // Only retrieve chunks belonging to this business.
        filter: {
          businessId: businessObjectId,
        },
      },
    },

    {
      $project: {
        _id: 0,
        content: 1,
        sourceId: 1,
        chunkIndex: 1,
        businessId: 1,

        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  // Extra defense-in-depth check.
  // Even though Atlas already filters by businessId,
  // we verify the returned documents again.
  return results.filter(
    (result) =>
      result.businessId?.toString() === businessId
  );
}