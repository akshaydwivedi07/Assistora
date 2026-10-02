import mongoose, { Schema, models } from "mongoose";

const KnowledgeChunkSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    sourceId: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeSource",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default models.KnowledgeChunk ||
  mongoose.model(
    "KnowledgeChunk",
    KnowledgeChunkSchema
  );