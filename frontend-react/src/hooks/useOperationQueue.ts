import type { DatabaseItemEditableFields } from "pwa-supabase-wrapper/dist/components/items";
import { useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { toast } from "sonner";

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

type Props = {
  onAdd?: (fields: DatabaseItemEditableFields) => Promise<void>;
  onUpdate?: (
    id: string,
    fields: Partial<DatabaseItemEditableFields>
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

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

  return {
    create: addCreate,
    update: addUpdate,
    delete: addDelete,
  };
};

const applyQueue = async ({ onAdd }: Props) => {
  const queue = [...getQueueFromStorage()].sort((a, b) => a.time - b.time);
  const remaining: LocalOperation[] = [];

  for (const operation of queue) {
    if (operation.type === "create" && onAdd) {
      try {
        await onAdd(operation.payload);
        toast.success(`Pushed new item "${operation.payload.title}" to remote`);
      } catch {
        toast.error(
          `Failed to push item "${operation.payload.title}" to remote`
        );
        remaining.push(operation);
      }
    } else {
      remaining.push(operation);
    }
  }

  updateQueueInStorage(remaining);
};

export const useApplyOperationQueue = (handlers: Props) => {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) return;
    if (getQueueFromStorage().length === 0) return;

    applyQueue(handlers);
  }, [isOnline, handlers]);

  return null;
};
