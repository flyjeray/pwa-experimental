import { toast } from "sonner";
import {
  getQueueFromStorage,
  updateQueueInStorage,
  type LocalUpdateOperation,
  type LocalOperation,
} from "./storage";

const sortQueueByTime = (queue: LocalOperation[]) =>
  [...queue].sort((a, b) => a.time - b.time);

export const resolveQueuedUpdate = async (
  {
    operationTime,
    resetConflict,
    processNext,
  }: {
    operationTime: number;
    resetConflict?: () => Promise<void> | void;
    processNext: () => Promise<void>;
  },
  perform: (op: LocalUpdateOperation) => Promise<void>,
  successMessage?: (op: LocalUpdateOperation) => string
) => {
  const queue = sortQueueByTime(getQueueFromStorage());
  const index = queue.findIndex((op) => op.time === operationTime);

  if (index === -1) {
    if (resetConflict) {
      await resetConflict();
    }
    await processNext();
    return;
  }

  const op = queue[index] as LocalUpdateOperation;
  await perform(op);

  if (successMessage) {
    toast.success(successMessage(op));
  }

  queue.splice(index, 1);
  updateQueueInStorage(queue);

  if (resetConflict) {
    await resetConflict();
  }

  await processNext();
};

export const discardQueuedUpdate = async (
  {
    operationTime,
    resetConflict,
    processNext,
  }: {
    operationTime: number;
    resetConflict?: () => Promise<void> | void;
    processNext: () => Promise<void>;
  },
  successMessage?: string
) => {
  const queue = sortQueueByTime(getQueueFromStorage());
  const index = queue.findIndex((op) => op.time === operationTime);

  if (index !== -1) {
    queue.splice(index, 1);
    updateQueueInStorage(queue);
  }

  if (successMessage) {
    toast.success(successMessage);
  }

  if (resetConflict) {
    await resetConflict();
  }

  await processNext();
};
