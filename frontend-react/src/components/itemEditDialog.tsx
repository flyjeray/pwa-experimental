import { EditIcon } from "lucide-react";
import type { DatabaseItemEditableFields } from "pwa-supabase-wrapper/dist/components/items";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Field, FieldGroup } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import type { SubmitEventHandler } from "react";
import { shortenID } from "~/lib/shortenID";

type Props = {
  id: string;
  fields: DatabaseItemEditableFields;
  onSave: (id: string, fields: DatabaseItemEditableFields) => Promise<void>;
};

export const ItemEditDialog = ({ id, fields, onSave }: Props) => {
  if (!id || !fields) return null;

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const title = (formData.get(`title-${id}`) ?? "") as string;
    const description = (formData.get(`description-${id}`) ?? "") as string;
    const is_completed = (formData.get(`completed-checkbox-${id}`) ??
      false) as boolean;

    await onSave(id, { title, description, is_completed });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <EditIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit item {shortenID(id)}</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor={`title-${id}`}>Title</Label>
              <Input
                id={`title-${id}`}
                name={`title-${id}`}
                defaultValue={fields.title}
              />
            </Field>
            <Field>
              <Label htmlFor={`description-${id}`}>Description</Label>
              <Textarea
                id={`description-${id}`}
                name={`description-${id}`}
                defaultValue={fields.description || ""}
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id={`completed-checkbox-${id}`}
                name={`completed-checkbox-${id}`}
                defaultChecked={fields.is_completed}
              />
              <Label htmlFor={`completed-checkbox-${id}`}>Completed</Label>
            </Field>
          </FieldGroup>
          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
