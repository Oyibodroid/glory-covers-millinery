import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCF8fCQf09_0i1x7s18DuHuZ6PQbEFjPe0",
  authDomain: "glory-covers.firebaseapp.com",
  projectId: "glory-covers",
  storageBucket: "glory-covers.firebasestorage.app",
  messagingSenderId: "830814355256",
  appId: "1:830814355256:web:7ee6d76b0273faece7cbcd",
  measurementId: "G-CTLW3X9RYC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;