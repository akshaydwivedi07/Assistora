import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import User from "@/models/User";
import Business from "@/models/Business";
import KnowledgeChunk from "@/models/KnowledgeChunk";
import KnowledgeSource from "@/models/KnowledgeSource";
import Conversation from "@/models/Conversation";
import UsageEvent from "@/models/UsageEvent";
import VerificationToken from "@/models/VerificationToken";
import PasswordResetToken from "@/models/PasswordResetToken";

const USER_NAME_MAX = 120;

function sanitizeUser(user: { _id: { toString(): string }; name: string; email: string; emailVerified: boolean; emailVerifiedAt?: Date | null; businessId?: { toString(): string } | null }) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    businessId: user.businessId ? user.businessId.toString() : null,
  };
}

async function getAuthenticatedUser() {
  const token = (await cookies()).get("assistora_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(session.userId) || !mongoose.Types.ObjectId.isValid(session.businessId)) {
    return null;
  }

  await connectDB();

  const user = await User.findById(session.userId).lean();

  if (!user) {
    return null;
  }

  const userBusinessId = user.businessId ? user.businessId.toString() : null;

  if (userBusinessId !== session.businessId) {
    return null;
  }

  return { session, user };
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account settings loaded successfully.",
      data: {
        user: sanitizeUser(authUser.user),
      },
      user: sanitizeUser(authUser.user),
    });
  } catch (error) {
    console.error("Account GET error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const allowedFields = new Set(["name"]);
    const unknownKeys = Object.keys(body).filter((key) => !allowedFields.has(key));

    if (unknownKeys.length > 0) {
      return NextResponse.json(
        { success: false, message: "Unsupported fields were supplied." },
        { status: 400 }
      );
    }

    const nameValue = typeof body.name === "string" ? body.name.trim() : "";

    if (!nameValue) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 }
      );
    }

    if (nameValue.length > USER_NAME_MAX) {
      return NextResponse.json(
        { success: false, message: "Name is too long." },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser.session.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 404 }
      );
    }

    user.name = nameValue;
    await user.save();

    const responseUser = sanitizeUser(user.toObject ? user.toObject() : user);

    return NextResponse.json({
      success: true,
      message: "Account updated successfully.",
      data: {
        user: responseUser,
      },
      user: responseUser,
    });
  } catch (error) {
    console.error("Account PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const confirmation = typeof body?.confirmation === "string" ? body.confirmation : "";

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { success: false, message: "Deletion requires confirmation by typing DELETE." },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    let deleted = false;

    try {
      await session.withTransaction(async () => {
        const user = await User.findById(authUser.session.userId).session(session);
        const business = await Business.findOne({
          _id: new mongoose.Types.ObjectId(authUser.session.businessId),
          ownerId: new mongoose.Types.ObjectId(authUser.session.userId),
        }).session(session);

        if (!user || !business) {
          throw Object.assign(new Error("Account not found or access denied."), { statusCode: 403 });
        }

        await VerificationToken.deleteMany({ userId: user._id }, { session });
        await PasswordResetToken.deleteMany({ userId: user._id }, { session });
        await KnowledgeChunk.deleteMany({ businessId: business._id }, { session });
        await KnowledgeSource.deleteMany({ businessId: business._id }, { session });
        await Conversation.deleteMany({ businessId: business._id }, { session });
        await UsageEvent.deleteMany({ businessId: business._id }, { session });

        await Business.deleteOne({ _id: business._id, ownerId: user._id }, { session });
        await User.deleteOne({ _id: user._id, businessId: business._id }, { session });

        deleted = true;
      });
    } finally {
      await session.endSession();
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Account deletion failed." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully.",
      data: {},
    });

    response.cookies.set("assistora_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode === 403) {
      return NextResponse.json(
        { success: false, message: "Account not found or access denied." },
        { status: 403 }
      );
    }

    console.error("Account DELETE error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
