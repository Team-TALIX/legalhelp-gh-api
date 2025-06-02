import { body, query } from "express-validator";

// Email verification validation
export const sendEmailVerificationValidation = [
  body("email")
    .isEmail()
    // .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Email address is too long"),
];

export const verifyEmailValidation = [
  body("token")
    .notEmpty()
    .withMessage("Verification token is required")
    .bail()
    .isLength({ min: 32, max: 64 })
    .withMessage("Invalid token format")
    .bail()
    .isAlphanumeric()
    .withMessage("Token must contain only letters and numbers"),
];

// Phone verification validation
export const sendPhoneVerificationValidation = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .isMobilePhone("any")
    .withMessage("Please provide a valid mobile phone number")
    .bail()
    .custom((value) => {
      // Additional validation for Ghana phone numbers
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length < 9 || cleaned.length > 13) {
        throw new Error("Invalid phone number length for Ghana");
      }
      return true;
    }),
];

export const verifyPhoneValidation = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .isMobilePhone("any")
    .withMessage("Please provide a valid mobile phone number"),

  body("code")
    .notEmpty()
    .withMessage("Verification code is required")
    .bail()
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
    .bail()
    .isNumeric()
    .withMessage("Verification code must contain only numbers"),
];

export const resendPhoneVerificationValidation = [
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .isMobilePhone("any")
    .withMessage("Please provide a valid mobile phone number"),
];

// Query validation for verification status
export const verificationStatusValidation = [
  query("type")
    .optional()
    .isIn(["email", "phone", "all"])
    .withMessage("Type must be either email, phone, or all"),
];

// Combined validation for registration with verification
export const registrationVerificationValidation = [
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),

  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error("Either email or phone number is required");
    }
    return true;
  }),
];

// Validation for verification token in URL params
export const tokenParamValidation = [
  query("token")
    .notEmpty()
    .withMessage("Verification token is required")
    .bail()
    .isLength({ min: 32, max: 64 })
    .withMessage("Invalid token format")
    .bail()
    .isAlphanumeric()
    .withMessage("Token must contain only letters and numbers"),
];
