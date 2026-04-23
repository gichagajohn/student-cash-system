// Import Firebase core
import { initializeApp } from "firebase/app";

// Import services you actually use
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// (Optional) Analytics — can cause issues locally, so we’ll handle it safely
import { getAnalytics } from "firebase/analytics";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAkVJqTkw2v1g1Jg_3YqHnBx19RlAcGXNc",
  authDomain: "student-cash-system.firebaseapp.com",
  projectId: "student-cash-system",
  storageBucket: "student-cash-system.firebasestorage.app",
  messagingSenderId: "558662202985",
  appId: "1:558662202985:web:3a99a8493aa790bb2514f8",
  measurementId: "G-NSS1GEG83Z"
};

// Initialize app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// ⚠️ Optional: Analytics (only works in browser, not always in dev)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}