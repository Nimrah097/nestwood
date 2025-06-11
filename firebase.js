// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtqpTGGf0ZH7dhxum0DT3QTONFFDmLTtI",
  authDomain: "nessy-bc15f.firebaseapp.com",
  projectId: "nessy-bc15f",
  storageBucket: "nessy-bc15f.appspot.com",
  messagingSenderId: "938363270402",
  appId: "1:938363270402:web:49cdd19b22bd65cc4a3e1b",
  measurementId: "G-NKSDFDG0TP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
