// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJDE3Vc2oiDEjDtXC4Huxe978u4BhIV9A",
  authDomain: "fluxshare-6c913.firebaseapp.com",
  projectId: "fluxshare-6c913",
  storageBucket: "fluxshare-6c913.firebasestorage.app",
  messagingSenderId: "166373095063",
  appId: "1:166373095063:web:c9a2aa0f3e81256eb6dbd2",
  measurementId: "G-H4G2PKQFNJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };