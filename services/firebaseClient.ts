import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Standard Navigo Firebase Configuration (Support for dynamic override via localStorage)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyALcUU5y2NCUdMq7lnjkuNKGk2SmI3Cxog",
  authDomain: "gen-lang-client-0203738035.firebaseapp.com",
  projectId: "gen-lang-client-0203738035",
  storageBucket: "gen-lang-client-0203738035.firebasestorage.app",
  messagingSenderId: "632273304905",
  appId: "1:632273304905:web:4ac74c636afe360d98ae98"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const getFirebaseConfig = () => {
  try {
    const customConfig = localStorage.getItem('navigo_firebase_config');
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      // Ensure the stored key is valid and not a legacy placeholder
      if (parsed?.apiKey && !parsed.apiKey.includes('DEFAULT') && parsed.apiKey.length > 20) {
        return parsed;
      }
      // Purge invalid legacy config
      localStorage.removeItem('navigo_firebase_config');
    }
  } catch (e) {
    console.warn("Using default Firebase config");
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config: typeof DEFAULT_FIREBASE_CONFIG) => {
  localStorage.setItem('navigo_firebase_config', JSON.stringify(config));
  app = null;
  db = null;
  auth = null;
};

export const initFirebase = () => {
  const config = getFirebaseConfig();
  if (!app) {
    try {
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      db = getFirestore(app);
      auth = getAuth(app);
    } catch (error) {
      console.error("Firebase init error:", error);
    }
  }
  return { app, db, auth };
};

export const getDb = (): Firestore | null => {
  const { db } = initFirebase();
  return db;
};

export const getFirebaseAuth = (): Auth | null => {
  const { auth } = initFirebase();
  return auth;
};
