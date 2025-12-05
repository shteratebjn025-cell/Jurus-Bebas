import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2Q-U8sXnCPhhiWQZpeGFwJ5rkKxGrY2Q",
  authDomain: "jurus-bebas-psht.firebaseapp.com",
  projectId: "jurus-bebas-psht",
  storageBucket: "jurus-bebas-psht.firebasestorage.app",
  messagingSenderId: "115915492464",
  appId: "1:115915492464:web:277d88689842e60bbfb8b5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
