const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || 'algbnb-c0a71';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: projectId,
  });
}

module.exports = admin;
