import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Standard Navigo Firebase Configuration (Support for dynamic override via localStorage)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-DEFAULT_NAVIGO_FIREBASE_KEY",
  authDomain: "navigo-mobility-os.firebaseapp.com",
  projectId: "navigo-mobility-os",
  storageBucket: "navigo-mobility-os.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:abcdef1234567890"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const getFirebaseConfig = () => {
  try {
    const customConfig = localStorage.getItem('navigo_firebase_config');
    if (customConfig) {
      return JSON.parse(customConfig);
    }
  } catch (e) {
    console.warn("Using default Firebase config");
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config: typeof DEFAULT_FIREBASE_CONFIG) => {
  localStorage.setItem('navigo_firebase_config', JSON.stringify(config));
  // Reset instance to re-initialize
  app = null;
  db = null;
  auth = null;
};

export const initFirebase = () => {
  if (!app) {
    const config = getFirebaseConfig();
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
