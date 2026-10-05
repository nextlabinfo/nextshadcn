"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { ProfileDocument } from "./profile-data";

const schema = z.object({
  name: z.string().min(1, "Document name is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["Signed", "Current"]),
  isRestricted: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (doc: Omit<ProfileDocument, "id" | "updatedAt">) => void;
}

export function AddDocumentDialog({ open, onOpenChange, onAdd }: AddDocumentDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      status: "Current",
      isRestricted: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: "", category: "", status: "Current", isRestricted: false });
    }
  }, [open, form]);

  function onSubmit(data: FormValues) {
    onAdd({
      name: data.name,
      category: data.category,
      status: data.status,
      isRestricted: data.isRestricted,
    });
    toast.success("Document added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
          <DialogDescription>Attach a document to this contractor profile.</DialogDescription>
        </DialogHeader>

        <form id="add-doc-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="doc-name">Document name</FieldLabel>
                  <Input
                    {...field}
                    id="doc-name"
                    placeholder="e.g. Employment contract"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="doc-cat">Category</FieldLabel>
                  <Input
                    {...field}
                    id="doc-cat"
                    placeholder="e.g. Contract, Policy, Compliance"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="doc-status">Status</FieldLabel>
                  <Input
                    {...field}
                    id="doc-status"
                    list="doc-status-options"
                    placeholder="Signed or Current"
                    aria-invalid={fieldState.invalid}
                  />
                  <datalist id="doc-status-options">
                    <option value="Signed" />
                    <option value="Current" />
                  </datalist>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="isRestricted"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="doc-restricted"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="doc-restricted" className="font-normal">
                      Restricted access
                    </FieldLabel>
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button form="add-doc-form" type="submit" disabled={form.formState.isSubmitting}>
            Add document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
