const dashboardRepository = require('../repositories/dashboard.repository');
const { forbidden } = require('../utils/httpError');

const getHostDashboard = async (hostId) => {
  const [statsResult, logementsResult, reservationsResult, revenusResult, notificationsResult] = await Promise.all([
    dashboardRepository.getHostStats(hostId),
    dashboardRepository.getHostListings(hostId),
    dashboardRepository.getHostReservations(hostId),
    dashboardRepository.getHostMonthlyRevenue(hostId),
    dashboardRepository.getHostNotifications(hostId),
  ]);

  return {
    stats: statsResult.rows[0] || {},
    logements: logementsResult.rows,
    reservations: reservationsResult.rows,
    revenus_mois: revenusResult.rows,
    notifications: notificationsResult.rows,
  };
};

const getHostDashboardForUser = ({ currentUser, hostId }) => {
  if (String(currentUser.id) !== String(hostId) && currentUser.role !== 'admin') {
    throw forbidden('Acces refuse.');
  }
  return getHostDashboard(Number(hostId));
};

module.exports = {
  getHostDashboard,
  getHostDashboardForUser,
};
