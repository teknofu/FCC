import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.FIREBASE_APP_ID,
  measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID,
};

// Debug log to check if environment variables are loaded
console.log("Environment Variables Check:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  authDomain: firebaseConfig.authDomain ? "Present" : "Missing",
  projectId: firebaseConfig.projectId ? "Present" : "Missing",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable logging in development
if (import.meta.env.DEV) {
  console.log("Firebase initialized with config:", {
    ...firebaseConfig,
    apiKey: "***", // Hide API key in logs
  });
}

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn(
      "Multiple tabs open, persistence can only be enabled in one tab at a time."
    );
  } else if (err.code === "unimplemented") {
    console.warn("The current browser does not support persistence.");
  }
});

export { auth, db };
export default app;
