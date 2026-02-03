import type { Database } from "pwa-supabase-types";
import { useEffect, useState } from "react";
import { useSupabase } from "~/supabase/hooks";

export const useItems = () => {
  const { wrapper, user } = useSupabase();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [items, setItems] = useState<
    Database["public"]["Tables"]["items"]["Row"][]
  >([]);

  const fetchItems = async () => {
    if (!wrapper) {
      throw new Error("Supabase wrapper is not initialized");
    }
    setIsLoading(true);
    const { data, error } = await wrapper.db.items.getAllItems();
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
