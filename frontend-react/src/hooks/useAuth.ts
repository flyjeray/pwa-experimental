import { toast } from "sonner";
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

  const register = async (email: string, password: string) => {
    if (!wrapper) return;

    const { error } = await wrapper.auth.signUp(email, password);

    if (error) {
      toast.error(`Registration failed: ${error.message}`);
    } else {
      toast.success(
        "Registration successful! Please check your email to confirm your account."
      );
    }
  };

  return { login, logout, register };
};
