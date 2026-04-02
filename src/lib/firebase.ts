import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBGVzyeAgxT3b7lQSul7OsFrm1iUsc9SnM",
  authDomain: "drill-57978.firebaseapp.com",
  projectId: "drill-57978",
  storageBucket: "drill-57978.firebasestorage.app",
  messagingSenderId: "573652458576",
  appId: "1:573652458576:web:3b345643ec9312bf95c555",
  measurementId: "G-ZSKETCVK5J"
};

// Initialize Firebase (prevent double-init in dev mode)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
