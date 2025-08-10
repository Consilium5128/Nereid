const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

async function connectRedis() {
  try {
    await client.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

// Message queue functions for inter-agent communication
async function publishMessage(channel, message) {
  try {
    await client.publish(channel, JSON.stringify(message));
  } catch (error) {
    console.error('Redis publish error:', error);
  }
}

async function subscribeToChannel(channel, callback) {
  try {
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    });
    return subscriber;
  } catch (error) {
    console.error('Redis subscribe error:', error);
  }
}

// Cache functions for storing temporary data
async function setCache(key, value, ttl = 3600) {
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function getCache(key) {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

module.exports = { 
  client, 
  connectRedis, 
  publishMessage, 
  subscribeToChannel, 
  setCache, 
  getCache 
};
