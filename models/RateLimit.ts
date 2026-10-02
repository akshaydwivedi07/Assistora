import mongoose, { Schema, models } from "mongoose";

const RateLimitSchema = new Schema(
  {
    bucket: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

RateLimitSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);