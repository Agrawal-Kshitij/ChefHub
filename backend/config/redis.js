import Redis from 'ioredis';
import { URL } from 'url';

const buildRedisOptions = () => {
  if (process.env.REDIS_URL) {
    try {
      const parsed = new URL(process.env.REDIS_URL);
      return {
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 5,
        connectTimeout: 10000,
      };
    } catch (error) {
      console.error('Invalid REDIS_URL in environment:', error.message);
    }
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 5,
    connectTimeout: 10000,
  };
};

const redisOptions = buildRedisOptions();
const redis = new Redis(redisOptions);

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis ready to accept commands');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
  console.log('Redis connection closed');
});

export default redis;
