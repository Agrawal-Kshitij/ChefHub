import Redis from 'ioredis';

// Create Redis client
const redisOptions = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

const redis = new Redis(redisOptions);

redis.on('error', (err) => {
  // console.error('❌ Redis connection error:', err.message);
});

redis.on('connect', () => {
  // console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  // console.log('✅ Redis ready to accept commands');
});

redis.on('reconnecting', () => {
  // console.log('🔄 Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
  // console.log('Redis connection closed');
});

export default redis;
