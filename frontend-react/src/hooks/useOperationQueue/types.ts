import type {
  DatabaseItemEditableFields,
  DatabaseItemRow,
} from "pwa-supabase-wrapper/dist/components/items";

export type OverwriteConflict = {
  old: DatabaseItemRow;
  updated: DatabaseItemEditableFields;
  local_time: number;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};

export type WriteOverDeletedConflict = {
  old: null;
  updated: DatabaseItemEditableFields;
  local_time: number;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};

export type DeleteUpdatedConflict = {
  old: DatabaseItemRow;
  local_time: number;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};

export type QueueHandlers = {
  onAdd?: (
    fields: DatabaseItemEditableFields,
    doNotRefetch?: boolean
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    fields: Partial<DatabaseItemEditableFields>,
    doNotRefetch?: boolean
  ) => Promise<void>;
  onDelete?: (id: string, doNotRefetch?: boolean) => Promise<void>;

  onQueueStart?: () => Promise<void> | void;
  onQueueEnd?: () => Promise<void> | void;

  updateConflicts?: (conflicts: {
    overwrite?: OverwriteConflict | null;
    writeOverDeleted?: WriteOverDeletedConflict | null;
    deletedUpdated?: DeleteUpdatedConflict | null;
  }) => void;
};
