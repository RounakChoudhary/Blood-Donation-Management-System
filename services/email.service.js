const { Resend } = require("resend");

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function getEmailFromAddress() {
  const fromAddress = String(process.env.EMAIL_FROM || "").trim();
  if (!fromAddress) {
    throw new Error("EMAIL_FROM is not set");
  }
  return fromAddress;
}

function getAppBaseUrl() {
  const appBaseUrl = normalizeBaseUrl(process.env.APP_BASE_URL);
  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL is not set");
  }
  return appBaseUrl;
}

const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(resendApiKey);

async function sendEmail({ to, subject, text }) {
  const response = await resend.emails.send({
    from: getEmailFromAddress(),
    to,
    subject,
    text,
  });

  return {
    messageId: response.data?.id || null,
    raw: response,
  };
}

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

  return await sendEmail({ to, subject, text });
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

  return await sendEmail({ to, subject, text });
}

async function sendOtpEmail({ to, otp, expiresInMinutes }) {
  const subject = "Verify your BDMS email";

  const text = `Your BDMS verification code is ${otp}.

This code expires in ${expiresInMinutes} minutes.

If you did not request this registration, ignore this email.
`;

  return await sendEmail({ to, subject, text });
}

async function sendPasswordResetEmail({ to, token, expiresInMinutes }) {
  const resetBaseUrl = normalizeBaseUrl(process.env.PASSWORD_RESET_BASE_URL) || getAppBaseUrl();
  const resetLink = `${resetBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Reset your BDMS password";

  const text = `A password reset was requested for your BDMS account.

Reset link:
${resetLink}

This link expires in ${expiresInMinutes} minutes and can be used only once.

If you did not request a password reset, ignore this email.
`;

  return await sendEmail({ to, subject, text });
}

async function sendCampStatusEmail({ to, campName, status }) {
  const subject = `Blood Camp Proposal ${status.toUpperCase()}`;
  
  const text = `Hello,

Your blood donation camp proposal for "${campName}" has been ${status}.
${status === 'approved' ? 'It is now visible to donors in the area.' : 'Please contact the administration for more information.'}

Thank you,
Blood Donation System
`;

  return await sendEmail({ to, subject, text });
}

async function sendCampReviewOutcomeEmail({
  to,
  campName,
  status,
  bloodBankName,
  bloodBankPhone = null,
  bloodBankEmail = null,
}) {
  const normalizedStatus = String(status || "").toLowerCase();
  const readableStatus = normalizedStatus === "approved" ? "accepted" : "denied";
  const subject = `Blood Camp Proposal ${readableStatus.toUpperCase()}`;

  const text = `Hello,

Your blood donation camp proposal for "${campName}" has been ${readableStatus} by ${bloodBankName || "the assigned blood bank"}.
${normalizedStatus === "approved" ? "The camp is now active in the system and visible for donor discovery." : "You can coordinate with another blood bank or submit an updated proposal later."}

${bloodBankPhone ? `Blood bank contact phone: ${bloodBankPhone}\n` : ""}${bloodBankEmail ? `Blood bank contact email: ${bloodBankEmail}\n` : ""}
Thank you,
Blood Donation System
`;

  return await sendEmail({ to, subject, text });
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

  return await sendEmail({ to, subject, text });
}

async function sendHospitalVerificationEmail({
  to,
  hospitalName,
  tempPassword = null,
}) {
  const subject = "Hospital verification successful - BDMS access details";
  const loginUrl = `${getAppBaseUrl()}/login`;

  const text = `Hello ${hospitalName || "Hospital Team"},

Your hospital account has been verified successfully.

Login URL: ${loginUrl}
Account Type: Hospital
Email: ${to}
${tempPassword ? `Temporary Password: ${tempPassword}` : "Password: Your previously configured password remains active."}

Please login and update your password as soon as possible.
If you cannot login, use the admin support channel to reset credentials.

Regards,
Blood Donation System
`;

  return await sendEmail({ to, subject, text });
}

async function sendBloodBankVerificationEmail({
  to,
  bloodBankName,
  tempPassword = null,
}) {
  const subject = "Blood bank verification successful - BDMS access details";
  const loginUrl = `${getAppBaseUrl()}/login`;

  const text = `Hello ${bloodBankName || "Blood Bank Team"},

Your blood bank account has been verified successfully.

Login URL: ${loginUrl}
Account Type: Blood Bank
Email: ${to}
${tempPassword ? `Temporary Password: ${tempPassword}` : "Password: Your previously configured password remains active."}

Please login and update your password as soon as possible.
If you cannot login, use the admin support channel to reset credentials.

Regards,
Blood Donation System
`;

  return await sendEmail({ to, subject, text });
}

module.exports = {
  sendEmergencyEmail,
  sendHospitalDonorAcceptanceEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendCampStatusEmail,
  sendCampReviewOutcomeEmail,
  sendRegularBloodRequestEmail,
  sendHospitalVerificationEmail,
  sendBloodBankVerificationEmail,
};
