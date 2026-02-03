import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "pwa-supabase-types";

export class PWASupabaseItemsDB {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async storeItem(item: Database["public"]["Tables"]["items"]["Insert"]) {
    return this.client.from("items").insert({ ...item });
  }

  async getAllItems() {
    return this.client.from("items").select("*");
  }

  async getItem(id: string) {
    return this.client.from("items").select("*").eq("id", id).single();
  }
}
