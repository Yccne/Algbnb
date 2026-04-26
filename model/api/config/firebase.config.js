const admin = require('../utils/firebaseAdmin');

const getFirebaseProviderStatus = () => {
  const firebaseAdminReady = Boolean(admin.isFirebaseAdminConfigured);
  const firebaseProjectReady = firebaseAdminReady && Boolean(admin.firebaseProjectId);

  return {
    google: firebaseAdminReady,
    google_backend_missing: admin.missingFirebaseAdminEnvKeys || [],
    facebook: firebaseAdminReady,
    facebook_backend_missing: admin.missingFirebaseAdminEnvKeys || [],
    firebase_admin_ready: firebaseAdminReady,
    firebase_project_ready: firebaseProjectReady,
    firebase_project_id: admin.firebaseProjectId || null,
    message: firebaseAdminReady
      ? ''
      : 'Configuration Firebase Admin incomplete cote API.',
    note: 'Google et Facebook utilisent Firebase.',
  };
};

module.exports = {
  firebaseAdmin: admin,
  getFirebaseProviderStatus,
};
