const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async ({ email, subject, message }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("SERVER CONFIG ERROR: Missing EMAIL_USER or EMAIL_PASS environment variables. Please add them to your Render dashboard.");
  }

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  });
};