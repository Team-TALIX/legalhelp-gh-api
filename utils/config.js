import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 5000;

export const MONGODB_URI = process.env.MONGODB_URI;
export const REDIS_URL = process.env.REDIS_URL;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const GHANA_NLP_API_KEY = process.env.GHANA_NLP_API_KEY;
export const GHANA_NLP_BASE_URL = process.env.GHANA_NLP_BASE_URL;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_OAUTH_CALLBACK_URL = process.env.GOOGLE_OAUTH_CALLBACK_URL;

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Email Configuration
export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = process.env.EMAIL_PORT;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const EMAIL_FROM = process.env.EMAIL_FROM;

// SMS Configuration - Twilio
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// SMS Configuration - Hubtel (Ghana)
export const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
export const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;

// SMS Configuration - Africa's Talking
export const AFRICAS_TALKING_API_KEY = process.env.AFRICAS_TALKING_API_KEY;
export const AFRICAS_TALKING_USERNAME = process.env.AFRICAS_TALKING_USERNAME;



if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined.');
  process.exit(1);
}

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET or JWT_REFRESH_SECRET is not defined.');
  process.exit(1);
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_OAUTH_CALLBACK_URL) {
  console.error('FATAL ERROR: Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_CALLBACK_URL) are not defined.');
  process.exit(1);
}
