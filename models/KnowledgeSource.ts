import mongoose, { Schema, models } from "mongoose";

const KnowledgeSourceSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "document",
        "website",
        "url",
        "text",
        "faq",
      ],
      required: true,
    },

    content: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "processing",
        "ready",
        "failed",
      ],
      default: "ready",
    },

    chunks: {
      type: Number,
      default: 0,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default models.KnowledgeSource ||
  mongoose.model(
    "KnowledgeSource",
    KnowledgeSourceSchema
  );