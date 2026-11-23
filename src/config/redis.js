const Redis = require('ioredis');
const { redis } = require('./env');

function createRedisClient(options = {}) {
  const client = new Redis(redis.url, { maxRetriesPerRequest: 1, ...options });
  client.on('error', (err) => console.error('[redis]', err.message));
  return client;
}

let sharedClient;

function getRedisClient() {
  if (!sharedClient) sharedClient = createRedisClient();
  return sharedClient;
}

module.exports = { createRedisClient, getRedisClient };
