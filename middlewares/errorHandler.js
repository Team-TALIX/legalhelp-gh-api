import { NODE_ENV } from '../utils/config.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes
  // In a production environment, you might use a more sophisticated logger like Winston or Sentry
  console.error('-----------------------------');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body); // Be cautious with sensitive data in logs
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('-----------------------------');

  let statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
  let message = err.message || 'An unexpected error occurred on the server.';

  // Handle specific Mongoose errors
  if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
    // Consolidate Mongoose validation error messages
    const messages = Object.values(err.errors).map(val => val.message);
    message = `Invalid input data: ${messages.join('. ')}`;
  } else if (err.name === 'CastError' && err.path && err.value) {
    statusCode = 400; // Bad Request for invalid ID format
    message = `Invalid ${err.path}: ${err.value}. Expected a valid ${err.kind}.`;
  } else if (err.code === 11000) { // Mongoose duplicate key error
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for '${field}'. Please use another value.`;
  }

  // Handle specific JWT errors (though some might be caught before reaching here)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Unauthorized
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401; // Unauthorized
    message = 'Your session has expired. Please log in again.';
  }

  // Ensure statusCode is a valid HTTP status code number
  if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  // Send a user-friendly error message in production, more details in development
  if (NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred. We are working to resolve it.';
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Include stack trace only in development for debugging
    ...(NODE_ENV === 'development' && { stack: err.stack, error: err }),
  });
};

export default errorHandler;
