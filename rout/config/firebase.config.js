const admin = require('../utils/firebaseAdmin');

const getFirebaseProviderStatus = () => ({
  google: Boolean(admin.isFirebaseAdminConfigured),
  google_backend_missing: admin.missingFirebaseAdminEnvKeys || [],
  facebook: Boolean(process.env.FACEBOOK_CLIENT_ID),
  note: 'Google utilise Firebase.',
});

module.exports = {
  firebaseAdmin: admin,
  getFirebaseProviderStatus,
};
