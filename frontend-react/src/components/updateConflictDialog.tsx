import type { UpdateConflict } from "~/hooks/useOperationQueue";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Separator } from "~/components/ui/separator";

type Props = {
  conflict: UpdateConflict;
};

export const UpdateConflictDialog = ({ conflict }: Props) => {
  const fields = ["title", "description", "is_completed"] as const;

  const fieldLabels: Record<(typeof fields)[number], string> = {
    title: "Title",
    description: "Description",
    is_completed: "Completed",
  };

  const formatValue = (
    field: (typeof fields)[number],
    value: unknown
  ): string => {
    if (field === "is_completed") {
      return value === true ? "Completed" : "Not completed";
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length === 0 ? "—" : trimmed;
    }

    if (value === null || value === undefined) return "—";

    return String(value);
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Field</TableHead>
                <TableHead>Remote value</TableHead>
                <TableHead>Your change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field}>
                  <TableCell className="align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {fieldLabels[field]}
                  </TableCell>
                  <TableCell className="align-top">
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {formatValue(field, conflict.old[field])}
                    </p>
                  </TableCell>
                  <TableCell className="align-top">
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {formatValue(field, conflict.updated[field])}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Last updated
                </TableCell>
                <TableCell className="align-top">
                  {new Date(conflict.old.updated_at).toLocaleString()}
                </TableCell>
                <TableCell className="align-top">
                  {new Date(conflict.local_time).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
