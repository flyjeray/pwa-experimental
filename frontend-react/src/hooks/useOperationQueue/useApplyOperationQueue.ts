import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "../useOnlineStatus";
import { useSupabase } from "~/supabase/hooks";
import { getQueueFromStorage } from "./storage";
import type {
  DeleteUpdatedConflict,
  OverwriteConflict,
  QueueHandlers,
  WriteOverDeletedConflict,
} from "./types";
import { applyQueue } from "./applyQueue";

export const useApplyOperationQueue = (
  handlers: Omit<QueueHandlers, "onUpdateConflict">
) => {
  const { wrapper } = useSupabase();
  const isOnline = useOnlineStatus();

  const [conflicts, setConflicts] = useState({
    overwrite: null as OverwriteConflict | null,
    writeOverDeleted: null as WriteOverDeletedConflict | null,
    deletedUpdated: null as DeleteUpdatedConflict | null,
  });

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
      updateConflicts: (conflicts) => {
        setConflicts((prev) => ({ ...prev, ...conflicts }));
      },
    }).finally(() => {
      isProcessingRef.current = false;
    });
  }, [isOnline, wrapper]);

  return { conflicts };
};
