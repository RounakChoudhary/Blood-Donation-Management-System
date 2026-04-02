const nodemailer = require("nodemailer");

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
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
  hospitalName,
  acceptLink,
  declineLink,
}) {
  const subject = "Emergency Blood Donation Request";

  const text = `${hospitalName || "A nearby hospital"} needs ${bloodGroup} blood donors.

Required units: ${unitsRequired}
Approx. distance: ${distanceKm} km

Accept donation request:
${acceptLink}

Decline donation request:
${declineLink}

These links expire in 2 hours and can be used only once.
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    raw: info,
  };
}

async function sendHospitalDonorAcceptanceEmail({
  to,
  hospitalName,
  donorName,
  donorEmail,
  donorPhone,
  bloodGroup,
}) {
  const subject = "Donor accepted emergency blood request";

  const text = `A donor has accepted an emergency blood request.

Hospital: ${hospitalName}
Donor: ${donorName}
Donor email: ${donorEmail}
Donor mobile: ${donorPhone || "Not provided"}
Blood group: ${bloodGroup}
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    raw: info,
  };
}

async function sendOtpEmail({ to, otp, expiresInMinutes }) {
  const subject = "Verify your BDMS email";

  const text = `Your BDMS verification code is ${otp}.

This code expires in ${expiresInMinutes} minutes.

If you did not request this registration, ignore this email.
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    raw: info,
  };
}

async function sendPasswordResetEmail({ to, token, expiresInMinutes }) {
  const resetBaseUrl = process.env.PASSWORD_RESET_BASE_URL || APP_BASE_URL;
  const resetLink = `${resetBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Reset your BDMS password";

  const text = `A password reset was requested for your BDMS account.

Reset link:
${resetLink}

This link expires in ${expiresInMinutes} minutes and can be used only once.

If you did not request a password reset, ignore this email.
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    raw: info,
  };
}

async function sendCampStatusEmail({ to, campName, status }) {
  const subject = `Blood Camp Proposal ${status.toUpperCase()}`;
  
  const text = `Hello,

Your blood donation camp proposal for "${campName}" has been ${status}.
${status === 'approved' ? 'It is now visible to donors in the area.' : 'Please contact the administration for more information.'}

Thank you,
Blood Donation System
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    raw: info,
  };
}

async function sendRegularBloodRequestEmail({
  to,
  hospitalName,
  bloodGroup,
  unitsRequired,
  requiredDate,
  notes = null,
  subjectPrefix = "Regular",
}) {
  const subject = `${subjectPrefix} Blood Request`;
  const text = `${hospitalName || "A hospital"} requested blood support.

Blood group: ${bloodGroup}
Units required: ${unitsRequired}
Required date: ${requiredDate}
${notes ? `Notes: ${notes}\n` : ""}
Please contact the hospital through the BDMS workflow.
`;

  const info = await transporter.sendMail({
    from: `"Blood Donation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    raw: info,
  };
}

module.exports = {
  sendEmergencyEmail,
  sendHospitalDonorAcceptanceEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendCampStatusEmail,
  sendRegularBloodRequestEmail,
};
