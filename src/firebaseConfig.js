import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDCykb9Srb7d7GS-qifk9pHzxPgXCrrjqU",
  authDomain: "dmr-boutique.firebaseapp.com",
  databaseURL: "https://dmr-boutique-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dmr-boutique",
  storageBucket: "dmr-boutique.firebasestorage.app",
  messagingSenderId: "884618505264",
  appId: "1:884618505264:web:3dc7b536ea2c8e66c051f5"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);