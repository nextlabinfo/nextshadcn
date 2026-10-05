"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { ProfileRecord } from "./profile-data";

const schema = z.object({
  preferredName: z.string().min(1, "Preferred name is required"),
  legalName: z.string().min(1, "Legal name is required"),
  pronouns: z.string(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  personalEmail: z.string().email("Enter a valid email"),
  workPhone: z.string().min(1, "Work phone is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditPersonalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRecord;
  onSave: (updates: Partial<ProfileRecord>) => Promise<void>;
}

export function EditPersonalSheet({ open, onOpenChange, profile, onSave }: EditPersonalSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      preferredName: profile.preferredName,
      legalName: profile.legalName,
      pronouns: profile.pronouns,
      dateOfBirth: profile.dateOfBirth,
      personalEmail: profile.personalEmail,
      workPhone: profile.workPhone,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        preferredName: profile.preferredName,
        legalName: profile.legalName,
        pronouns: profile.pronouns,
        dateOfBirth: profile.dateOfBirth,
        personalEmail: profile.personalEmail,
        workPhone: profile.workPhone,
      });
    }
  }, [open, profile, form]);

  async function onSubmit(data: FormValues) {
    await onSave(data);
    toast.success("Personal information updated");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Edit personal information</SheetTitle>
          <SheetDescription>This information is private and visible only to administrators.</SheetDescription>
        </SheetHeader>

        <form
          id="edit-personal-form"
          className="flex-1 overflow-y-auto"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="gap-4 px-4 py-4">
            <Controller
              control={form.control}
              name="preferredName"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="per-preferred">Preferred name</FieldLabel>
                  <Input {...field} id="per-preferred" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="legalName"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="per-legal">Legal name</FieldLabel>
                  <Input {...field} id="per-legal" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="pronouns"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="per-pronouns">Pronouns</FieldLabel>
                  <Input {...field} id="per-pronouns" placeholder="e.g. She / her" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="dateOfBirth"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="per-dob">Date of birth</FieldLabel>
                  <Input
                    {...field}
                    id="per-dob"
                    placeholder="e.g. September 9, 1993"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="personalEmail"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="per-email">Personal email</FieldLabel>
                  <Input {...field} id="per-email" type="email" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="workPhone"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="per-phone">Work phone</FieldLabel>
                  <Input {...field} id="per-phone" type="tel" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <SheetFooter className="border-t px-4 py-4">
          <SheetClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </SheetClose>
          <Button form="edit-personal-form" type="submit" disabled={form.formState.isSubmitting}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
