import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Remplace ces valeurs par celles de ton projet Firebase (Console > Paramètres du projet > Général > Tes applications > SDK setup and configuration)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_REMPLACER_PAR_TA_CLE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project-226691639782.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-226691639782",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project-226691639782.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "REMPLACER",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "REMPLACER"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de l'authentification et du fournisseur Google
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optionnel: tu peux forcer la sélection du compte Google à chaque fois
// googleProvider.setCustomParameters({
//   prompt: 'select_account'
// });
