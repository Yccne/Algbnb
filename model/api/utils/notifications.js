const { sendMail } = require('./mailer');

const safeSendMail = async (mail) => {
  try {
    return await sendMail(mail);
  } catch (error) {
    console.error('[mail] send failed:', error.message);
    return null;
  }
};

const queueUserMail = (jobs, user, subject, text, html = null) => {
  if (!user?.email) {
    return;
  }

  jobs.push(
    safeSendMail({
      to: user.email,
      subject,
      text,
      html,
    })
  );
};

module.exports = {
  queueUserMail,
  safeSendMail,
};
