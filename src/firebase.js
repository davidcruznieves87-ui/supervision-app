import {
  initializeApp
} from "firebase/app";

import {
  getFirestore
} from "firebase/firestore";

import {
  getAuth
} from "firebase/auth";

import {
  getStorage
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRj4kACyan03xcMLxjn6pKFwKHXO5kVUM",
  authDomain: "supervisionapp-209e4.firebaseapp.com",
  projectId: "supervisionapp-209e4",
  storageBucket:"supervisionapp-209e4.firebasestorage.app",
  messagingSenderId: "256289638024",
  appId: "1:256289638024:web:ab179e17d018113cb3413d",

};

const app =
  initializeApp(firebaseConfig);

// 🔥 EXPORTS
export const db =
  getFirestore(app);

export const auth =
  getAuth(app);

export const storage =
  getStorage(app);