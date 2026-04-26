const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;
const requiredFirebaseAdminEnvKeys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingFirebaseAdminEnvKeys = requiredFirebaseAdminEnvKeys.filter((key) => !process.env[key]?.trim());
const isFirebaseAdminConfigured = missingFirebaseAdminEnvKeys.length === 0;

if (!admin.apps.length) {
  if (isFirebaseAdminConfigured) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    admin.initializeApp({
      projectId: projectId || undefined,
    });
  }
}

admin.isFirebaseAdminConfigured = isFirebaseAdminConfigured;
admin.missingFirebaseAdminEnvKeys = missingFirebaseAdminEnvKeys;

module.exports = admin;
