import { ItemEditDialog } from "~/components/itemEditDialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useItems } from "~/hooks/useItems";
import { shortenID } from "~/lib/shortenID";

export const ItemsTable = () => {
  const { data, isLoading, update } = useItems();

  return (
    <div className={"flex flex-col gap-6"}>
      <Card>
        <CardHeader>
          <CardTitle>Your items</CardTitle>
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
                    <TableCell className="font-medium">
                      {shortenID(item.id)}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell>{item.is_completed ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <ItemEditDialog
                        id={item.id}
                        fields={item}
                        onSave={update}
                      />
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
