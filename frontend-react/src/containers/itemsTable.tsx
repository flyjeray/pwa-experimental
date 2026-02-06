import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ItemAddDialog } from "~/components/itemAddDialog";
import { ItemDeleteDialog } from "~/components/itemDeleteDialog";
import { ItemEditDialog } from "~/components/itemEditDialog";
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
import { UpdateConflictDialog } from "~/components/updateConflictDialog";
import { useItems } from "~/hooks/useItems";
import { useApplyOperationQueue } from "~/hooks/useOperationQueue";
import { shortenID } from "~/lib/shortenID";

export const ItemsTable = () => {
  const { data, isLoading, add, update, delete: deleteItem } = useItems();

  const { updateConflict } = useApplyOperationQueue({
    onAdd: add,
    onUpdate: update,
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
      {updateConflict && <UpdateConflictDialog conflict={updateConflict} />}

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
              {isLoading &&
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

              {!isLoading &&
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

              {!isLoading && data.length === 0 && (
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
