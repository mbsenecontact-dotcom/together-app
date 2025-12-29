import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCNIiRcuKvD0O81PGszjR6bNGGGCXNWC_o",
  authDomain: "juzmanager.firebaseapp.com",
  projectId: "juzmanager",
  storageBucket: "juzmanager.firebasestorage.app",
  messagingSenderId: "444689419534",
  appId: "1:444689419534:web:e0cb11f55e57354eaadb5f"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
//export const sessionPath = "sessions/defaultSession/juz";
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();


// Session / campagnes constants
// Default session id used for backward compatibility
//export const DEFAULT_SESSION_ID = 'defaultSession';
export const SESSIONS_COLLECTION = 'sessions';


// helper: retourne un tableau de segments de chemin si besoin
export function juzDocPathParts(sessionId, juzNumber){
  sessionId = sessionId || DEFAULT_SESSION_ID;
  return [SESSIONS_COLLECTION, sessionId, 'juz', String(juzNumber)];
}
