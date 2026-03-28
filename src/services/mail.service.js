import nodemailer from "nodemailer";

import dotenv from "dotenv"
dotenv.config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGle_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
})

transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
})

export async function sendMail({to,subject,html}) {
    const mailOptions ={
        from:process.env.GOOGLE_USER,
        to,
        subject,
        html
    }

    const details = await transporter.sendMail(mailOptions);
    console.log("email sent :"+ details);
}