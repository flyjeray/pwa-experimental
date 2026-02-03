import { useSupabase } from "~/supabase/hooks";

export const useAuth = () => {
  const { wrapper } = useSupabase();

  const login = (email: string, password: string) => {
    if (!wrapper) return;

    return wrapper.auth.signIn(email, password);
  };

  const logout = () => {
    if (!wrapper) return;

    return wrapper.auth.signOut();
  };

  return { login, logout };
};
