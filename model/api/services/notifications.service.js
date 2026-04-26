const notificationsRepository = require('../repositories/notifications.repository');
const database = require('../repositories/database.repository');
const { notFound } = require('../utils/httpError');
const { buildPaginatedResponse } = require('../models/pagination.model');

const insertNotification = (queryable, userId, type, contenu, meta = null) =>
  notificationsRepository.insertNotification(queryable || database, userId, type, contenu, meta);

const getSummary = async (userId) => {
  const [unreadCount, items] = await Promise.all([
    notificationsRepository.countUnreadByUser(userId),
    notificationsRepository.findLatestByUser(userId, 5),
  ]);

  return {
    unread_count: unreadCount,
    items,
  };
};

const listNotifications = async (userId, options = {}) => {
  const limit = Math.min(50, Math.max(1, Number(options.limit || 20)));
  const offset = Math.max(0, Number(options.offset || 0));
  const unreadOnly = String(options.unreadOnly || 'false') === 'true';
  const [total, items] = await Promise.all([
    notificationsRepository.countByUser({ userId, unreadOnly }),
    notificationsRepository.findByUser({ userId, unreadOnly, limit, offset }),
  ]);
  return buildPaginatedResponse({ items, total, limit, offset });
};

const markAllRead = async (userId) => {
  await notificationsRepository.markAllRead(userId);
  return { message: 'Toutes les notifications ont ete marquees comme lues.' };
};

const markOneRead = async ({ notificationId, userId }) => {
  const notification = await notificationsRepository.markOneRead({ notificationId, userId });
  if (!notification) {
    throw notFound('Notification introuvable.');
  }
  return notification;
};

module.exports = {
  getSummary,
  insertNotification,
  listNotifications,
  markAllRead,
  markOneRead,
};
