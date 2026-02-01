import { useEffect, useState } from "react";
import { PWASupabaseWrapper } from "pwa-supabase-wrapper";

function App() {
  const [wrapper, setWrapper] = useState<PWASupabaseWrapper | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const setupWrapper = () => {
    const supabaseWrapper = PWASupabaseWrapper.getInstance({
      url: "https://your-supabase-url.supabase.co",
      anonKey: "your-anon-key",
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
