import type { PWASupabaseWrapper } from "pwa-supabase-wrapper";
import { toast } from "sonner";
import type { DatabaseItemRow } from "pwa-supabase-wrapper/dist/components/items";
import { getQueueFromStorage, updateQueueInStorage } from "./storage";
import type { QueueHandlers } from "./types";
import { discardQueuedUpdate, resolveQueuedUpdate } from "./conflictHandlers";

export type ApplyQueueProps = QueueHandlers & { wrapper: PWASupabaseWrapper };

export const applyQueue = async ({
  onAdd,
  onUpdate,
  onDelete,
  onQueueEnd,
  updateConflicts,
  wrapper,
}: ApplyQueueProps) => {
  // process items from the queue in chronological order until it's empty
  const processNext = async () => {
    const queue = [...getQueueFromStorage()].sort((a, b) => a.time - b.time);

    if (queue.length === 0) {
      // signal completion once we've drained the queue
      if (onQueueEnd) onQueueEnd();
      return;
    }

    const [operation, ...rest] = queue;

    // helper for persisting the remaining queue after we handle this op
    const saveRest = () => {
      updateQueueInStorage(rest);
    };

    if (operation.type === "create") {
      if (!onAdd) return;

      try {
        // create ops are fire-and-forget: just push and move on
        await onAdd(operation.payload, true);
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
        // always re-read the current remote state before deciding what to do
        const response = await wrapper.db.items.getItem(operation.id);
        if (!response) {
          throw new Error("No response from server");
        }

        // if the item no longer exists remotely, offer to recreate it from local changes
        if (response.error && response.error.code === "PGRST116") {
          if (!updateConflicts || !onAdd) {
            toast.error(
              `Item "${operation.id}" no longer exists on remote. Update was not pushed.`
            );
            return;
          }

          await updateConflicts({
            writeOverDeleted: {
              old: null,
              updated: operation.payload,
              local_time: operation.time,
              onApprove: async () =>
                resolveQueuedUpdate(
                  {
                    operationTime: operation.time,
                    resetConflict: () =>
                      updateConflicts?.({ writeOverDeleted: null }),
                    processNext,
                  },
                  async (op) => {
                    await onAdd(op.payload, true);
                  },
                  () => `Recreated item from your local changes on remote`
                ),
              onReject: async () =>
                discardQueuedUpdate(
                  {
                    operationTime: operation.time,
                    resetConflict: () =>
                      updateConflicts?.({ writeOverDeleted: null }),
                    processNext,
                  },
                  `Discarded local changes because the item was deleted remotely`
                ),
            },
          });

          return;
        }

        if (response.error) {
          throw response.error;
        }

        if (!response.data) {
          throw new Error("Item not found");
        }

        const remoteItem: DatabaseItemRow = response.data;
        const isOverwriteConflict =
          new Date(remoteItem.updated_at).getTime() > operation.time;

        if (!isOverwriteConflict) {
          // remote is older than our local edit, so we can safely push
          await onUpdate(operation.id, operation.payload, true);
          toast.success(`Pushed update for item "${operation.id}" to remote`);
          saveRest();
          await processNext();
          return;
        }

        if (!updateConflicts) {
          // caller chose not to surface conflicts, so we fail fast with a toast
          toast.error(
            `Conflict detected for item "${operation.id}". Update was not pushed.`
          );
          return;
        }

        await updateConflicts({
          overwrite: {
            old: remoteItem,
            updated: operation.payload,
            local_time: operation.time,
            onApprove: async () =>
              // user accepted overwriting remote with local version
              resolveQueuedUpdate(
                {
                  operationTime: operation.time,
                  resetConflict: () => updateConflicts?.({ overwrite: null }),
                  processNext,
                },
                async (op) => {
                  await onUpdate(op.id, op.payload, true);
                },
                (op) =>
                  `Pushed update for item "${op.id}" to remote (resolved conflict)`
              ),
            onReject: async () =>
              // user kept remote version, so we just drop the queued update
              discardQueuedUpdate({
                operationTime: operation.time,
                resetConflict: () => updateConflicts?.({ overwrite: null }),
                processNext,
              }),
          },
        });
      } catch {
        toast.error(
          `Failed to push update for item "${operation.payload.title}" to remote`
        );
      }

      return;
    }

    if (operation.type === "delete") {
      if (!onDelete) return;

      try {
        // fetch current remote state to see whether delete still makes sense
        const response = await wrapper.db.items.getItem(operation.id);
        if (!response) {
          throw new Error("No response from server");
        }

        if (response.error && response.error.code === "PGRST116") {
          // already deleted remotely, so we can silently drop the local delete
          saveRest();
          await processNext();
          return;
        }

        if (response.error) {
          throw response.error;
        }

        if (!response.data) {
          // no data returned, treat this as already deleted remotely
          saveRest();
          await processNext();
          return;
        }

        const remoteItem: DatabaseItemRow = response.data;
        const isUpdatedAfterDelete =
          new Date(remoteItem.updated_at).getTime() > operation.time;

        if (!isUpdatedAfterDelete) {
          // remote hasn't changed since we queued the delete, so we can push it
          await onDelete(operation.id, true);
          toast.success(`Pushed delete for item "${operation.id}" to remote`);
          saveRest();
          await processNext();
          return;
        }

        if (!updateConflicts) {
          // deletion conflict without ui handler: show toast and keep remote
          toast.error(
            `Item "${operation.id}" was updated on another device. Delete was not pushed.`
          );
          return;
        }

        await updateConflicts({
          deletedUpdated: {
            old: remoteItem,
            local_time: operation.time,
            onApprove: async () => {
              // user confirmed delete even though remote was updated in the meantime
              await onDelete(operation.id, true);
              toast.success(
                `Deleted item "${operation.id}" despite remote update`
              );
              saveRest();
              await updateConflicts({ deletedUpdated: null });
              await processNext();
            },
            onReject: async () => {
              // user chose to keep the updated remote item, so we drop the local delete
              saveRest();
              await updateConflicts({ deletedUpdated: null });
              await processNext();
            },
          },
        });
      } catch {
        toast.error(
          `Failed to push delete for item "${operation.id}" to remote`
        );
      }

      return;
    }
  };

  await processNext();
};
