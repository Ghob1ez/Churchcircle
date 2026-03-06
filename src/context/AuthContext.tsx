import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, getUserRole } from "../lib/firebase";
import { Shield } from "lucide-react";

interface AuthContextType {
  user: User | null;
  role: "member" | "admin" | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true, error: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"member" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("AuthContext: Still loading after 10s, forcing loading to false");
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? user.email : "no user");
      try {
        setUser(user);
        if (user) {
          const userRole = await getUserRole(user.uid, user.email);
          console.log("User role fetched:", userRole);
          setRole(userRole);
        } else {
          setRole(null);
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        if (error.code === 'auth/network-request-failed') {
          const msg = "Firebase Auth network request failed. This is often caused by ad-blockers, firewalls, or incorrect Firebase configuration. Please disable any ad-blockers and ensure your Firebase keys are correct.";
          console.error(msg);
          setError(msg);
        }
        setRole("member"); // Fallback
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <h2 className="text-xl font-bold text-neutral-900">Initializing Session</h2>
        <p className="mt-2 text-neutral-600 max-w-xs">
          Please wait while we securely connect to our authentication services.
        </p>
        <p className="mt-8 text-xs text-neutral-400">
          If this takes more than 10 seconds, an ad-blocker might be interfering.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4 text-red-600">
          <Shield className="h-12 w-12" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Connection Blocked</h1>
        <p className="mb-8 max-w-md text-neutral-600">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
