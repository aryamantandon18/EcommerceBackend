import { getProducer } from '../kafkaConfig.js';
import { Users } from '../models/user.js';

export const sendBulkEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and message are required' 
      });
    }

    const users = await Users.find({}, 'email');
    
    if (!users.length) {
      return res.status(200).json({ 
        success: true, 
        message: 'No users to send emails to' 
      });
    }

    const producer = await getProducer();
    
    const messages = users.map(user => ({
      value: JSON.stringify({
        email: user.email,
        subject,
        message
      })
    }));

    await producer.send({
      topic: 'bulk-email',
      messages
    });

    res.status(202).json({
      success: true,
      message: 'Emails queued successfully',
      queuedCount: users.length
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to queue emails'
    });
  }
};