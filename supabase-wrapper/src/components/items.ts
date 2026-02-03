import { SupabaseClient } from "@supabase/supabase-js";

export type AddItemEntryPayload = {
  title: string;
  description: string | null;
  is_completed: boolean;
  owner_id: string;
};

export type ItemEntry = AddItemEntryPayload & {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
};

export class PWASupabaseItemsDB {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async storeItem(item: AddItemEntryPayload) {
    const { data, error } = await this.client.from("items").insert({ ...item });

    if (error) {
      throw new Error(`Failed to store item: ${error.message}`);
    }

    return data;
  }

  async getAllItems(): Promise<ItemEntry[]> {
    const { data, error } = await this.client.from("items").select("item");

    if (error) {
      throw new Error(`Failed to retrieve items: ${error.message}`);
    }

    return data ? data.map((row) => row.item) : [];
  }

  async getItem(id: string): Promise<ItemEntry | null> {
    const { data, error } = await this.client
      .from("items")
      .select("item")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve item: ${error.message}`);
    }

    return data ? data.item : null;
  }
}
