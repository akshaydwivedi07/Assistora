import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false,
      select: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },

    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default models.User ||
  mongoose.model("User", UserSchema);