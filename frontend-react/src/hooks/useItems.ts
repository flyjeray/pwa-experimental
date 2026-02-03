import type { ItemEntry } from "pwa-supabase-wrapper/dist/components/items";
import { useEffect, useState } from "react";
import { useSupabase } from "~/supabase/hooks";

export const useItems = () => {
  const { wrapper, user } = useSupabase();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [items, setItems] = useState<ItemEntry[]>([]);

  const fetchItems = async () => {
    if (!wrapper) {
      throw new Error("Supabase wrapper is not initialized");
    }
    setIsLoading(true);
    const client = wrapper.getClient();
    const { data, error } = await client.from("items").select("*");
    setIsLoading(false);
    if (error) {
      setItems([]);
      throw error;
    }
    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
  }, [wrapper, user]);

  return { data: items, refetch: fetchItems, isLoading };
};
