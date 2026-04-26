import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const requiredFirebaseKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const firebaseValuesByKey = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

export const missingFirebaseConfigKeys = requiredFirebaseKeys.filter(
  (key) => !firebaseValuesByKey[key]?.trim(),
);

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

let firebaseClient = null;
let firebaseInitMessage = '';

const missingConfigMessage = () =>
  `Configuration Firebase manquante cote front. Ajoute ${missingFirebaseConfigKeys.join(', ')} dans apps/web-view/.env.`;

const normalizeFirebaseError = (error) => {
  if (error?.code === 'auth/invalid-api-key') {
    return 'La cle Firebase du front est invalide. Verifie VITE_FIREBASE_API_KEY dans apps/web-view/.env.';
  }

  return error?.message || 'Impossible d initialiser Firebase sur le front.';
};

export const getFirebaseClientStatus = () => {
  if (!isFirebaseConfigured) {
    return {
      ready: false,
      auth: null,
      googleProvider: null,
      message: missingConfigMessage(),
      missingKeys: missingFirebaseConfigKeys,
    };
  }

  if (firebaseClient) {
    return {
      ready: true,
      ...firebaseClient,
      message: '',
      missingKeys: [],
    };
  }

  if (firebaseInitMessage) {
    return {
      ready: false,
      auth: null,
      googleProvider: null,
      message: firebaseInitMessage,
      missingKeys: [],
    };
  }

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    firebaseClient = { app, auth, googleProvider };

    return {
      ready: true,
      ...firebaseClient,
      message: '',
      missingKeys: [],
    };
  } catch (error) {
    firebaseInitMessage = normalizeFirebaseError(error);

    return {
      ready: false,
      auth: null,
      googleProvider: null,
      message: firebaseInitMessage,
      missingKeys: [],
    };
  }
};
