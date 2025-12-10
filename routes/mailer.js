// ========================================================
// File description: Intended as the route to send the
// reset password to the user's email, but this file
// is not used in the final project due to the scope.
// ========================================================

// Import required modules
const nodemailer = require("nodemailer");

const createTransporter = () => {
  // Using SMTP credentials from env
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP configuration in environment variables.");
  }

  const transporter = nodemailer.createTransport({
    host,
    secure: port === 465, 
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendResetEmail = async ({ to, resetURL, name = "" }) => {
  const transporter = createTransporter();

  // Verify transporter before sending
  await transporter.verify().catch(err => {
    console.error("SMTP verify failed:", err);
    throw err;
  });

  const fromName = process.env.FROM_NAME || "CSEE Virtual Triage System";
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Password Reset Request for your Account",
    html: `
      <p>Hello ${name || "there"},</p>
      <p>You requested a password reset. Click the link below to set a new password. </p>
      <p><a href="${resetURL}">${resetURL}</a></p>
      <p><strong>This link expires in 1 hour.</strong></p>
      <p>If you did not request this, you can safelyignore this email.</p>
      <p>— The CSEE Virtual Triage System Team</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };