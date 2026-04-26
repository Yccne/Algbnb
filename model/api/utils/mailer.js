const nodemailer = require('nodemailer');

let transporter;

const hasSmtpConfig = () =>
  Boolean(
    (process.env.SMTP_HOST || process.env.MAIL_HOST) &&
      (process.env.SMTP_PORT || process.env.MAIL_PORT) &&
      (process.env.SMTP_FROM || process.env.MAIL_FROM)
  );

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (hasSmtpConfig()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.MAIL_HOST,
      port: Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587),
      secure: String(process.env.SMTP_SECURE || process.env.MAIL_SECURE || 'false') === 'true',
      auth:
        process.env.SMTP_USER || process.env.MAIL_USER
          ? {
              user: process.env.SMTP_USER || process.env.MAIL_USER,
              pass: process.env.SMTP_PASS || process.env.MAIL_PASS || '',
            }
          : undefined,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return transporter;
};

const getFromAddress = () =>
  process.env.SMTP_FROM || process.env.MAIL_FROM || 'algbnb-local@localhost';

const sendMail = async ({ to, subject, text, html }) => {
  if (!to) {
    return { skipped: true, reason: 'missing-recipient' };
  }

  const info = await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  if (!hasSmtpConfig()) {
    console.log(
      `[mail][local-preview] to=${to} subject="${subject}" text="${String(text || '').slice(0, 120)}"`
    );
  }

  return info;
};

module.exports = {
  hasSmtpConfig,
  sendMail,
};
