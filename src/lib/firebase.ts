import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Fill these from your Firebase project settings (see .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = !!firebaseConfig.apiKey;

// Lazy singletons — initialized only when config exists, so a missing .env
// shows a friendly setup screen instead of crashing the app.
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureApp() {
  if (!firebaseReady)
    throw new Error("Firebase is not configured. Copy .env.example to .env first.");
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(ensureApp());
    return (_auth as any)[prop];
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) _db = getFirestore(ensureApp());
    return (_db as any)[prop];
  },
});

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    if (!_storage) _storage = getStorage(ensureApp());
    return (_storage as any)[prop];
  },
});

if (!firebaseReady) {
  console.warn(
    "Firebase is not configured. Copy .env.example to .env and fill in your Firebase project values.",
  );
}
