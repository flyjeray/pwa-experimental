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
import { UpdateConflictTable } from "~/components/conflicts/update/table";
import type { OverwriteConflict } from "~/hooks/useOperationQueue/types";

type Props = {
  conflict: OverwriteConflict;
};

export const UpdateConflictDialog = ({ conflict }: Props) => {
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
          <DialogTitle>Update conflict detected</DialogTitle>
          <DialogDescription>
            This item was changed on another device. Review the differences
            below and choose which version to keep.
          </DialogDescription>
        </DialogHeader>
        <Separator className="mt-2" />
        <div className="mt-4 space-y-4 text-sm">
          <UpdateConflictTable
            remote={conflict.old}
            updated={conflict.updated}
            localTime={conflict.local_time}
          />
        </div>
        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleReject}>
              Keep remote version
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={handleApprove}>
              Use my changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
