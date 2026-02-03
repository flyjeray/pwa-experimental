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

export const ItemsTable = () => {
  const { data, isLoading } = useItems();

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
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell className="text-right">Completed</TableCell>
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
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading &&
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.is_completed ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
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
