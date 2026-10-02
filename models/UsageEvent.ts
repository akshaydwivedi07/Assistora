import mongoose, { Schema, models } from "mongoose";

const UsageEventSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "customer_message",
        "knowledge_search",
        "ai_response",
      ],
      required: true,
      index: true,
    },

    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
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

export default models.UsageEvent ||
  mongoose.model("UsageEvent", UsageEventSchema);