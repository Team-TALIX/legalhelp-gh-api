import Joi from "joi";

// Supported languages as per project requirements
const supportedLanguages = ["en", "tw", "ee", "dag"];

// Chat query validation schema
export const chatQuerySchema = Joi.object({
  sessionId: Joi.string().required().messages({
    "any.required": "Session ID is required",
    "string.empty": "Session ID cannot be empty",
  }),
  content: Joi.string().required().min(1).max(2000).messages({
    "any.required": "Message content is required",
    "string.empty": "Message content cannot be empty",
    "string.min": "Message content must not be empty",
    "string.max": "Message content cannot exceed 2000 characters",
  }),
  language: Joi.string()
    .valid(...supportedLanguages)
    .required()
    .messages({
      "any.required": "Language is required",
      "any.only": `Language must be one of: ${supportedLanguages.join(", ")}`,
    }),
  context: Joi.object({
    legalTopic: Joi.string().optional().allow(""),
    userLocation: Joi.string().optional().allow(""),
    previousContext: Joi.string().optional(),
  }).optional(),
  isVoiceInput: Joi.boolean().default(false),
});

// Chat history retrieval validation schema
export const chatHistorySchema = Joi.object({
  // sessionId: Joi.string().required().messages({
  //   "any.required": "Session ID is required",
  //   "string.empty": "Session ID cannot be empty",
  // }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Offset must be a number",
    "number.integer": "Offset must be an integer",
    "number.min": "Offset cannot be negative",
  }),
});

// Chat feedback validation schema
export const chatFeedbackSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    "any.required": "Session ID is required",
    "string.empty": "Session ID cannot be empty",
  }),
  messageIndex: Joi.number().integer().min(0).required().messages({
    "any.required": "Message index is required",
    "number.base": "Message index must be a number",
    "number.integer": "Message index must be an integer",
    "number.min": "Message index cannot be negative",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "any.required": "Rating is required",
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot exceed 5",
  }),
  feedback: Joi.string().max(500).optional().messages({
    "string.max": "Feedback cannot exceed 500 characters",
  }),
  helpful: Joi.boolean().required().messages({
    "any.required": "Helpful flag is required",
  }),
});

// Session creation validation schema
export const createSessionSchema = Joi.object({
  name: Joi.string().max(100).optional().allow(""),
  language: Joi.string()
    .valid(...supportedLanguages)
    .default("en")
    .messages({
      "any.only": `Language must be one of: ${supportedLanguages.join(", ")}`,
    })
    .optional(),
  context: Joi.object({
    legalTopic: Joi.string().optional().allow(""),
    userLocation: Joi.string().optional().allow(""),
    resolved: Joi.boolean().optional().default(false),
  }).optional(),
  isAnonymous: Joi.boolean().default(true).optional(),
}).optional();

// Session deletion validation schema
export const deleteSessionSchema = Joi.object({
  confirmDelete: Joi.boolean().valid(true).default(true).messages({
    "any.only": "Delete confirmation must be true",
  }),
}).optional();

// Voice message validation schema
export const voiceMessageSchema = Joi.object({
  // sessionId: Joi.string().required().messages({
  //   "any.required": "Session ID is required",
  //   "string.empty": "Session ID cannot be empty",
  // }),
  language: Joi.string()
    .valid(...supportedLanguages)
    .required()
    .messages({
      "any.required": "Language is required",
      "any.only": `Language must be one of: ${supportedLanguages.join(", ")}`,
    }),
  audioFormat: Joi.string()
    .valid("mp3", "wav", "webm", "ogg")
    .default("mp3")
    .messages({
      "any.only": "Audio format must be one of: mp3, wav, webm, ogg",
    }),
  audioDuration: Joi.number().min(0.1).max(120).optional().messages({
    "number.min": "Audio duration must be at least 0.1 seconds",
    "number.max": "Audio duration cannot exceed 120 seconds",
  }),
});

// Chat session update validation schema
export const updateSessionSchema = Joi.object({
  name: Joi.string().max(100).optional().allow(""),
  context: Joi.object({
    legalTopic: Joi.string().optional().allow(""),
    userLocation: Joi.string().optional().allow(""),
    resolved: Joi.boolean().optional(),
  }).optional(),
  active: Joi.boolean().optional(),
}).optional();

// Schema for validating just sessionId from path parameters
export const sessionIdParamsSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    "any.required": "Session ID path parameter is required",
    "string.empty": "Session ID path parameter cannot be empty",
  }),
});

// Helper function to validate and return sanitized data
export const validateAndSanitize = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    throw {
      status: 400,
      message: "Validation error",
      errors: errorDetails,
    };
  }

  return value;
};
