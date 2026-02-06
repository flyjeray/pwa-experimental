import type {
  DatabaseItemEditableFields,
  DatabaseItemRow,
} from "pwa-supabase-wrapper/dist/components/items";
import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { toast } from "sonner";
import { useSupabase } from "~/supabase/hooks";
import type { PWASupabaseWrapper } from "pwa-supabase-wrapper";

type LocalCreateOperation = {
  type: "create";
  payload: DatabaseItemEditableFields;
  time: number;
};

type LocalUpdateOperation = {
  type: "update";
  payload: Partial<DatabaseItemEditableFields>;
  id: string;
  time: number;
};

type LocalDeleteOperation = {
  type: "delete";
  id: string;
  time: number;
};

type LocalOperation =
  | LocalCreateOperation
  | LocalUpdateOperation
  | LocalDeleteOperation;

const getQueueFromStorage = (): LocalOperation[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("operation-queue");
    if (!raw) return [];

    const parsed = JSON.parse(raw) as LocalOperation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const updateQueueInStorage = (queue: LocalOperation[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem("operation-queue", JSON.stringify(queue));
  } catch {
    // Ignore write errors
  }
};

export const useEditOperationQueue = () => {
  const { wrapper, user } = useSupabase();

  const addCreate = (payload: DatabaseItemEditableFields) => {
    updateQueueInStorage([
      ...getQueueFromStorage(),
      { type: "create", payload, time: Date.now() },
    ]);
  };

  const addUpdate = (
    id: string,
    payload: Partial<DatabaseItemEditableFields>
  ) => {
    updateQueueInStorage([
      ...getQueueFromStorage(),
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

export type UpdateConflict = {
  old: DatabaseItemRow;
  updated: Partial<DatabaseItemEditableFields>;
  local_time: number;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};

type Props = {
  onAdd?: (fields: DatabaseItemEditableFields) => Promise<void>;
  onUpdate?: (
    id: string,
    fields: Partial<DatabaseItemEditableFields>
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdateConflict?: (conflict: UpdateConflict | null) => Promise<void> | void;
};

type ApplyQueueProps = Props & { wrapper: PWASupabaseWrapper };

const applyQueue = async ({
  onAdd,
  onUpdate,
  onUpdateConflict,
  wrapper,
}: ApplyQueueProps) => {
  const processNext = async () => {
    const queue = [...getQueueFromStorage()].sort((a, b) => a.time - b.time);
    if (queue.length === 0) return;

    const [operation, ...rest] = queue;

    const saveRest = () => {
      updateQueueInStorage(rest);
    };

    if (operation.type === "create") {
      if (!onAdd) return;

      try {
        await onAdd(operation.payload);
        toast.success(`Pushed new item "${operation.payload.title}" to remote`);
        saveRest();
        await processNext();
      } catch {
        toast.error(
          `Failed to push item "${operation.payload.title}" to remote`
        );
      }

      return;
    }

    if (operation.type === "update") {
      if (!onUpdate) return;

      try {
        const response = await wrapper.db.items.getItem(operation.id);
        if (!response || !response.data) throw new Error("Item not found");

        const remoteItem: DatabaseItemRow = response.data;
        const isOverwriteConflict =
          new Date(remoteItem.updated_at).getTime() > operation.time;

        if (!isOverwriteConflict) {
          await onUpdate(operation.id, operation.payload);
          toast.success(`Pushed update for item "${operation.id}" to remote`);
          saveRest();
          await processNext();
          return;
        }

        if (!onUpdateConflict) {
          toast.error(
            `Conflict detected for item "${operation.id}". Update was not pushed.`
          );
          return;
        }

        await onUpdateConflict({
          old: remoteItem,
          updated: operation.payload,
          local_time: operation.time,
          onApprove: async () => {
            const q = [...getQueueFromStorage()].sort(
              (a, b) => a.time - b.time
            );
            const index = q.findIndex((op) => op.time === operation.time);
            if (index === -1) {
              await onUpdateConflict(null);
              await processNext();
              return;
            }

            const op = q[index] as LocalUpdateOperation;
            await onUpdate(op.id, op.payload);
            toast.success(
              `Pushed update for item "${op.id}" to remote (resolved conflict)`
            );
            q.splice(index, 1);
            updateQueueInStorage(q);
            await onUpdateConflict(null);
            await processNext();
          },
          onReject: async () => {
            const q = [...getQueueFromStorage()].sort(
              (a, b) => a.time - b.time
            );
            const index = q.findIndex((op) => op.time === operation.time);
            if (index !== -1) {
              q.splice(index, 1);
              updateQueueInStorage(q);
            }

            await onUpdateConflict(null);
            await processNext();
          },
        });
      } catch {
        toast.error(
          `Failed to push update for item "${operation.payload.title}" to remote`
        );
      }

      return;
    }
  };

  await processNext();
};

export const useApplyOperationQueue = (
  handlers: Omit<Props, "onUpdateConflict">
) => {
  const { wrapper } = useSupabase();
  const isOnline = useOnlineStatus();
  const [updateConflict, setUpdateConflict] = useState<UpdateConflict | null>(
    null
  );
  const handlersRef = useRef(handlers);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!isOnline || !wrapper) return;
    if (getQueueFromStorage().length === 0) return;

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    applyQueue({
      ...handlersRef.current,
      wrapper,
      onUpdateConflict: (conflict) => {
        setUpdateConflict(conflict);
      },
    }).finally(() => {
      isProcessingRef.current = false;
    });
  }, [isOnline, wrapper]);

  return { updateConflict };
};
