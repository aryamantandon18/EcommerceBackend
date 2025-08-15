import express from 'express';
import { getProducer } from '../kafkaConfig.js';
// import redisClient from '../config/redis.js'; // if using Redis
import mongoose from 'mongoose'; // if using MongoDB

const router = express.Router();

router.get('/healthcheck', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      kafka: 'pending',
      database: 'pending',
      redis: 'pending'
    }
  };

  try {
    // Check Kafka connection
    const producer = await getProducer();
    await producer.connect();
    healthcheck.checks.kafka = 'healthy';
    await producer.disconnect();
    
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      healthcheck.checks.database = 'healthy';
    } else {
      healthcheck.checks.database = 'unhealthy';
    }
    
    // // Check Redis connection (if using)
    // if (redisClient) {
    //   await redisClient.ping();
      healthcheck.checks.redis = 'healthy';
    // }
    
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = 'Service unhealthy';
    healthcheck.error = error.message;
    
    // Mark failed services
    if (healthcheck.checks.kafka === 'pending') {
      healthcheck.checks.kafka = 'unhealthy';
    }
    
    res.status(503).json(healthcheck);
  }
});

export default router;