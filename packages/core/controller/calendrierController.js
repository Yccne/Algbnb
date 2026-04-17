const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Table of unavailable dates per logementId
// Format: { logementId: ['2026-04-10', '2026-04-11'] }
let unavailableDates = {
  1: ['2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14'],
  2: ['2026-05-01', '2026-05-02']
};

export const getDisponibilites = async (logementId) => {
  await mockDelay(500);
  return unavailableDates[logementId] || [];
};

export const bloquerDate = async (logementId, dateString) => {
  await mockDelay(400);
  if (!unavailableDates[logementId]) unavailableDates[logementId] = [];
  if (!unavailableDates[logementId].includes(dateString)) {
    unavailableDates[logementId].push(dateString);
  }
  return true;
};
