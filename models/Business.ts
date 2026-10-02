import mongoose, { Schema, models } from "mongoose";

const BusinessSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    industry: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    supportEmail: {
      type: String,
      default: "",
    },

    plan: {
      type: String,
      enum: ["starter", "pro", "enterprise"],
      default: "starter",
    },

    aiAgent: {
      enabled: {
        type: Boolean,
        default: true,
      },

      name: {
        type: String,
        default: "Assistora AI",
      },

      welcomeMessage: {
        type: String,
        default: "Hi! 👋 How can I help you today?",
      },

      tone: {
        type: String,
        enum: [
          "Friendly",
          "Professional",
          "Casual",
          "Concise",
        ],
        default: "Friendly",
      },

      instructions: {
        type: String,
        default:
          "Help customers with questions about products, orders, returns and delivery.",
      },
    },

    widget: {
      enabled: {
        type: Boolean,
        default: true,
      },

      primaryColor: {
        type: String,
        default: "#6366F1",
      },

      position: {
        type: String,
        enum: ["bottom-right", "bottom-left"],
        default: "bottom-right",
      },

      agentName: {
        type: String,
        default: "Assistora AI",
      },

      avatarUrl: {
        type: String,
        default: "",
      },

      welcomeMessage: {
        type: String,
        default: "Hi! How can I help you today?",
      },

      buttonSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },

      borderRadius: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "large",
      },

      showBranding: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default models.Business ||
  mongoose.model("Business", BusinessSchema);