import type { PWASupabaseWrapper } from "pwa-supabase-wrapper";
import type { User } from "@supabase/supabase-js";
import { createContext } from "react";

export type SupabaseContextType = {
  wrapper: PWASupabaseWrapper | null;
  user: User | null;
  loading: boolean;
};

export const SupabaseContext = createContext<SupabaseContextType | null>(null);
