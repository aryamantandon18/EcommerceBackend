import nodeMailer from 'nodemailer';

const sendEmail =async(Options)=>{
   const transporter  = nodeMailer.createTransport({
    host:"smtp.gmail.com",
    port: 587,
    service: process.env.SMPT_SERVICE,
    secure: process.env.SMTP_SECURE === 'true',
    auth:{
        user:process.env.SMPT_MAIL,
        pass :process.env.SMPT_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    rateLimit: 10 // messages/sec
   });   
    const mailOptions ={
        from:process.env.SMPT_MAIL,
        to: Options.email,
        subject: Options.subject,
        text: Options.message,
        html: Options.html || `<p>${Options.message}</p>`,
    }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${Options.email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${Options.email}:`, error);
    throw error;
  }

    // Verify connection on startup
    transporter.verify((error) => {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
    });

};
export default sendEmail;