import nodeMailer from 'nodemailer';

const sendEmail =async(Options)=>{
   const transporter  = nodeMailer.createTransport({
    host:"smtp.gmail.com",
    port: 587,
    service: process.env.SMPT_SERVICE,
auth:{
    user:process.env.SMPT_MAIL,
    pass :process.env.SMPT_PASSWORD,
},
   });   
const mailOptions ={
    from:process.env.SMPT_MAIL,
    to: Options.email,
    subject: Options.subject,
    text: Options.message,
}

await transporter.sendMail(mailOptions);         // This line send the email

}
export default sendEmail