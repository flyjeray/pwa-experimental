import type { Database } from "pwa-supabase-types";
import type { PWASupabaseWrapper } from "pwa-supabase-wrapper";
import { useEffect, useState } from "react";
import { useSupabase } from "~/supabase/hooks";
import { useOnlineStatus } from "./useOnlineStatus";

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
  wrapper: PWASupabaseWrapper,
  isOnline: boolean
): Promise<{ items: ItemRow[]; error: unknown | null }> => {
  if (!isOnline) {
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
  const isOnline = useOnlineStatus();

  const fetchItems = async () => {
    if (!user) return;

    if (!wrapper) {
      setItems(loadCachedItems());
      return;
    }

    setIsLoading(true);
    const { items: nextItems, error } = await getItemsWithFallback(
      wrapper,
      isOnline
    );
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
        setItems([]);
        window.localStorage.removeItem(ITEMS_CACHE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [wrapper, user]);

  useEffect(() => {
    fetchItems();
  }, [wrapper, user, isOnline]);

  return { data: items, refetch: fetchItems, isLoading };
};
