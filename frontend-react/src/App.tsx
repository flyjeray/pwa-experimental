import { useEffect, useState } from "react";
import { PWASupabaseWrapper } from "pwa-supabase-wrapper";

function App() {
  const [wrapper, setWrapper] = useState<PWASupabaseWrapper | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
  };

  useEffect(() => {
    setupWrapper();
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!wrapper) {
      setError("Supabase is not initialized yet");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInError } = await wrapper.auth.signIn(email, password);

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage("Signed in successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p>{window.navigator.onLine ? "Online" : "Offline"}</p>

      <form onSubmit={handleSignIn}>
        <div>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={isLoading || !wrapper}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </>
  );
}

export default App;
