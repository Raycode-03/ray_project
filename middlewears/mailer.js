require("dotenv").config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'hotmail', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
    