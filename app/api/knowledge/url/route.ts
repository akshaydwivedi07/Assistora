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

import * as cheerio from "cheerio";

export const runtime = "nodejs";

const MAX_PAGES = 20;
const MAX_CONTENT_PER_PAGE = 50_000;
const REQUEST_TIMEOUT = 15_000;

// --------------------------------
// Normalize URL
// --------------------------------

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    parsed.hash = "";

    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ];

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });

    return parsed.toString();
  } catch {
    return null;
  }
}

// --------------------------------
// Same domain
// --------------------------------

function isSameDomain(
  url: string,
  baseUrl: URL
) {
  try {
    const parsed = new URL(url);

    return (
      parsed.hostname ===
      baseUrl.hostname
    );
  } catch {
    return false;
  }
}

// --------------------------------
// Valid page URL
// --------------------------------

function isValidPageUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (
      !["http:", "https:"].includes(
        parsed.protocol
      )
    ) {
      return false;
    }

    const pathname =
      parsed.pathname.toLowerCase();

    const blockedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".ico",
      ".mp4",
      ".mp3",
      ".avi",
      ".mov",
      ".zip",
      ".rar",
      ".7z",
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".css",
      ".js",
      ".json",
      ".xml",
    ];

    return !blockedExtensions.some(
      (extension) =>
        pathname.endsWith(extension)
    );
  } catch {
    return false;
  }
}

// --------------------------------
// Extract page content + links
// --------------------------------

function extractPage(
  html: string,
  pageUrl: string
) {
  const $ = cheerio.load(html);

  const title =
    $("title")
      .first()
      .text()
      .trim();

  $(
    "script, style, noscript, iframe, svg, canvas, nav, footer, header"
  ).remove();

  const headings =
    $("h1, h2, h3")
      .map(
        (_, element) =>
          $(element)
            .text()
            .trim()
      )
      .get()
      .filter(Boolean)
      .join("\n");

  const bodyText =
    $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

  const content = [
    `URL: ${pageUrl}`,

    title
      ? `Title: ${title}`
      : "",

    headings
      ? `Headings:\n${headings}`
      : "",

    bodyText
      ? `Content:\n${bodyText}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const links: string[] = [];

  $("a[href]").each(
    (_, element) => {
      const href =
        $(element).attr("href");

      if (!href) {
        return;
      }

      try {
        const absoluteUrl =
          new URL(
            href,
            pageUrl
          ).toString();

        const normalized =
          normalizeUrl(
            absoluteUrl
          );

        if (
          normalized &&
          isValidPageUrl(
            normalized
          )
        ) {
          links.push(
            normalized
          );
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  );

  return {
    title,
    content:
      content.slice(
        0,
        MAX_CONTENT_PER_PAGE
      ),
    links,
  };
}

// --------------------------------
// Fetch page
// --------------------------------

async function fetchPage(
  url: string
) {
  const response =
    await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AssistoraBot/1.0)",

        Accept:
          "text/html,application/xhtml+xml",
      },

      signal:
        AbortSignal.timeout(
          REQUEST_TIMEOUT
        ),
    });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "text/html"
    )
  ) {
    throw new Error(
      "Not an HTML page"
    );
  }

  return response.text();
}

// --------------------------------
// POST - Crawl website
// --------------------------------

export async function POST(
  request: Request
) {
  console.log(
    "🔥 WEBSITE CRAWLER API CALLED"
  );

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

    const businessObjectId =
      new mongoose.Types.ObjectId(
        session.businessId
      );

    const userObjectId =
      new mongoose.Types.ObjectId(
        session.userId
      );

    // --------------------------------
    // 3. Request body
    // --------------------------------

    const body =
      await request.json();

    const inputUrl =
      typeof body?.url === "string"
        ? body.url.trim()
        : "";

    if (!inputUrl) {
      return NextResponse.json(
        {
          message:
            "Website URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (inputUrl.length > 2048) {
      return NextResponse.json(
        {
          message:
            "Website URL is too long.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 4. Normalize URL
    // --------------------------------

    const normalizedStart =
      normalizeUrl(inputUrl);

    if (!normalizedStart) {
      return NextResponse.json(
        {
          message:
            "Please enter a valid HTTP or HTTPS URL.",
        },
        {
          status: 400,
        }
      );
    }

    const baseUrl =
      new URL(
        normalizedStart
      );

    // --------------------------------
    // 5. Database
    // --------------------------------

    await connectDB();

    // IMPORTANT TENANT ISOLATION:
    //
    // The business must belong to the
    // authenticated user.
    //
    // We do NOT trust businessId from
    // request body.
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
    // 6. Crawl setup
    // --------------------------------

    const queue: string[] = [
      normalizedStart,
    ];

    const visited =
      new Set<string>();

    const pages: {
      url: string;
      title: string;
      content: string;
    }[] = [];

    const failedPages: {
      url: string;
      error: string;
    }[] = [];

    // --------------------------------
    // 7. Crawl pages
    // --------------------------------

    while (
      queue.length > 0 &&
      pages.length < MAX_PAGES
    ) {
      const currentUrl =
        queue.shift();

      if (!currentUrl) {
        break;
      }

      const normalized =
        normalizeUrl(
          currentUrl
        );

      if (!normalized) {
        continue;
      }

      if (
        visited.has(
          normalized
        )
      ) {
        continue;
      }

      if (
        !isSameDomain(
          normalized,
          baseUrl
        )
      ) {
        continue;
      }

      if (
        !isValidPageUrl(
          normalized
        )
      ) {
        continue;
      }

      visited.add(
        normalized
      );

      console.log(
        `🤖 Assistora crawler: ${normalized}`
      );

      console.log(
        `   Queue: ${queue.length} | Pages: ${pages.length}`
      );

      try {
        const html =
          await fetchPage(
            normalized
          );

        const result =
          extractPage(
            html,
            normalized
          );

        if (
          result.content.length >=
          50
        ) {
          pages.push({
            url: normalized,

            title:
              result.title ||
              normalized,

            content:
              result.content,
          });

          console.log(
            `   ✅ Page extracted: ${
              result.title ||
              normalized
            }`
          );
        }

        // --------------------------------
        // Discover links
        // --------------------------------

        for (
          const link of
            result.links
        ) {
          if (
            visited.has(link)
          ) {
            continue;
          }

          if (
            !isSameDomain(
              link,
              baseUrl
            )
          ) {
            continue;
          }

          if (
            !isValidPageUrl(
              link
            )
          ) {
            continue;
          }

          if (
            !queue.includes(
              link
            )
          ) {
            queue.push(
              link
            );
          }
        }

        console.log(
          `   🔗 Discovered links: ${result.links.length}`
        );

        console.log(
          `   📋 Queue now: ${queue.length}`
        );
      } catch (error) {
        console.error(
          `   ❌ Failed: ${normalized}`,
          error
        );

        failedPages.push({
          url: normalized,

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    console.log(
      "================================"
    );

    console.log(
      "🤖 CRAWLER FINISHED"
    );

    console.log(
      `Pages crawled: ${pages.length}`
    );

    console.log(
      `Pages failed: ${failedPages.length}`
    );

    console.log(
      `Pages visited: ${visited.size}`
    );

    console.log(
      "================================"
    );

    // --------------------------------
    // 8. No content
    // --------------------------------

    if (!pages.length) {
      return NextResponse.json(
        {
          message:
            "Could not extract readable content from the website.",

          pagesCrawled: 0,

          failedPages,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // 9. Combine content
    // --------------------------------

    const combinedContent =
      pages
        .map(
          (page) =>
            `PAGE: ${page.title}\nURL: ${page.url}\n\n${page.content}`
        )
        .join(
          "\n\n------------------------------\n\n"
        );

    // --------------------------------
    // 10. Create source
    // --------------------------------

    const source =
      await KnowledgeSource.create({
        // IMPORTANT:
        // Use the verified tenant ID.
        businessId:
          businessObjectId,

        name:
          `${baseUrl.hostname} website`,

        type:
          "website",

        content:
          combinedContent,

        status:
          "processing",

        chunks: 0,

        metadata: {
          url:
            normalizedStart,

          hostname:
            baseUrl.hostname,

          pagesCrawled:
            pages.length,

          pagesFailed:
            failedPages.length,

          maxPages:
            MAX_PAGES,
        },
      });

    try {
      // --------------------------------
      // 11. Chunk
      // --------------------------------

      const chunks =
        chunkText(
          combinedContent
        );

      console.log(
        `🧩 Created ${chunks.length} chunks`
      );

      if (
        !chunks.length
      ) {
        throw new Error(
          "No usable chunks were created."
        );
      }

      // --------------------------------
      // 12. Embeddings
      // --------------------------------

      const chunkDocuments = [];

      for (
        let index = 0;
        index < chunks.length;
        index++
      ) {
        const content =
          chunks[index];

        console.log(
          `🧠 Creating embedding ${
            index + 1
          }/${chunks.length}`
        );

        const embedding =
          await createEmbedding(
            content,
            "retrieval.passage"
          );

        chunkDocuments.push({
          // IMPORTANT:
          // Same verified tenant ID
          // as the source.
          businessId:
            businessObjectId,

          sourceId:
            source._id,

          content,

          chunkIndex:
            index,

          embedding,
        });
      }

      // --------------------------------
      // 13. Save chunks
      // --------------------------------

      await KnowledgeChunk.insertMany(
        chunkDocuments
      );

      // --------------------------------
      // 14. Ready
      // --------------------------------

      source.status =
        "ready";

      source.chunks =
        chunks.length;

      await source.save();

      console.log(
        "🎉 Website successfully imported"
      );

      // --------------------------------
      // 15. Response
      // --------------------------------

      return NextResponse.json({
        success: true,

        message:
          "Website crawled and imported successfully.",

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

          url:
            normalizedStart,

          pagesCrawled:
            pages.length,

          pagesFailed:
            failedPages.length,
        },
      });
    } catch (
      processingError
    ) {
      console.error(
        "Website processing error:",
        processingError
      );

      // IMPORTANT:
      // Remove chunks created for this source
      // if embedding/processing fails.
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
      "Website crawler error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to crawl website.",
      },
      {
        status: 500,
      }
    );
  }
}