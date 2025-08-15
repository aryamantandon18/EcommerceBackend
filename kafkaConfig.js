import { Kafka } from 'kafkajs';

const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'email-service',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
// For local development, we typically don't need SSL/SASL
  // Add these only for production
//   ssl: process.env.KAFKA_SSL === 'true',
//   sasl: process.env.KAFKA_SASL_USERNAME ? {
//     mechanism: 'plain',
//     username: process.env.KAFKA_SASL_USERNAME,
//     password: process.env.KAFKA_SASL_PASSWORD
//   } : undefined
};

const kafka = new Kafka(kafkaConfig);

// Producer instance (can be initialized when needed)
let producer = null;

const getProducer = async () => {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
};

// Consumer instance (should be created per consumer group)
const createConsumer = (groupId) => {
  return kafka.consumer({ 
    groupId,
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  });
};

export { kafka, getProducer, createConsumer };