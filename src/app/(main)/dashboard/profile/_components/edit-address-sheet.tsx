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
import { Textarea } from "@/components/ui/textarea";

import type { ProfileRecord } from "./profile-data";

const schema = z.object({
  address: z.string().min(1, "Address is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  emergencyPhone: z.string().min(1, "Emergency phone is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRecord;
  onSave: (updates: Partial<ProfileRecord>) => Promise<void>;
}

export function EditAddressSheet({ open, onOpenChange, profile, onSave }: EditAddressSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: profile.address,
      emergencyContact: profile.emergencyContact,
      emergencyPhone: profile.emergencyPhone,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        address: profile.address,
        emergencyContact: profile.emergencyContact,
        emergencyPhone: profile.emergencyPhone,
      });
    }
  }, [open, profile, form]);

  async function onSubmit(data: FormValues) {
    await onSave(data);
    toast.success("Address and emergency contact updated");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Edit address and emergency contact</SheetTitle>
          <SheetDescription>This information is private and visible only to administrators.</SheetDescription>
        </SheetHeader>

        <form
          id="edit-address-form"
          className="flex-1 overflow-y-auto"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="gap-4 px-4 py-4">
            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="addr-address">Home address</FieldLabel>
                  <Textarea {...field} id="addr-address" rows={2} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="emergencyContact"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="addr-contact">Emergency contact</FieldLabel>
                  <Input
                    {...field}
                    id="addr-contact"
                    placeholder="e.g. Jane K. · Sister"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="emergencyPhone"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="addr-phone">Emergency phone</FieldLabel>
                  <Input {...field} id="addr-phone" type="tel" aria-invalid={fieldState.invalid} />
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
          <Button form="edit-address-form" type="submit" disabled={form.formState.isSubmitting}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
