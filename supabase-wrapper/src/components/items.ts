import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "pwa-supabase-types";

export type DatabaseItemRow = Database["public"]["Tables"]["items"]["Row"];

export type DatabaseItemEditableFields = Pick<
  DatabaseItemRow,
  "title" | "description" | "is_completed"
>;

export class PWASupabaseItemsDB {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async storeItem(item: Database["public"]["Tables"]["items"]["Insert"]) {
    return this.client.from("items").insert({ ...item });
  }

  async getAllItems() {
    return this.client
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
  }

  async getItem(id: string) {
    return this.client.from("items").select("*").eq("id", id).single();
  }

  async updateItem(id: string, fields: Partial<DatabaseItemEditableFields>) {
    return this.client
      .from("items")
      .update({ ...fields })
      .eq("id", id);
  }

  async deleteItem(id: string) {
    return this.client.from("items").delete().eq("id", id);
  }
}
