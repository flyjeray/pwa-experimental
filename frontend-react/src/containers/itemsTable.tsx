import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ItemAddDialog } from "~/components/itemActionDialogs/add";
import { ItemDeleteDialog } from "~/components/itemActionDialogs/delete";
import { ItemEditDialog } from "~/components/itemActionDialogs/edit";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { UpdateConflictDialog } from "~/components/conflicts/update/dialog";
import { ItemDeletedConflictDialog } from "~/components/conflicts/writeOverDeleted/dialog";
import { ItemDeleteConflictDialog } from "~/components/conflicts/deleteUpdated/dialog";
import { useItems } from "~/hooks/useItems";
import { useApplyOperationQueue } from "~/hooks/useOperationQueue";
import { shortenID } from "~/lib/shortenID";
import { useState } from "react";

export const ItemsTable = () => {
  const {
    data,
    isLoading,
    add,
    update,
    delete: deleteItem,
    refetch,
  } = useItems();

  const [isQueueProcessing, setIsQueueProcessing] = useState(false);

  const { conflicts } = useApplyOperationQueue({
    onAdd: add,
    onUpdate: update,
    onDelete: deleteItem,

    onQueueStart: () => {
      toast.loading("Syncing changes with server...");
      setIsQueueProcessing(true);
    },
    onQueueEnd: () => {
      toast.success("Finished syncing changes");
      setIsQueueProcessing(false);
      refetch();
    },
  });

  const copyID = (id: string) => {
    navigator.clipboard
      .writeText(id)
      .then(() => toast.success("ID copied to clipboard"))
      .catch((error) => {
        console.error("Failed to copy ID to clipboard:", error);
      });
  };

  return (
    <div className={"flex flex-col gap-6"}>
      {conflicts.overwrite && (
        <UpdateConflictDialog conflict={conflicts.overwrite} />
      )}
      {conflicts.writeOverDeleted && (
        <ItemDeletedConflictDialog conflict={conflicts.writeOverDeleted} />
      )}
      {conflicts.deletedUpdated && (
        <ItemDeleteConflictDialog conflict={conflicts.deletedUpdated} />
      )}

      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Your items</CardTitle>
          <ItemAddDialog onSave={add} />
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              {(isLoading || (!isLoading && data.length > 0)) && (
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell className="text-right">Actions</TableCell>
                </TableRow>
              )}
            </TableHeader>

            <TableBody>
              {(isQueueProcessing || isLoading) &&
                Array.from({ length: 2 }).map((_, index) => (
                  <TableRow key={`loader-${index}`}>
                    <TableCell className="font-medium">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}

              {!(isQueueProcessing || isLoading) &&
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="flex gap-2 items-center font-medium">
                      {shortenID(item.id)}
                      <Button variant="outline" onClick={() => copyID(item.id)}>
                        <Copy />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell>{item.is_completed ? "Yes" : "No"}</TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      <ItemEditDialog
                        id={item.id}
                        fields={item}
                        onSave={update}
                      />
                      <ItemDeleteDialog id={item.id} onDelete={deleteItem} />
                    </TableCell>
                  </TableRow>
                ))}

              {!(isQueueProcessing || isLoading) && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
