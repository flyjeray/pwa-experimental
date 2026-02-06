import type { PWASupabaseWrapper } from "pwa-supabase-wrapper";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "~/supabase/hooks";
import { useOnlineStatus } from "./useOnlineStatus";
import type {
  DatabaseItemEditableFields,
  DatabaseItemRow,
} from "pwa-supabase-wrapper/dist/components/items";

const ITEMS_CACHE_KEY = "items-cache-v1";

const loadCachedItems = (): DatabaseItemRow[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ITEMS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as DatabaseItemRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getItemsFromNetwork = async (
  wrapper: PWASupabaseWrapper
): Promise<DatabaseItemRow[]> => {
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
): Promise<{ items: DatabaseItemRow[]; error: unknown | null }> => {
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
  const [items, setItems] = useState<DatabaseItemRow[]>(() =>
    loadCachedItems()
  );
  const isOnline = useOnlineStatus();
  const hasInitializedRef = useRef(false);

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
    hasInitializedRef.current = true;

    if (error) {
      throw error;
    }
  };

  const updateItem = async (
    id: string,
    fields: Partial<DatabaseItemEditableFields>
  ) => {
    if (!wrapper) return;

    const { error } = await wrapper.db.items.updateItem(id, fields);

    if (error) {
      console.error("Failed to update item:", error);
      throw error;
    }

    fetchItems();
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
    if (hasInitializedRef.current) return;
    fetchItems();
  }, [wrapper?.db, user?.email, isOnline]);

  return {
    data: items,
    refetch: fetchItems,
    isLoading,
    update: updateItem,
  };
};
