import { useEffect, useState } from "react";
import { PWASupabaseWrapper } from "pwa-supabase-wrapper";

function App() {
  const [wrapper, setWrapper] = useState<PWASupabaseWrapper | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const setupWrapper = () => {
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
  };

  const testWrapperConnection = async () => {
    if (!wrapper) return;

    const isConnected = await wrapper.testConnection();
    setIsConnected(isConnected);
  };

  useEffect(() => {
    setupWrapper();
  }, []);

  useEffect(() => {
    testWrapperConnection();
  }, [wrapper]);

  return (
    <p>{isConnected ? "Connected to Supabase" : "Not connected to Supabase"}</p>
  );
}

export default App;
