import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { DeleteUpdatedTable } from "~/components/conflicts/deleteUpdated/table";
import type { DeleteUpdatedConflict } from "~/hooks/useOperationQueue/types";

type Props = {
  conflict: DeleteUpdatedConflict;
};

export const ItemDeleteConflictDialog = ({ conflict }: Props) => {
  const handleKeepItem = async () => {
    await conflict.onReject();
  };

  const handleDeleteAnyway = async () => {
    await conflict.onApprove();
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Deletion conflict detected</DialogTitle>
          <DialogDescription>
            You deleted this item locally, but it was updated on another device.
            Choose whether to keep the updated item or delete it from the
            server.
          </DialogDescription>
        </DialogHeader>
        <Separator className="mt-2" />
        <div className="mt-4 space-y-4 text-sm">
          <DeleteUpdatedTable
            remote={conflict.old}
            localTime={conflict.local_time}
          />
        </div>
        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleKeepItem}>
              Keep updated item
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAnyway}
            >
              Delete anyway
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
