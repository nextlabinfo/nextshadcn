"use client";

import * as React from "react";
import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AppRole, createRole, deleteRole, updateRole } from "@/server/feature-actions";

interface RolesClientProps {
  roles: AppRole[];
}

type RoleFormState = {
  name: string;
  description: string;
  color: string;
};

const DEFAULT_FORM: RoleFormState = { name: "", description: "", color: "#6366f1" };

const COLOR_OPTIONS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Sky", value: "#0ea5e9" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Slate", value: "#64748b" },
];

function RoleFormFields({ form, onChange }: { form: RoleFormState; onChange: (next: Partial<RoleFormState>) => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role-name">Name</Label>
        <Input
          id="role-name"
          placeholder="e.g. Manager"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role-description">Description</Label>
        <Input
          id="role-description"
          placeholder="Brief description of this role"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              className="size-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: opt.value,
                borderColor: form.color === opt.value ? opt.value : "transparent",
                outline: form.color === opt.value ? `2px solid ${opt.value}` : "none",
                outlineOffset: "2px",
              }}
              onClick={() => onChange({ color: opt.value })}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export function RolesClient({ roles }: RolesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<RoleFormState>(DEFAULT_FORM);

  const [editTarget, setEditTarget] = React.useState<AppRole | null>(null);
  const [editForm, setEditForm] = React.useState<RoleFormState>(DEFAULT_FORM);

  const [deleteTarget, setDeleteTarget] = React.useState<AppRole | null>(null);

  function openEdit(role: AppRole) {
    setEditTarget(role);
    setEditForm({ name: role.name, description: role.description ?? "", color: role.color });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createRole({
          ...createForm,
          slug: createForm.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        });
        toast.success(`Role "${createForm.name}" created.`);
        setCreateForm(DEFAULT_FORM);
        setCreateOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to create role. Please try again.");
      }
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    startTransition(async () => {
      try {
        await updateRole(editTarget.id, editForm);
        toast.success(`Role "${editForm.name}" updated.`);
        setEditTarget(null);
        router.refresh();
      } catch {
        toast.error("Failed to update role. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteRole(deleteTarget.id);
        toast.success(`Role "${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
        router.refresh();
      } catch {
        toast.error("Failed to delete role. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Roles &amp; Permissions</h1>
          <p className="text-muted-foreground text-sm">Manage access roles and permissions across your organization.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>Define a new role for your organization.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <RoleFormFields form={createForm} onChange={(next) => setCreateForm((f) => ({ ...f, ...next }))} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !createForm.name}>
                  {isPending ? "Creating..." : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {roles.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-muted-foreground text-sm">
          No roles found. Create your first role.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="relative flex flex-col gap-2">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: role.color }}
                      aria-hidden
                    />
                    <CardTitle className="text-base leading-tight">{role.name}</CardTitle>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Actions for ${role.name}`}
                          size="icon-sm"
                          variant="ghost"
                          className="size-7 text-muted-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(role)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        {!role.isSystem && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(role)}>
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {role.description && <CardDescription className="mt-1 text-xs">{role.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span>
                    <strong className="text-foreground">{role.userCount}</strong> user
                    {role.userCount !== 1 ? "s" : ""}
                  </span>
                  <span>
                    <strong className="text-foreground">{role.permissionCount}</strong> permission
                    {role.permissionCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update the details for this role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <RoleFormFields form={editForm} onChange={(next) => setEditForm((f) => ({ ...f, ...next }))} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !editForm.name}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Users assigned this role will lose
              access. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
