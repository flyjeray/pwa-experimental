import type { DatabaseItemEditableFields } from "pwa-supabase-wrapper/dist/components/items";

export type LocalCreateOperation = {
  type: "create";
  payload: DatabaseItemEditableFields;
  time: number;
};

export type LocalUpdateOperation = {
  type: "update";
  payload: DatabaseItemEditableFields;
  id: string;
  time: number;
};

export type LocalDeleteOperation = {
  type: "delete";
  id: string;
  time: number;
};

export type LocalOperation =
  | LocalCreateOperation
  | LocalUpdateOperation
  | LocalDeleteOperation;

const STORAGE_KEY = "operation-queue";

export const getQueueFromStorage = (): LocalOperation[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as LocalOperation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const updateQueueInStorage = (queue: LocalOperation[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore write errors
  }
};
