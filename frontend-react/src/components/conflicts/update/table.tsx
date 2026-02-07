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

const fields = ["title", "description", "is_completed"] as const;

const fieldLabels: Record<keyof DatabaseItemEditableFields, string> = {
  title: "Title",
  description: "Description",
  is_completed: "Completed",
};

const formatValue = (
  field: keyof DatabaseItemEditableFields,
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

type Props = {
  remote: DatabaseItemRow;
  updated: DatabaseItemEditableFields;
  localTime: number;
};

export const UpdateConflictTable = ({ remote, updated, localTime }: Props) => {
  return (
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
                {formatValue(field, remote[field])}
              </p>
            </TableCell>
            <TableCell className="align-top">
              <p className="whitespace-pre-wrap break-words text-sm">
                {formatValue(field, updated[field])}
              </p>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell className="align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last updated
          </TableCell>
          <TableCell className="align-top">
            {new Date(remote.updated_at).toLocaleString()}
          </TableCell>
          <TableCell className="align-top">
            {new Date(localTime).toLocaleString()}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
