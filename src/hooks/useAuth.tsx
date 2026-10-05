import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeAuth, logOut, type AppUser } from "@/lib/store";
import { firebaseReady } from "@/lib/firebase";

const AuthContext = createContext<{ user: AppUser | null; loading: boolean }>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: AppUser | null; loading: boolean }>({
    user: null,
    loading: true,
  });
  useEffect(() => {
    if (!firebaseReady) {
      setState({ user: null, loading: false });
      return;
    }
    return subscribeAuth((user, loading) => setState({ user, loading }));
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return { ...useContext(AuthContext), logout: logOut };
}
