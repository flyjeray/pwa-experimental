import type {
  DatabaseItemEditableFields,
  DatabaseItemRow,
} from "pwa-supabase-wrapper/dist/components/items";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

const fieldLabels = {
  title: "Title",
  description: "Description",
  is_completed: "Completed",
} satisfies Record<keyof DatabaseItemEditableFields, string>;

type FieldKey = keyof typeof fieldLabels;

const formatValue = (field: FieldKey, value: unknown): string => {
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

type Props = {
  remote: DatabaseItemRow;
  localTime: number;
};

export const DeleteUpdatedTable = ({ remote, localTime }: Props) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">Field</TableHead>
          <TableHead>Remote value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.keys(fieldLabels).map((key) => {
          const field = key as FieldKey;
          return (
            <TableRow key={field}>
              <TableCell className="align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {fieldLabels[field]}
              </TableCell>
              <TableCell className="align-top">
                <p className="whitespace-pre-wrap break-words text-sm">
                  {formatValue(field, remote[field])}
                </p>
              </TableCell>
            </TableRow>
          );
        })}
        <TableRow>
          <TableCell className="align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last updated remotely
          </TableCell>
          <TableCell className="align-top">
            {new Date(remote.updated_at).toLocaleString()}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Deleted locally at
          </TableCell>
          <TableCell className="align-top">
            {new Date(localTime).toLocaleString()}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
