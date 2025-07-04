const nodemailer = require('nodemailer');

// Create transporter with your Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'us59908@gmail.com',
    pass: process.env.EMAIL_PASS || 'evgv sbcp ynow fecj'
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

module.exports = transporter;
