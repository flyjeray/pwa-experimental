import type { Database } from "pwa-supabase-types";
import type { PWASupabaseWrapper } from "pwa-supabase-wrapper";
import { useEffect, useState } from "react";
import { useSupabase } from "~/supabase/hooks";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];

const ITEMS_CACHE_KEY = "items-cache-v1";

const loadCachedItems = (): ItemRow[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ITEMS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ItemRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getItemsFromNetwork = async (
  wrapper: PWASupabaseWrapper
): Promise<ItemRow[]> => {
  const { data, error } = await wrapper.db.items.getAllItems();

  if (error) {
    throw error;
  }

  const fetchedItems = data || [];
  window.localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(fetchedItems));
  return fetchedItems;
};

const getItemsWithFallback = async (
  wrapper: PWASupabaseWrapper
): Promise<{ items: ItemRow[]; error: unknown | null }> => {
  if (!navigator.onLine) {
    return { items: loadCachedItems(), error: null };
  }

  try {
    const items = await getItemsFromNetwork(wrapper);
    return { items, error: null };
  } catch (error) {
    return { items: loadCachedItems(), error };
  }
};

export const useItems = () => {
  const { wrapper, user } = useSupabase();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [items, setItems] = useState<ItemRow[]>(() => loadCachedItems());

  const fetchItems = async () => {
    if (!wrapper) {
      setItems(loadCachedItems());
      return;
    }

    setIsLoading(true);
    const { items: nextItems, error } = await getItemsWithFallback(wrapper);
    setItems(nextItems);
    setIsLoading(false);

    if (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (!wrapper) return;

    const {
      data: { subscription },
    } = wrapper.getClient().auth.onAuthStateChange(async (event, session) => {
      if (!session?.user && event !== "INITIAL_SESSION") {
        window.localStorage.removeItem(ITEMS_CACHE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [wrapper]);

  useEffect(() => {
    fetchItems();
  }, [wrapper, user]);

  return { data: items, refetch: fetchItems, isLoading };
};
