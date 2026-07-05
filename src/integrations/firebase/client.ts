import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCovNriLks-oxCMrh87K9qxszam-nYGMkw",
  authDomain: "swradb.firebaseapp.com",
  projectId: "swradb",
  storageBucket: "swradb.firebasestorage.app",
  messagingSenderId: "9087550898",
  appId: "1:9087550898:web:2cc773c92c5f5ebda610ab",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
