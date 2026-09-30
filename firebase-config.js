// ============================================
// Firebase Configuration
// ============================================
// 1. Go to Firebase Console → Project Settings → General
// 2. Scroll to "Your apps" → Web app → copy the config object
// 3. Paste your real values below (replace every "YOUR_..." placeholder)

const firebaseConfig = {
  apiKey: "AIzaSyAcW6Xj6S6AyPtfMnlYBLoo7x7Bs0jpQLQ",
  authDomain: "cafecanada-3afec.firebaseapp.com",
  projectId: "cafecanada-3afec",
  storageBucket: "cafecanada-3afec.firebasestorage.app",
  messagingSenderId: "207831639965",
  appId: "1:207831639965:web:a62f6900ef8af9cd23f174"
};

// Initialize Firebase (compat SDK — works with plain <script> tags, no build step)
firebase.initializeApp(firebaseConfig);

// Firestore is used on every page, so initialize it first and unconditionally.
const db = firebase.firestore();

// Auth and Storage are only needed on pages that loaded their SDK scripts
// (menu.html, for example, doesn't need them). Guard against pages missing
// those <script> tags so this file never crashes and "db" always works.
let auth = null;
if (typeof firebase.auth === 'function') {
  auth = firebase.auth();
  // Force session to persist in the browser (prevents unexpected auto sign-outs)
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(err => console.error('Auth persistence error:', err));
}

let storage = null;
if (typeof firebase.storage === 'function') {
  storage = firebase.storage();
}
