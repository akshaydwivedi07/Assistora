import mongoose, { Schema, models } from "mongoose";

const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const ConversationSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
      index: true,
    },

    customerName: {
      type: String,
      default: "Website Visitor",
    },

    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    messages: {
      type: [MessageSchema],
      default: [],
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Conversation ||
  mongoose.model(
    "Conversation",
    ConversationSchema
  );