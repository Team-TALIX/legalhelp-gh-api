import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;
let connectionPromise = null;

/**
 * Create and configure Redis client
 * @param {string} redisURL - Redis connection URL
 * @returns {Object} Redis client instance
 */
export const createRedisClient = (redisURL) => {
  if (!redisURL) {
    console.warn('REDIS_URL not defined, Redis client not created. Caching will be disabled.');
    return null;
  }

  const client = createClient({
    url: redisURL,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Redis server refused connection');
        return new Error('Redis server refused connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        console.error('Redis retry time exhausted');
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        console.error('Redis connection attempts exhausted');
        return undefined;
      }
      // Reconnect after delay
      return Math.min(options.attempt * 100, 3000);
    }
  });

  // Event listeners for connection monitoring
  client.on('connect', () => {
    console.log('Redis Client: Attempting to connect...');
  });

  client.on('ready', () => {
    console.log('Redis Client: Connected and ready');
    isConnected = true;
  });

  client.on('error', (err) => {
    console.error('Redis Client Connection Error:', err);
    isConnected = false;
  });

  client.on('end', () => {
    console.log('Redis Client: Connection ended');
    isConnected = false;
  });

  client.on('reconnecting', () => {
    console.log('Redis Client: Reconnecting...');
    isConnected = false;
  });

  return client;
};

/**
 * Initialize global Redis client
 * @param {string} redisURL - Redis connection URL
 * @returns {Promise<Object>} Redis client instance
 */
export const initializeRedis = async (redisURL) => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      redisClient = createRedisClient(redisURL);

      if (!redisClient) {
        console.warn('Redis client not created (URL missing)');
        resolve(null);
        return;
      }

      await redisClient.connect();
      resolve(redisClient);
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redisClient = null;
      isConnected = false;
      connectionPromise = null;
      resolve(null); // Don't reject, just resolve with null to continue without Redis
    }
  });

  return connectionPromise;
};

/**
 * Get global Redis client instance
 * @returns {Object|null} Redis client or null if not available
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is connected and available
 * @returns {boolean} Connection status
 */
export const isRedisConnected = () => {
  return isConnected && redisClient;
};

/**
 * Safely execute Redis commands with error handling
 * @param {Function} operation - Redis operation to execute
 * @param {any} fallback - Fallback value if Redis is unavailable
 * @returns {any} Operation result or fallback
 */
export const safeRedisOperation = async (operation, fallback = null) => {
  if (!isRedisConnected()) {
    console.warn('Redis not available, using fallback');
    return fallback;
  }

  try {
    return await operation(redisClient);
  } catch (error) {
    console.error('Redis operation failed:', error);
    return fallback;
  }
};

/**
 * Set value in Redis with optional expiration
 * @param {string} key - Redis key
 * @param {any} value - Value to store
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const setCache = async (key, value, ttl = 3600) => {
  return safeRedisOperation(async (client) => {
    const serializedValue = JSON.stringify(value);
    if (ttl > 0) {
      await client.setEx(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
    return true;
  }, false);
};

/**
 * Get value from Redis
 * @param {string} key - Redis key
 * @returns {Promise<any>} Retrieved value or null
 */
export const getCache = async (key) => {
  return safeRedisOperation(async (client) => {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }, null);
};

/**
 * Delete key from Redis
 * @param {string} key - Redis key to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteCache = async (key) => {
  return safeRedisOperation(async (client) => {
    const result = await client.del(key);
    return result > 0;
  }, false);
};

/**
 * Check if key exists in Redis
 * @param {string} key - Redis key
 * @returns {Promise<boolean>} Existence status
 */
export const hasCache = async (key) => {
  return safeRedisOperation(async (client) => {
    const result = await client.exists(key);
    return result === 1;
  }, false);
};

/**
 * Set multiple key-value pairs
 * @param {Object} keyValuePairs - Object with key-value pairs
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const setMultipleCache = async (keyValuePairs, ttl = 3600) => {
  return safeRedisOperation(async (client) => {
    const pipeline = client.multi();

    Object.entries(keyValuePairs).forEach(([key, value]) => {
      const serializedValue = JSON.stringify(value);
      if (ttl > 0) {
        pipeline.setEx(key, ttl, serializedValue);
      } else {
        pipeline.set(key, serializedValue);
      }
    });

    await pipeline.exec();
    return true;
  }, false);
};

/**
 * Get multiple values from Redis
 * @param {Array<string>} keys - Array of Redis keys
 * @returns {Promise<Object>} Object with key-value pairs
 */
export const getMultipleCache = async (keys) => {
  return safeRedisOperation(async (client) => {
    const values = await client.mGet(keys);
    const result = {};

    keys.forEach((key, index) => {
      const value = values[index];
      result[key] = value ? JSON.parse(value) : null;
    });

    return result;
  }, {});
};

/**
 * Increment a numeric value in Redis
 * @param {string} key - Redis key
 * @param {number} increment - Amount to increment
 * @returns {Promise<number>} New value or 0
 */
export const incrementCache = async (key, increment = 1) => {
  return safeRedisOperation(async (client) => {
    return await client.incrBy(key, increment);
  }, 0);
};

/**
 * Set expiration for existing key
 * @param {string} key - Redis key
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const expireCache = async (key, ttl) => {
  return safeRedisOperation(async (client) => {
    const result = await client.expire(key, ttl);
    return result === 1;
  }, false);
};

/**
 * Get all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'user:*')
 * @returns {Promise<Array<string>>} Array of matching keys
 */
export const getKeysPattern = async (pattern) => {
  return safeRedisOperation(async (client) => {
    return await client.keys(pattern);
  }, []);
};

/**
 * Flush all Redis data (use with caution)
 * @returns {Promise<boolean>} Success status
 */
export const flushAllCache = async () => {
  return safeRedisOperation(async (client) => {
    await client.flushAll();
    return true;
  }, false);
};

/**
 * Get Redis connection info
 * @returns {Promise<Object>} Connection info
 */
export const getRedisInfo = async () => {
  return safeRedisOperation(async (client) => {
    const info = await client.info();
    return { connected: true, info };
  }, { connected: false, info: null });
};

/**
 * Ping Redis server
 * @returns {Promise<string>} Ping response or null
 */
export const pingRedis = async () => {
  return safeRedisOperation(async (client) => {
    return await client.ping();
  }, null);
};

/**
 * Gracefully close Redis connection
 * @returns {Promise<void>}
 */
export const closeRedis = async () => {
  if (redisClient && isConnected) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed gracefully');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    } finally {
      redisClient = null;
      isConnected = false;
      connectionPromise = null;
    }
  }
};

// Export the global client instance for backward compatibility
export { redisClient };
