const admin = require('firebase-admin');

// Si tu ne fournis pas de firebase-adminsdk.json, "admin.initializeApp" sans arguments 
// utilisera les identifiants par défaut s'il tourne sur GCP, mais en local tu as besoin
// d'au moins spécifier le projectId.

const projectId = process.env.FIREBASE_PROJECT_ID || 'project-226691639782';

admin.initializeApp({
  projectId: projectId,
});

module.exports = admin;
