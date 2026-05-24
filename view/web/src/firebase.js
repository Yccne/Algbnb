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
  'Connexion Google temporairement indisponible.';

const normalizeFirebaseError = (error) => {
  if (error?.code === 'auth/invalid-api-key') {
    return 'Connexion Google temporairement indisponible. Verifie la cle Firebase locale.';
  }
  if (error?.code === 'auth/unauthorized-domain') {
    return 'Domaine local non autorise dans Firebase. Ajoute 127.0.0.1 et localhost dans Firebase Authentication.';
  }
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Connexion sociale non activee dans Firebase Console.';
  }

  return error?.message || 'Impossible d initialiser Firebase sur le front.';
};

export const getFirebaseClientStatus = () => {
  if (!isFirebaseConfigured) {
    return {
      ready: false,
      auth: null,
      googleProvider: null,
      providers: {},
      message: missingConfigMessage(),
      missingKeys: missingFirebaseConfigKeys,
      projectId: firebaseConfig.projectId || null,
    };
  }

  if (firebaseClient) {
    return {
      ready: true,
      ...firebaseClient,
      message: '',
      missingKeys: [],
      projectId: firebaseConfig.projectId || null,
    };
  }

  if (firebaseInitMessage) {
    return {
      ready: false,
      auth: null,
      googleProvider: null,
      providers: {},
      message: firebaseInitMessage,
      missingKeys: [],
      projectId: firebaseConfig.projectId || null,
    };
  }

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    firebaseClient = {
      app,
      auth,
      googleProvider,
      providers: {
        google: googleProvider,
      },
    };

    return {
      ready: true,
      ...firebaseClient,
      message: '',
      missingKeys: [],
      projectId: firebaseConfig.projectId || null,
    };
  } catch (error) {
    firebaseInitMessage = normalizeFirebaseError(error);

    return {
      ready: false,
      auth: null,
      googleProvider: null,
      providers: {},
      message: firebaseInitMessage,
      missingKeys: [],
      projectId: firebaseConfig.projectId || null,
    };
  }
};
