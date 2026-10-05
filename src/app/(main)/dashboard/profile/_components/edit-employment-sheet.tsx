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
  jobTitle: z.string().min(1, "Job title is required"),
  jobLevel: z.string().min(1, "Job level is required"),
  department: z.string().min(1, "Department is required"),
  team: z.string().min(1, "Team is required"),
  managerName: z.string().min(1, "Manager name is required"),
  managerRole: z.string().min(1, "Manager role is required"),
  contractorId: z.string().min(1, "Contractor ID is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  contractingEntity: z.string().min(1, "Contracting entity is required"),
  startDate: z.string().min(1, "Start date is required"),
  lastWorkingDay: z.string(),
  noticePeriod: z.string().min(1, "Notice period is required"),
  workplace: z.string().min(1, "Workplace is required"),
  timeZone: z.string().min(1, "Time zone is required"),
  weeklyHours: z.string().min(1, "Weekly hours is required"),
  schedule: z.string().min(1, "Schedule is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditEmploymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRecord;
  onSave: (updates: Partial<ProfileRecord>) => Promise<void>;
}

export function EditEmploymentSheet({ open, onOpenChange, profile, onSave }: EditEmploymentSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobTitle: profile.jobTitle,
      jobLevel: profile.jobLevel,
      department: profile.department,
      team: profile.team,
      managerName: profile.manager.name,
      managerRole: profile.manager.role,
      contractorId: profile.contractorId,
      employmentType: profile.employmentType,
      contractingEntity: profile.contractingEntity,
      startDate: profile.startDate,
      lastWorkingDay: profile.lastWorkingDay,
      noticePeriod: profile.noticePeriod,
      workplace: profile.workplace,
      timeZone: profile.timeZone,
      weeklyHours: profile.weeklyHours,
      schedule: profile.schedule,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        jobTitle: profile.jobTitle,
        jobLevel: profile.jobLevel,
        department: profile.department,
        team: profile.team,
        managerName: profile.manager.name,
        managerRole: profile.manager.role,
        contractorId: profile.contractorId,
        employmentType: profile.employmentType,
        contractingEntity: profile.contractingEntity,
        startDate: profile.startDate,
        lastWorkingDay: profile.lastWorkingDay,
        noticePeriod: profile.noticePeriod,
        workplace: profile.workplace,
        timeZone: profile.timeZone,
        weeklyHours: profile.weeklyHours,
        schedule: profile.schedule,
      });
    }
  }, [open, profile, form]);

  async function onSubmit(data: FormValues) {
    await onSave({
      jobTitle: data.jobTitle,
      jobLevel: data.jobLevel,
      department: data.department,
      team: data.team,
      manager: {
        name: data.managerName,
        role: data.managerRole,
        initials: data.managerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      },
      contractorId: data.contractorId,
      employmentType: data.employmentType,
      contractingEntity: data.contractingEntity,
      startDate: data.startDate,
      lastWorkingDay: data.lastWorkingDay,
      noticePeriod: data.noticePeriod,
      workplace: data.workplace,
      timeZone: data.timeZone,
      weeklyHours: data.weeklyHours,
      schedule: data.schedule,
    });
    toast.success("Employment details updated");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Edit employment details</SheetTitle>
          <SheetDescription>Update role, contract, and work arrangement information.</SheetDescription>
        </SheetHeader>

        <form
          id="edit-employment-form"
          className="flex-1 overflow-y-auto"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="px-4 py-4">
            <p className="mb-3 font-medium text-sm">Role and organization</p>
            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="jobTitle"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-title">Job title</FieldLabel>
                    <Input {...field} id="emp-title" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="jobLevel"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-level">Job level</FieldLabel>
                    <Input
                      {...field}
                      id="emp-level"
                      placeholder="e.g. Senior, Lead"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="department"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-dept">Department</FieldLabel>
                    <Input {...field} id="emp-dept" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="team"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-team">Team</FieldLabel>
                    <Input {...field} id="emp-team" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="managerName"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-mgr-name">Manager name</FieldLabel>
                    <Input {...field} id="emp-mgr-name" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="managerRole"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-mgr-role">Manager role</FieldLabel>
                    <Input {...field} id="emp-mgr-role" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="border-t px-4 py-4">
            <p className="mb-3 font-medium text-sm">Contract details</p>
            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="contractorId"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-cid">Contractor ID</FieldLabel>
                    <Input {...field} id="emp-cid" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="employmentType"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-type">Employment type</FieldLabel>
                    <Input
                      {...field}
                      id="emp-type"
                      placeholder="Contractor, Full-time…"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="contractingEntity"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-entity">Contracting entity</FieldLabel>
                    <Input {...field} id="emp-entity" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-start">Start date</FieldLabel>
                    <Input
                      {...field}
                      id="emp-start"
                      placeholder="e.g. March 18, 2022"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="lastWorkingDay"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-end">Last working day</FieldLabel>
                    <Input
                      {...field}
                      id="emp-end"
                      placeholder="e.g. October 3, 2026"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="noticePeriod"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-notice">Notice period</FieldLabel>
                    <Input {...field} id="emp-notice" placeholder="e.g. 30 days" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="border-t px-4 py-4">
            <p className="mb-3 font-medium text-sm">Work arrangement</p>
            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="workplace"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-wp">Workplace</FieldLabel>
                    <Input
                      {...field}
                      id="emp-wp"
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
                    <FieldLabel htmlFor="emp-tz">Time zone</FieldLabel>
                    <Input {...field} id="emp-tz" placeholder="e.g. UTC+5:30" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="weeklyHours"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-hours">Weekly hours</FieldLabel>
                    <Input {...field} id="emp-hours" placeholder="e.g. 40 hours" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="schedule"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="emp-schedule">Schedule</FieldLabel>
                    <Input
                      {...field}
                      id="emp-schedule"
                      placeholder="e.g. Mon–Fri · 9:00 AM–5:30 PM"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
        </form>

        <SheetFooter className="border-t px-4 py-4">
          <SheetClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </SheetClose>
          <Button form="edit-employment-form" type="submit" disabled={form.formState.isSubmitting}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
