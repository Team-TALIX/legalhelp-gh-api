import ChatSession from "../models/ChatSession.js";
import User from "../models/User.js";
import LegalContent from "../models/LegalContent.js";
import {
  validateAndSanitize,
  chatQuerySchema,
  chatHistorySchema,
  chatFeedbackSchema,
  createSessionSchema,
  deleteSessionSchema,
  updateSessionSchema,
} from "../validators/chat.js";
import { NLPService } from "../services/nlpService.js";
import { generateLegalResponse } from "../services/legalKnowledgeService.js";
import { setCache, deleteCache } from "../utils/redis.js";
import { generateUniqueId } from "../utils/helpers.js";

// Create a new chat session
export const createSession = async (req, res) => {
  try {
    const validatedData = validateAndSanitize(createSessionSchema, req.body);

    // Generate unique session ID
    const sessionId = generateUniqueId("chat");

    // Create new chat session
    const chatSession = new ChatSession({
      userId: req.user ? req.user.id : null,
      sessionId,
      messages: [],
      context: validatedData.context || {},
      active: true,
      lastAccessed: new Date(),
    });

    await chatSession.save();

    // Cache session in Redis for quick access
    await setCache(
      `chat_session:${sessionId}`,
      {
        sessionId,
        userId: req.user ? req.user.id : null,
        context: validatedData.context || {},
        createdAt: new Date(),
      },
      3600 // 1 hour TTL
    );

    res.status(201).json({
      success: true,
      sessionId,
      message: "Chat session created successfully",
    });
  } catch (error) {
    console.error("Error creating chat session:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create chat session",
      errors: error.errors || null,
    });
  }
};

// Process legal query and generate response
export const processQuery = async (req, res) => {
  try {
    const validatedData = validateAndSanitize(chatQuerySchema, req.body);
    const { sessionId, content, language, context, isVoiceInput } =
      validatedData;

    // Find or verify session exists
    let chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Verify user authorization for session
    if (
      req.user &&
      chatSession.userId &&
      chatSession.userId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to chat session",
      });
    }

    // Add user message to session
    const userMessage = {
      role: "user",
      content,
      language,
      timestamp: new Date(),
      audioUrl: isVoiceInput ? req.file?.path : null,
    };

    chatSession.messages.push(userMessage);
    chatSession.lastAccessed = new Date();

    // Update context if provided
    if (context) {
      chatSession.context = { ...chatSession.context, ...context };
    }

    // Generate legal response
    const assistantResponse = await generateLegalResponse(
      content,
      language,
      chatSession.context
    );

    // Generate audio for non-English responses using Ghana NLP TTS
    let audioUrl = null;
    if (language !== "en") {
      try {
        const audioData = await NLPService.textToSpeech(
          assistantResponse.content,
          language
        );
        if (audioData && audioData.audioData) {
          // In production, save audioData.audioData (base64) to file storage and get URL
          audioUrl = `data:audio/wav;base64,${audioData.audioData}`;
        }
      } catch (ttsError) {
        console.error("TTS generation failed:", ttsError);
        // Continue without audio if TTS fails
      }
    }

    // Add assistant message to session
    const assistantMessage = {
      role: "assistant",
      content: assistantResponse.content,
      language: assistantResponse.language,
      timestamp: new Date(),
      audioUrl,
      metadata: {
        legalTopic: assistantResponse.legalTopic,
        confidence: assistantResponse.confidence,
        relatedTopics: assistantResponse.relatedTopics,
      },
    };

    chatSession.messages.push(assistantMessage);

    // Update context with detected legal topic
    if (assistantResponse.legalTopic) {
      chatSession.context.legalTopic = assistantResponse.legalTopic;
    }

    // Save updated session
    await chatSession.save();

    // Update user usage if authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: {
          "usage.totalQueries": 1,
          "usage.monthlyQueries": 1,
        },
        "usage.lastActive": new Date(),
      });
    }

    // Cache updated session in Redis
    await setCache(
      `chat_session:${sessionId}`,
      {
        sessionId,
        userId: req.user ? req.user.id : null,
        context: chatSession.context,
        lastMessage: assistantMessage,
        updatedAt: new Date(),
      },
      3600 // 1 hour TTL
    );

    res.json({
      success: true,
      message: assistantMessage,
      sessionContext: {
        legalTopic: chatSession.context.legalTopic,
        resolved: chatSession.context.resolved,
      },
    });
  } catch (error) {
    console.error("Error processing chat query:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to process query",
      errors: error.errors || null,
    });
  }
};

// Get chat history for a session
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const validatedQuery = validateAndSanitize(chatHistorySchema, {
      ...req.validatedQuery,
    });

    // Find chat session
    const chatSession = await ChatSession.findOne({
      sessionId: sessionId,
    });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Verify user authorization
    if (
      req.user &&
      chatSession.userId &&
      chatSession.userId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to chat session",
      });
    }

    // Get paginated messages
    const { limit, offset } = validatedQuery;
    const totalMessages = chatSession.messages.length;
    const messages = chatSession.messages
      .slice(offset, offset + limit)
      .map((message) => ({
        role: message.role,
        content: message.content,
        language: message.language,
        timestamp: message.timestamp,
        audioUrl: message.audioUrl,
        metadata: message.metadata,
      }));

    res.json({
      success: true,
      sessionId: validatedQuery.sessionId,
      messages,
      pagination: {
        total: totalMessages,
        limit,
        offset,
        hasMore: offset + limit < totalMessages,
      },
      context: chatSession.context,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch chat history",
      errors: error.errors || null,
    });
  }
};

// Submit feedback for chat response
export const submitFeedback = async (req, res) => {
  try {
    const validatedData = validateAndSanitize(chatFeedbackSchema, req.body);
    const { sessionId, messageIndex, rating, feedback, helpful } =
      validatedData;

    // Find chat session
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Verify message exists
    if (messageIndex >= chatSession.messages.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid message index",
      });
    }

    // Add feedback to message
    if (!chatSession.messages[messageIndex].feedback) {
      chatSession.messages[messageIndex].feedback = [];
    }

    chatSession.messages[messageIndex].feedback.push({
      userId: req.user ? req.user.id : null,
      rating,
      feedback,
      helpful,
      timestamp: new Date(),
    });

    await chatSession.save();

    res.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to submit feedback",
      errors: error.errors || null,
    });
  }
};

// Delete chat session
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const validatedData = validateAndSanitize(deleteSessionSchema, {
      // sessionId,
      ...req.body,
    });

    // Find and verify session ownership
    const chatSession = await ChatSession.findOne({
      sessionId: sessionId,
    });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Verify user authorization
    if (
      req.user &&
      chatSession.userId &&
      chatSession.userId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to chat session",
      });
    }

    // Delete session
    await ChatSession.findByIdAndDelete(chatSession._id);

    // Remove from Redis cache
    await deleteCache(`chat_session:${sessionId}`);

    res.json({
      success: true,
      message: "Chat session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete chat session",
      errors: error.errors || null,
    });
  }
};

// Update session context
export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const validatedData = validateAndSanitize(updateSessionSchema, {
      // sessionId,
      ...req.body,
    });

    // Find chat session
    const chatSession = await ChatSession.findOne({
      sessionId: sessionId,
    });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Verify user authorization
    if (
      req.user &&
      chatSession.userId &&
      chatSession.userId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to chat session",
      });
    }

    // Update session
    if (validatedData.context) {
      chatSession.context = {
        ...chatSession.context,
        ...validatedData.context,
      };
    }

    if (typeof validatedData.active !== "undefined") {
      chatSession.active = validatedData.active;
    }

    chatSession.lastAccessed = new Date();
    await chatSession.save();

    res.json({
      success: true,
      sessionId: sessionId,
      context: chatSession.context,
      active: chatSession.active,
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update session",
      errors: error.errors || null,
    });
  }
};

// Get user's chat sessions list
export const getUserSessions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    
    const { page = 1, limit = 10, active } = req.query;
    const skip = (page - 1) * limit;
    // Build query
    const query = { userId: req.user.id };
    if (typeof active !== "undefined") {
      query.active = active === "true";
    }

    // Get sessions with pagination
    const sessions = await ChatSession.find(query)
      .select("sessionId context lastAccessed active createdAt")
      .sort({ lastAccessed: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatSession.countDocuments(query);

    res.json({
      success: true,
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        context: session.context,
        lastAccessed: session.lastAccessed,
        active: session.active,
        createdAt: session.createdAt,
        messageCount: session.messages ? session.messages.length : 0,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat sessions",
    });
  }
};
