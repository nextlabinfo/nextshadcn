"use client";

import * as React from "react";
import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { MoreHorizontal, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import { type AppUser, deleteUser, updateUserStatus } from "@/server/feature-actions";

interface UsersClientProps {
  users: AppUser[];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function UsersClient({ users }: UsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("");

  const [deleteTarget, setDeleteTarget] = React.useState<AppUser | null>(null);
  const [assignTarget, setAssignTarget] = React.useState<AppUser | null>(null);
  const [assignRole, setAssignRole] = React.useState("");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    toast.success(`Invitation sent to ${inviteEmail}.`);
    setInviteEmail("");
    setInviteRole("");
    setInviteOpen(false);
  }

  function handleDeleteUser() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteUser(deleteTarget.id);
        toast.success(`${deleteTarget.name} has been removed.`);
        setDeleteTarget(null);
        router.refresh();
      } catch {
        toast.error("Failed to delete user. Please try again.");
      }
    });
  }

  function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTarget) return;
    startTransition(async () => {
      try {
        await updateUserStatus(assignTarget.id, assignRole);
        toast.success(`Role updated for ${assignTarget.name}.`);
        setAssignTarget(null);
        setAssignRole("");
        router.refresh();
      } catch {
        toast.error("Failed to update role. Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl leading-none">Users</CardTitle>
            <CardDescription className="mt-1.5 max-w-sm leading-snug">
              Manage your organization members and their access.
            </CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>Send an invitation to a new team member.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Send Invite</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
          <TableHeader className="[&_tr]:border-t">
            <TableRow>
              <TableHead className="py-4 font-normal">User</TableHead>
              <TableHead className="py-4 font-normal">Roles</TableHead>
              <TableHead className="py-4 font-normal">Joined</TableHead>
              <TableHead className="py-4 text-right font-normal">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-border/60 hover:bg-white/2.5">
                  <TableCell className="py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground text-sm">{user.name}</div>
                        <div className="truncate text-muted-foreground text-sm">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-middle">
                    <div className="flex flex-wrap gap-1">
                      {user.roleNames.length === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        user.roleNames.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-middle">
                    <span className="text-foreground text-sm">{formatDate(user.createdAt)}</span>
                  </TableCell>
                  <TableCell className="py-4 text-right align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Open actions for ${user.name}`}
                          className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                          size="icon-sm"
                          variant="ghost"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setAssignTarget(user);
                            setAssignRole(user.roleNames[0] ?? "");
                          }}
                        >
                          <UserCog className="mr-2 size-4" />
                          Assign Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(user)}>
                          <Trash2 className="mr-2 size-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign role dialog */}
      <Dialog
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignTarget(null);
            setAssignRole("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>Update the role for {assignTarget?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignRole} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assign-role">Role</Label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger id="assign-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignTarget(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !assignRole}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
