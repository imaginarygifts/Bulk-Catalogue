import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyGfduspFaEsyhtOY8EL3iMtHr9wVk8Rg",
  authDomain: "bulk-9831b.firebaseapp.com",
  projectId: "bulk-9831b",
  storageBucket: "bulk-9831b.firebasestorage.app",
  messagingSenderId: "223509407597",
  appId: "1:223509407597:web:45524dd4ac99537a25dc64",
  measurementId: "G-H9DLLRCHQP"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);