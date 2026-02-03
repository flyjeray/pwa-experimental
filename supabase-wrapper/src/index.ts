import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PWASupabaseAuth } from "./components/auth";
import { PWASupabaseItemsDB } from "./components/items";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

type SupabaseDB = {
  items: PWASupabaseItemsDB;
};

export class PWASupabaseWrapper {
  private static instance: PWASupabaseWrapper | null = null;
  private client: SupabaseClient;
  public auth: PWASupabaseAuth;
  public db: SupabaseDB;

  private constructor(config: SupabaseConfig) {
    this.client = createClient(config.url, config.anonKey);
    this.auth = new PWASupabaseAuth(this.client);
    this.db = {
      items: new PWASupabaseItemsDB(this.client),
    };
  }

  static getInstance(config?: SupabaseConfig): PWASupabaseWrapper {
    if (!PWASupabaseWrapper.instance) {
      if (!config) {
        throw new Error("Configuration is required for first initialization");
      }
      PWASupabaseWrapper.instance = new PWASupabaseWrapper(config);
    }
    return PWASupabaseWrapper.instance;
  }

  static resetInstance(): void {
    PWASupabaseWrapper.instance = null;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.auth.getSession();
      return !error;
    } catch (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
  }
}

export { createClient } from "@supabase/supabase-js";
export type { SupabaseClient } from "@supabase/supabase-js";
