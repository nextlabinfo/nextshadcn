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
  name: z.string().min(1, "Name is required"),
  preferredName: z.string().min(1, "Preferred name is required"),
  legalName: z.string().min(1, "Legal name is required"),
  pronouns: z.string(),
  jobTitle: z.string().min(1, "Job title is required"),
  workEmail: z.string().email("Enter a valid email"),
  workplace: z.string().min(1, "Workplace is required"),
  timeZone: z.string().min(1, "Time zone is required"),
  avatar: z.string().url("Enter a valid URL").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface EditHeaderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRecord;
  onSave: (updates: Partial<ProfileRecord>) => Promise<void>;
}

export function EditHeaderSheet({ open, onOpenChange, profile, onSave }: EditHeaderSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      preferredName: profile.preferredName,
      legalName: profile.legalName,
      pronouns: profile.pronouns,
      jobTitle: profile.jobTitle,
      workEmail: profile.workEmail,
      workplace: profile.workplace,
      timeZone: profile.timeZone,
      avatar: profile.avatar,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: profile.name,
        preferredName: profile.preferredName,
        legalName: profile.legalName,
        pronouns: profile.pronouns,
        jobTitle: profile.jobTitle,
        workEmail: profile.workEmail,
        workplace: profile.workplace,
        timeZone: profile.timeZone,
        avatar: profile.avatar,
      });
    }
  }, [open, profile, form]);

  async function onSubmit(data: FormValues) {
    await onSave({
      name: data.name,
      preferredName: data.preferredName,
      legalName: data.legalName,
      pronouns: data.pronouns,
      jobTitle: data.jobTitle,
      workEmail: data.workEmail,
      workplace: data.workplace,
      timeZone: data.timeZone,
      avatar: data.avatar || profile.avatar,
      initials: data.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    });
    toast.success("Profile updated");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Update your basic profile information.</SheetDescription>
        </SheetHeader>

        <form
          id="edit-header-form"
          className="flex-1 overflow-y-auto"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="gap-4 px-4 py-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-name">Full name</FieldLabel>
                  <Input {...field} id="hdr-name" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="preferredName"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-preferred">Preferred name</FieldLabel>
                  <Input {...field} id="hdr-preferred" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="legalName"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-legal">Legal name</FieldLabel>
                  <Input {...field} id="hdr-legal" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="pronouns"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-pronouns">Pronouns</FieldLabel>
                  <Input {...field} id="hdr-pronouns" placeholder="e.g. She / her" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="jobTitle"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-title">Job title</FieldLabel>
                  <Input {...field} id="hdr-title" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="workEmail"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-email">Work email</FieldLabel>
                  <Input {...field} id="hdr-email" type="email" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="workplace"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-workplace">Workplace</FieldLabel>
                  <Input
                    {...field}
                    id="hdr-workplace"
                    placeholder="Remote, Hybrid, On-site"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="timeZone"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-tz">Time zone</FieldLabel>
                  <Input {...field} id="hdr-tz" placeholder="e.g. UTC+5:30" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="avatar"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdr-avatar">Avatar URL</FieldLabel>
                  <Input
                    {...field}
                    id="hdr-avatar"
                    type="url"
                    placeholder="https://…"
                    aria-invalid={fieldState.invalid}
                  />
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
          <Button form="edit-header-form" type="submit" disabled={form.formState.isSubmitting}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
