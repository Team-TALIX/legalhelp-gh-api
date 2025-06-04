import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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
    language: {
      type: String,
      required: true,
      enum: ["en", "tw", "ee", "dag"], // Ensure consistency with User model
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    audioUrl: String, // URL to the stored audio file for voice messages
  },
  { _id: false }
); // No separate ID for subdocuments unless needed

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Can be an anonymous user ID or registered user ID
    },
    sessionId: {
      type: String,
      unique: true,
      required: true,
      // Consider generating this with a UUID library, e.g., crypto.randomUUID()
    },
    name: {
      type: String,
      default: function () {
        // Auto-generate a default name based on timestamp
        const date = new Date();
        return `Chat ${
          date.getMonth() + 1
        }/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      },
      maxlength: 100,
    },
    messages: [messageSchema],
    context: {
      legalTopic: String,
      userLocation: String, // Consider more structured location data if needed (e.g., GeoJSON)
      resolved: { type: Boolean, default: false },
    },
    active: { type: Boolean, default: true }, // To mark if the session is still active
    lastAccessed: { type: Date, default: Date.now }, // For session cleanup or prioritization
  },
  { timestamps: true }
);

// Indexing examples
chatSessionSchema.index({ userId: 1 });
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ "context.legalTopic": 1 });
chatSessionSchema.index({ lastAccessed: -1 }); // For querying recent sessions

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
