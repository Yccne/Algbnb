const { sendMail } = require('./mailer');

const insertNotification = async (queryable, userId, type, contenu, meta = null) => {
  const result = await queryable.query(
    `
      INSERT INTO notification (id_utilisateur, type, contenu, meta)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [userId, type, contenu, meta]
  );

  return result.rows[0];
};

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
  insertNotification,
  queueUserMail,
  safeSendMail,
};
