import { useEffect } from "react";
import type { DatabaseItemEditableFields } from "pwa-supabase-wrapper/dist/components/items";
import { useSupabase } from "~/supabase/hooks";
import { getQueueFromStorage, updateQueueInStorage } from "./storage";

export const useEditOperationQueue = () => {
  const { wrapper, user } = useSupabase();

  const addCreate = (payload: DatabaseItemEditableFields) => {
    updateQueueInStorage([
      ...getQueueFromStorage(),
      { type: "create", payload, time: Date.now() },
    ]);
  };

  const addUpdate = (id: string, payload: DatabaseItemEditableFields) => {
    const queue = getQueueFromStorage();

    // If there is already a queued update for this item, replace it
    const withoutPreviousUpdate = queue.filter(
      (op) => !(op.type === "update" && "id" in op && op.id === id)
    );

    updateQueueInStorage([
      ...withoutPreviousUpdate,
      { type: "update", id, payload, time: Date.now() },
    ]);
  };

  const addDelete = (id: string) => {
    updateQueueInStorage([
      ...getQueueFromStorage(),
      { type: "delete", id, time: Date.now() },
    ]);
  };

  useEffect(() => {
    if (!wrapper) return;

    const {
      data: { subscription },
    } = wrapper.getClient().auth.onAuthStateChange(async (event, session) => {
      if (!session?.user && event !== "INITIAL_SESSION") {
        updateQueueInStorage([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [wrapper, user]);

  return {
    create: addCreate,
    update: addUpdate,
    delete: addDelete,
  };
};
