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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "txt",
  "csv",
];

function getExtension(filename: string) {
  return (
    filename
      .split(".")
      .pop()
      ?.toLowerCase() || ""
  );
}

async function extractPdfText(
  buffer: Buffer
) {
  const {
    getDocumentProxy,
    extractText,
  } = await import("unpdf");

  const pdf =
    await getDocumentProxy(
      new Uint8Array(buffer)
    );

  const {
    totalPages,
    text,
  } = await extractText(pdf, {
    mergePages: true,
  });

  return {
    text: text.trim(),
    pages: totalPages,
  };
}

async function extractDocxText(
  buffer: Buffer
) {
  const mammoth =
    await import("mammoth");

  const result =
    await mammoth.extractRawText({
      buffer,
    });

  return {
    text: result.value.trim(),
    pages: 0,
  };
}

function extractTextFile(
  buffer: Buffer
) {
  return {
    text: buffer
      .toString("utf-8")
      .trim(),

    pages: 0,
  };
}

export async function POST(
  request: Request
) {
  let createdSourceId:
    | mongoose.Types.ObjectId
    | null = null;

  try {
    // --------------------------------
    // 1. Authentication
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
          message:
            "Unauthorized",
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
    // 2. Validate session IDs
    // --------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        session.businessId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        session.userId
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid session data.",
        },
        {
          status: 401,
        }
      );
    }

    // Convert the session IDs once and use
    // these verified IDs throughout the request.
    const businessObjectId =
      new mongoose.Types.ObjectId(
        session.businessId
      );

    const userObjectId =
      new mongoose.Types.ObjectId(
        session.userId
      );

    // --------------------------------
    // 3. Database
    // --------------------------------

    await connectDB();

    // IMPORTANT TENANT ISOLATION:
    //
    // Verify that the authenticated user actually
    // owns the business stored in the session.
    //
    // We never accept businessId from FormData/body.
    const business =
      await Business.findOne({
        _id: businessObjectId,
        ownerId: userObjectId,
      }).lean();

    if (!business) {
      return NextResponse.json(
        {
          message:
            "Business not found or access denied.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------
    // 4. Get uploaded file
    // --------------------------------

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message:
            "Please upload a file.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 5. Validate file extension
    // --------------------------------

    const extension =
      getExtension(
        file.name
      );

    if (
      !ALLOWED_EXTENSIONS.includes(
        extension
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Unsupported file type. Supported: PDF, DOCX, TXT and CSV.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 6. Validate file size
    // --------------------------------

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          message:
            "File size must be less than 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          message:
            "Uploaded file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 7. Read file
    // --------------------------------

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    // --------------------------------
    // 8. Extract text
    // --------------------------------

    let extractedText = "";
    let totalPages = 0;

    if (
      extension === "pdf"
    ) {
      const result =
        await extractPdfText(
          buffer
        );

      extractedText =
        result.text;

      totalPages =
        result.pages;
    } else if (
      extension === "docx"
    ) {
      const result =
        await extractDocxText(
          buffer
        );

      extractedText =
        result.text;
    } else if (
      extension === "txt" ||
      extension === "csv"
    ) {
      const result =
        extractTextFile(
          buffer
        );

      extractedText =
        result.text;
    }

    if (!extractedText) {
      return NextResponse.json(
        {
          message:
            "Could not extract readable text from this file.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 9. Create knowledge source
    // --------------------------------

    // IMPORTANT:
    // Always use businessObjectId obtained from
    // the verified authenticated session.
    const source =
      await KnowledgeSource.create({
        businessId:
          businessObjectId,

        name:
          file.name,

        type:
          extension === "pdf" ||
          extension === "docx"
            ? "document"
            : "text",

        content:
          extractedText,

        status:
          "processing",

        chunks: 0,

        metadata: {
          filename:
            file.name,

          extension,

          size:
            file.size,

          pages:
            totalPages,
        },
      });

    createdSourceId =
      source._id;

    try {
      // --------------------------------
      // 10. Chunk text
      // --------------------------------

      const chunks =
        chunkText(
          extractedText
        );

      console.log(
        `📄 ${file.name} → ${chunks.length} chunks`
      );

      if (
        !chunks.length
      ) {
        throw new Error(
          "No usable text chunks were created."
        );
      }

      // --------------------------------
      // 11. Generate embeddings
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
          // IMPORTANT:
          // Same verified tenant ID as source.
          businessId:
            businessObjectId,

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
      // 12. Save chunks
      // --------------------------------

      await KnowledgeChunk.insertMany(
        chunkDocuments
      );

      // --------------------------------
      // 13. Mark source ready
      // --------------------------------

      source.status =
        "ready";

      source.chunks =
        chunks.length;

      await source.save();

      console.log(
        `✅ ${file.name} imported successfully`
      );

      // --------------------------------
      // 14. Response
      // --------------------------------

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

        file: {
          name:
            file.name,

          type:
            extension,

          size:
            file.size,

          pages:
            totalPages,
        },
      });
    } catch (
      processingError
    ) {
      console.error(
        "Knowledge file processing error:",
        processingError
      );

      // --------------------------------
      // Cleanup chunks created for this
      // source during failed processing.
      // --------------------------------

      await KnowledgeChunk.deleteMany({
        sourceId:
          source._id,

        businessId:
          businessObjectId,
      });

      source.status =
        "failed";

      source.chunks = 0;

      await source.save();

      throw processingError;
    }
  } catch (error) {
    console.error(
      "Knowledge upload error:",
      error
    );

    // --------------------------------
    // Extra cleanup protection
    // --------------------------------

    if (createdSourceId) {
      try {
        await KnowledgeChunk.deleteMany({
          sourceId:
            createdSourceId,

          businessId:
            new mongoose.Types.ObjectId(
              sessionBusinessIdFromError(error)
            ),
        });
      } catch {
        // Ignore cleanup errors here.
      }
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to process uploaded file.",
      },
      {
        status: 500,
      }
    );
  }
}

// --------------------------------
// Cleanup helper
// --------------------------------
//
// This intentionally returns an empty value because
// normal processing cleanup is already handled inside
// the processing try/catch using the verified
// businessObjectId.
//
// It exists only to avoid using an unverified ID in
// the outer catch block.
//

function sessionBusinessIdFromError(
  error: unknown
) {
  return "";
}