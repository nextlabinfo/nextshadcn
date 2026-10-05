"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import type { ProfileRecord } from "./profile-data";

const schema = z.object({
  bio: z.string().min(1, "Bio is required"),
  currentProject: z.string().min(1, "Current project is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRecord;
  onSave: (updates: Partial<ProfileRecord>) => Promise<void>;
}

export function EditOverviewSheet({ open, onOpenChange, profile, onSave }: EditOverviewSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: profile.bio,
      currentProject: profile.currentProject,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ bio: profile.bio, currentProject: profile.currentProject });
    }
  }, [open, profile, form]);

  async function onSubmit(data: FormValues) {
    await onSave({ bio: data.bio, currentProject: data.currentProject });
    toast.success("Overview updated");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Edit overview</SheetTitle>
          <SheetDescription>Update your bio and current project.</SheetDescription>
        </SheetHeader>

        <form
          id="edit-overview-form"
          className="flex-1 overflow-y-auto"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="gap-4 px-4 py-4">
            <Controller
              control={form.control}
              name="bio"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ov-bio">Bio</FieldLabel>
                  <Textarea {...field} id="ov-bio" rows={6} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="currentProject"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ov-project">Current project</FieldLabel>
                  <Textarea {...field} id="ov-project" rows={2} aria-invalid={fieldState.invalid} />
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
          <Button form="edit-overview-form" type="submit" disabled={form.formState.isSubmitting}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
