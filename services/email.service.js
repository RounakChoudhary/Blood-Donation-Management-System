const nodemailer = require("nodemailer");

const APP_BASE_URL = process.env.APP_BASE_URL;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmergencyEmail({
  to,
  bloodGroup,
  unitsRequired,
  distanceKm,
  matchId,
}) {
  const link = `${APP_BASE_URL}/donor-requests/${matchId}`;

  const subject = "Emergency Blood Donation Request";

  const text = `
Nearby hospital needs ${bloodGroup} blood donors.

Required units: ${unitsRequired}
Distance: ${distanceKm} km

Open this link to respond:
${link}
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return info;
}

module.exports = {
  sendEmergencyEmail,
};