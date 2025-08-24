// import firestore fucntins
import { initializeApp, getApp, getApps } from "firebase/app";

// improt fierbase Auth service----
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
// actual db - to stre user data---
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnS7HzklAUL8sS5qbZh6oeUSLQUMJWaPg",
  authDomain: "connected-services-app.firebaseapp.com",
  projectId: "connected-services-app",
  storageBucket: "connected-services-app.firebasestorage.app",
  messagingSenderId: "562315486266",
  appId: "1:562315486266:web:eea180451280351df6c103",
};

// Start App --- lainch from @firebase lib
// Prevent re-init during Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// export Firestore instance --- to call form othr files
export const db = getFirestore(app);

// -- AUth State ----
export function authListen(cb: (uid: string | null) => void) {
  return onAuthStateChanged(auth, (u) => cb(u ? u.uid : null));
}

// --- Mananeg SIgnout Auth -- Bonjourr!---
export async function signInAnon() {
  await signInAnonymously(auth);
}

// --- Sigout Auth ---byeee!!
export async function signOutUser() {
  await signOut(auth);
}
