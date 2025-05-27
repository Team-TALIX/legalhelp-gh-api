import { createClient } from 'redis';

export const connectRedis = (redisURL) => {
  if (!redisURL) {
    console.warn('REDIS_URL not defined, Redis client not created. Caching will be disabled.');
    return null;
  }

  const client = createClient({
    url: redisURL
  });

  client.on('connect', () => console.log('Redis Client Connected'));
  client.on('error', (err) => console.error('Redis Client Connection Error:', err));

  // We will connect when the server starts or when first needed, rather than here directly.
  // await client.connect(); // Don't connect immediately, let app.js handle or lazy connect.

  return client;
};

// Optional: A global client instance if you prefer to manage it globally
// import { REDIS_URL } from './config.js';
// export const redisClient = connectRedis(REDIS_URL);
// if (redisClient) {
//   redisClient.connect().catch(console.error);
// }
