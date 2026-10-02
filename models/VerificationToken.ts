import mongoose, {
  Schema,
  models,
} from "mongoose";

const VerificationTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

VerificationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default models.VerificationToken ||
  mongoose.model(
    "VerificationToken",
    VerificationTokenSchema
  );