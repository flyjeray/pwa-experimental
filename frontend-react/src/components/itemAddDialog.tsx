import { PlusCircle } from "lucide-react";
import type { DatabaseItemEditableFields } from "pwa-supabase-wrapper/dist/components/items";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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

type Props = {
  onSave: (fields: DatabaseItemEditableFields) => Promise<void>;
};

export const ItemAddDialog = ({ onSave }: Props) => {
  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const title = (formData.get(`title-new`) ?? "") as string;
    const description = (formData.get(`description-new`) ?? "") as string;
    const is_completed = (formData.get(`completed-checkbox-new`) ??
      false) as boolean;

    await onSave({ title, description, is_completed });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle />
          Add new item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add new item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor={`title-new`}>Title</Label>
              <Input id={`title-new`} name={`title-new`} />
            </Field>
            <Field>
              <Label htmlFor={`description-new`}>Description</Label>
              <Textarea id={`description-new`} name={`description-new`} />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id={`completed-checkbox-new`}
                name={`completed-checkbox-new`}
              />
              <Label htmlFor={`completed-checkbox-new`}>Completed</Label>
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
