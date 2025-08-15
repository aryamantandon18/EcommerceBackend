import { createConsumer } from '../kafkaConfig.js';
import sendEmail from './sendEmail.js';

const runEmailConsumer = async () => {
  const consumer = createConsumer('email-consumer-group');
  
  try {
    await consumer.connect();
    await consumer.subscribe({ 
      topic: 'bulk-email', 
      fromBeginning: false  // means it will only read new messages (not historical ones).
    });

    console.log('Email consumer ready');

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const { email, subject, message: text } = JSON.parse(message.value.toString());
          
          await sendEmail({
            email,
            subject,
            message: text
          });
          
          console.log(`Email sent to ${email}`);
        } catch (err) {
          console.error(`Failed to process email:`, err);
          // Implement retry or dead letter queue logic here
        }
      },
    });
  } catch (error) {
    console.error('Consumer setup failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  try {
    await consumer.disconnect();
    console.log('Consumer disconnected gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Listens for termination signals (like Ctrl+C or docker stop) to trigger the graceful shutdown.
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

runEmailConsumer().catch(err => {
  console.error('Email consumer failed to start:', err);
  process.exit(1);
});