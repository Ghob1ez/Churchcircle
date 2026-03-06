import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromCache, 
  enableIndexedDbPersistence,
  setDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (window as any).process?.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (window as any).process?.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (window as any).process?.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (window as any).process?.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (window as any).process?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (window as any).process?.env?.VITE_FIREBASE_APP_ID,
};

// Guard against missing configuration
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(`Firebase configuration is incomplete. Missing keys: ${missingKeys.join(", ")}`);
  console.error("Please ensure you have set these VITE_FIREBASE_* variables in the AI Studio Secrets panel.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Disable offline persistence for better compatibility on older devices
// if (typeof window !== 'undefined') {
//   enableIndexedDbPersistence(db).catch((err) => {
//     if (err.code === 'failed-precondition') {
//       console.warn("Firestore persistence failed: Multiple tabs open");
//     } else if (err.code === 'unimplemented') {
//       console.warn("Firestore persistence failed: Browser not supported");
//     }
//   });
// }

export const getUserRole = async (userId: string, email?: string | null) => {
  const userRef = doc(db, "users", userId);
  const adminEmail = "georgeghobrial97@gmail.com";
  const normalizedEmail = email?.toLowerCase();
  const normalizedAdminEmail = adminEmail.toLowerCase();

  // Always ensure the user document exists in the background
  getDoc(userRef).then(async (userDoc) => {
    const isSpecialAdmin = normalizedEmail === normalizedAdminEmail;
    const currentRole = userDoc.exists() ? userDoc.data().role : "member";
    const targetRole = isSpecialAdmin ? "admin" : currentRole;

    if (!userDoc.exists() || (isSpecialAdmin && userDoc.data().role !== "admin")) {
      await setDoc(userRef, {
        email: email,
        role: targetRole,
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }, { merge: true });
    } else {
      // Just update last seen
      await setDoc(userRef, {
        lastSeen: new Date().toISOString()
      }, { merge: true });
    }
  }).catch(err => console.error("Background user sync failed:", err));

  if (normalizedEmail === normalizedAdminEmail) {
    return "admin";
  }
  
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().role as "member" | "admin";
    }
  } catch (error: any) {
    console.warn(`getUserRole failed (${error.code}), attempting cache fallback...`);
    try {
      const cachedDoc = await getDocFromCache(userRef);
      if (cachedDoc.exists()) {
        return cachedDoc.data().role as "member" | "admin";
      }
    } catch (cacheError) {
      // Cache might be empty
    }
  }
  
  return "member";
};
