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
import { WriteOverDeletedTable } from "~/components/conflicts/writeOverDeleted/table";
import type { WriteOverDeletedConflict } from "~/hooks/useOperationQueue/types";

type Props = {
  conflict: WriteOverDeletedConflict;
};

export const ItemDeletedConflictDialog = ({ conflict }: Props) => {
  const handleReject = async () => {
    await conflict.onReject();
  };

  const handleApprove = async () => {
    await conflict.onApprove();
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Item deleted on another device</DialogTitle>
          <DialogDescription>
            This item was deleted on another device. You can recreate it using
            your local changes, or discard your changes.
          </DialogDescription>
        </DialogHeader>
        <Separator className="mt-2" />
        <div className="mt-4 space-y-4 text-sm">
          <WriteOverDeletedTable
            updated={conflict.updated}
            localTime={conflict.local_time}
          />
        </div>
        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleReject}>
              Don&apos;t recreate
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={handleApprove}>
              Recreate item
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
