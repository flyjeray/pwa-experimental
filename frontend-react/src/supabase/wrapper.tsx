import { PWASupabaseWrapper } from "pwa-supabase-wrapper";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SupabaseContext } from "./context";
import type { User } from "@supabase/supabase-js";

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [wrapper, setWrapper] = useState<PWASupabaseWrapper | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupWrapper = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials not found in environment");
      }

      const supabaseWrapper = PWASupabaseWrapper.getInstance({
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      });

      if (supabaseWrapper) {
        setWrapper(supabaseWrapper);
      }

      const client = supabaseWrapper.getClient();

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === "INITIAL_SESSION") return;
        setUser(session?.user ?? null);
      });

      setLoading(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    setupWrapper();
  }, []);

  const contextValue = useMemo(
    () => ({
      wrapper,
      user,
      loading,
    }),
    [wrapper, user, loading]
  );
  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
};
