"use client";

import { useState } from "react";

import {
  BadgeCheck,
  Download,
  Ellipsis,
  Eye,
  FileText,
  LockKeyhole,
  Mail,
  Pencil,
  Trash2,
  UserRoundX,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addProfileDocument, deleteProfileDocument, updateMyProfile } from "@/server/profile-actions";

import { AddDocumentDialog } from "./add-document-dialog";
import { DeactivateDialog } from "./deactivate-dialog";
import { EditAddressSheet } from "./edit-address-sheet";
import { EditEmploymentSheet } from "./edit-employment-sheet";
import { EditHeaderSheet } from "./edit-header-sheet";
import { EditOverviewSheet } from "./edit-overview-sheet";
import { EditPersonalSheet } from "./edit-personal-sheet";
import type { ProfileDocument, ProfileRecord } from "./profile-data";

interface ProfilePageClientProps {
  initialProfile: ProfileRecord;
  userId: string;
}

export function ProfilePageClient({ initialProfile }: ProfilePageClientProps) {
  const [profile, setProfile] = useState<ProfileRecord>(initialProfile);
  const [editHeader, setEditHeader] = useState(false);
  const [editOverview, setEditOverview] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);
  const [addDocument, setAddDocument] = useState(false);
  const [deactivate, setDeactivate] = useState(false);

  async function updateProfile(updates: Partial<ProfileRecord>) {
    await updateMyProfile(updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  }

  async function handleAddDocument(docInput: Omit<ProfileDocument, "id" | "updatedAt">) {
    const saved = await addProfileDocument({
      name: docInput.name,
      category: docInput.category,
      status: docInput.status,
      isRestricted: docInput.isRestricted,
    });
    setProfile((prev) => ({ ...prev, documents: [...prev.documents, saved] }));
  }

  async function handleDeleteDocument(id: string) {
    await deleteProfileDocument(id);
    setProfile((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== id) }));
    toast.success("Document removed");
  }

  function handleDeactivate() {
    void updateProfile({ engagementStatus: "Active" });
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-5 px-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-18 shrink-0 place-items-center sm:size-23">
            <span className="sr-only">Profile 92% complete</span>
            <svg aria-hidden="true" className="col-start-1 row-start-1 size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="fill-none stroke-green-500 dark:stroke-green-600"
                cx="50"
                cy="50"
                pathLength="100"
                r="46"
                strokeDasharray="92 100"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
            <Avatar className="col-start-1 row-start-1 size-16 after:border-0 sm:size-20">
              <AvatarImage alt={profile.name} src={profile.avatar} />
              <AvatarFallback>{profile.initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <h1 className="truncate font-heading font-semibold text-xl leading-6 tracking-tight sm:text-2xl sm:leading-7">
                {profile.name}
              </h1>
              <p className="truncate text-muted-foreground text-sm leading-5">
                {profile.workEmail} · {profile.jobTitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                className="rounded-sm border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                variant="secondary"
              >
                92% Complete
              </Badge>
              <Badge className="rounded-sm bg-green-600 text-white" variant="default">
                <BadgeCheck data-icon="inline-start" />
                Verified
              </Badge>
              <Badge className="rounded-sm" variant="outline">
                {profile.employmentType}
              </Badge>
              <Badge className="rounded-sm" variant="outline">
                {profile.workplace}
              </Badge>
              <Badge className="rounded-sm" variant="outline">
                {profile.timeZone}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" asChild variant="outline">
            <a href={`mailto:${profile.workEmail}`}>
              <Mail data-icon="inline-start" />
              Email
            </a>
          </Button>
          <Button size="sm" onClick={() => setEditHeader(true)}>
            <Pencil data-icon="inline-start" />
            Edit profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More profile actions" size="icon-sm" variant="outline">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => toast.info("Viewing as employee")}>
                  <Eye />
                  View as employee
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeactivate(true)}>
                  <UserRoundX />
                  Deactivate profile
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs className="min-h-0 flex-1 gap-0" defaultValue="overview">
        <div className="scrollbar-none touch-pan-x overflow-x-auto overscroll-x-contain border-y">
          <TabsList
            className="w-max min-w-full justify-start gap-4 px-4 *:data-[slot=tabs-trigger]:flex-none"
            variant="line"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="time-off">Time off</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </div>

        <div className="px-4 md:px-6">
          {/* ── Overview ── */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_18rem]">
              <div className="py-4 lg:pr-6">
                {/* About */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-heading font-medium text-base">About</h2>
                    <Button size="sm" variant="ghost" onClick={() => setEditOverview(true)}>
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm">{profile.bio}</p>
                </div>

                <Separator className="my-4" />

                {/* Work details */}
                <div className="flex flex-col gap-2">
                  <h2 className="font-heading font-medium text-base">Work details</h2>
                  <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Contractor ID</span>
                        <span className="text-sm">{profile.contractorId}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Engagement status</span>
                        <span className="text-sm">{profile.engagementStatus}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Job level</span>
                        <span className="text-sm">{profile.jobLevel}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Department</span>
                        <span className="text-sm">{profile.department}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Team</span>
                        <span className="text-sm">{profile.team}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Current project</span>
                        <span className="text-sm">{profile.currentProject}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Start date</span>
                        <span className="text-sm">{profile.startDate}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Engagement length</span>
                        <span className="text-sm">{profile.engagementLength}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Reporting line */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <h2 className="font-heading font-medium text-base leading-none">Reporting line</h2>
                      <p className="text-muted-foreground text-sm">Direct manager</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Org chart coming soon")}>
                      <Users data-icon="inline-start" />
                      Org chart
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <Avatar size="lg">
                      <AvatarFallback>{profile.manager.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{profile.manager.name}</p>
                      <p className="text-muted-foreground text-xs">{profile.manager.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="hidden lg:block" orientation="vertical" />

              {/* Status sidebar */}
              <div className="py-4 lg:pl-6">
                <aside>
                  <div className="flex flex-col gap-4">
                    <h2 className="font-heading font-medium text-sm">Record status</h2>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium text-sm">Active contractor</p>
                        <p className="text-muted-foreground text-xs">Contract and access active</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Updated {profile.updatedAt} by {profile.updatedBy}
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-3">
                    <h2 className="font-heading font-medium text-sm">Upcoming events</h2>
                    <div className="flex flex-col">
                      <div className="py-2.5">
                        <p className="font-medium text-sm">Time off</p>
                        <p className="text-muted-foreground text-xs">{profile.nextLeave}</p>
                      </div>
                      <Separator />
                      <div className="py-2.5">
                        <p className="font-medium text-sm">Last working day</p>
                        <p className="text-muted-foreground text-xs">{profile.lastWorkingDay}</p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </TabsContent>

          {/* ── Personal ── */}
          <TabsContent className="py-4" value="personal">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-medium text-base">Personal information</h2>
                  <Badge className="rounded-sm" variant="outline">
                    <LockKeyhole data-icon="inline-start" />
                    Private
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditPersonal(true)}>
                  <Pencil data-icon="inline-start" />
                  Edit
                </Button>
              </div>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Preferred name</dt>
                    <dd className="text-sm">{profile.preferredName}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Date of birth</dt>
                    <dd className="text-sm">{profile.dateOfBirth}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Legal name</dt>
                    <dd className="text-sm">{profile.legalName}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Personal email</dt>
                    <dd className="text-sm">{profile.personalEmail}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Pronouns</dt>
                    <dd className="text-sm">{profile.pronouns}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Work phone</dt>
                    <dd className="text-sm">{profile.workPhone}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-medium text-base">Address and emergency contact</h2>
                  <Badge className="rounded-sm" variant="outline">
                    <LockKeyhole data-icon="inline-start" />
                    Private
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditAddress(true)}>
                  <Pencil data-icon="inline-start" />
                  Edit
                </Button>
              </div>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Home address</dt>
                    <dd className="text-sm">{profile.address}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Emergency contact</dt>
                    <dd className="text-sm">{profile.emergencyContact}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Emergency phone</dt>
                    <dd className="text-sm">{profile.emergencyPhone}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </TabsContent>

          {/* ── Employment ── */}
          <TabsContent className="py-4" value="employment">
            <div className="flex items-center justify-between gap-4 pb-2">
              <span />
              <Button size="sm" variant="ghost" onClick={() => setEditEmployment(true)}>
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-heading font-medium text-base">Role and organization</h2>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Job title</dt>
                    <dd className="text-sm">{profile.jobTitle}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Team</dt>
                    <dd className="text-sm">{profile.team}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Job level</dt>
                    <dd className="text-sm">{profile.jobLevel}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Manager</dt>
                    <dd className="text-sm">{profile.manager.name}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Department</dt>
                    <dd className="text-sm">{profile.department}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Current project</dt>
                    <dd className="text-sm">{profile.currentProject}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-2">
              <h2 className="font-heading font-medium text-base">Contract details</h2>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Contractor ID</dt>
                    <dd className="text-sm">{profile.contractorId}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Engagement status</dt>
                    <dd className="text-sm">{profile.engagementStatus}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Employment type</dt>
                    <dd className="text-sm">{profile.employmentType}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Contracting entity</dt>
                    <dd className="text-sm">{profile.contractingEntity}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Start date</dt>
                    <dd className="text-sm">{profile.startDate}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Last working day</dt>
                    <dd className="text-sm">{profile.lastWorkingDay}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Notice period</dt>
                    <dd className="text-sm">{profile.noticePeriod}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-2">
              <h2 className="font-heading font-medium text-base">Work arrangement</h2>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Workplace</dt>
                    <dd className="text-sm">{profile.workplace}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Time zone</dt>
                    <dd className="text-sm">{profile.timeZone}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Weekly hours</dt>
                    <dd className="text-sm">{profile.weeklyHours}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Schedule</dt>
                    <dd className="text-sm">{profile.schedule}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </TabsContent>

          {/* ── Compensation ── */}
          <TabsContent className="py-4" value="compensation">
            <div className="flex items-start gap-3">
              <LockKeyhole aria-hidden="true" className="size-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Restricted information</p>
                <p className="mt-0.5 text-muted-foreground text-sm">
                  Visible to people administrators and authorized finance roles.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── Time off ── */}
          <TabsContent className="py-4" value="time-off">
            <div className="flex flex-col gap-2">
              <h2 className="font-heading font-medium text-base">Leave balance</h2>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Policy</dt>
                    <dd className="text-sm">{profile.leavePolicy}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Carried over</dt>
                    <dd className="text-sm">{profile.carriedOverLeave}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Annual allowance</dt>
                    <dd className="text-sm">{profile.annualLeaveAllowance}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Used this year</dt>
                    <dd className="text-sm">{profile.usedLeave}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Remaining</dt>
                    <dd className="text-sm">{profile.remainingLeave}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Scheduled</dt>
                    <dd className="text-sm">{profile.scheduledLeave}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-2">
              <h2 className="font-heading font-medium text-base">Upcoming and approvals</h2>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Next leave</dt>
                    <dd className="text-sm">{profile.nextLeave}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Pending requests</dt>
                    <dd className="text-sm">{profile.pendingLeaveRequests}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Leave year</dt>
                    <dd className="text-sm">{profile.leaveYear}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Approver</dt>
                    <dd className="text-sm">{profile.manager.name}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </TabsContent>

          {/* ── Documents ── */}
          <TabsContent className="py-4" value="documents">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading font-medium text-base">Documents</h2>
                <Button size="sm" onClick={() => setAddDocument(true)}>
                  <FileText data-icon="inline-start" />
                  Add document
                </Button>
              </div>

              <Table className="border-y">
                <TableCaption className="sr-only">Documents attached to this contractor profile</TableCaption>
                <TableHeader className="[&_th]:h-8">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-2/5">
                      <span className="sr-only">Document</span>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.documents.length === 0 && (
                    <TableRow>
                      <TableCell className="py-8 text-center text-muted-foreground text-sm" colSpan={6}>
                        No documents attached yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {profile.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.category}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.updatedAt}</TableCell>
                      <TableCell>
                        <Badge className="rounded-sm" variant="outline">
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.isRestricted ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-muted-foreground text-xs"
                            title="Restricted"
                          >
                            <LockKeyhole aria-hidden="true" className="size-3.5" />
                            Restricted
                          </span>
                        ) : (
                          <Button aria-label={`Download ${doc.name}`} size="icon-sm" variant="ghost">
                            <Download />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          aria-label={`Delete ${doc.name}`}
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit sheets & dialogs */}
      <EditHeaderSheet open={editHeader} onOpenChange={setEditHeader} profile={profile} onSave={updateProfile} />
      <EditOverviewSheet open={editOverview} onOpenChange={setEditOverview} profile={profile} onSave={updateProfile} />
      <EditPersonalSheet open={editPersonal} onOpenChange={setEditPersonal} profile={profile} onSave={updateProfile} />
      <EditAddressSheet open={editAddress} onOpenChange={setEditAddress} profile={profile} onSave={updateProfile} />
      <EditEmploymentSheet
        open={editEmployment}
        onOpenChange={setEditEmployment}
        profile={profile}
        onSave={updateProfile}
      />
      <AddDocumentDialog open={addDocument} onOpenChange={setAddDocument} onAdd={handleAddDocument} />
      <DeactivateDialog
        open={deactivate}
        onOpenChange={setDeactivate}
        name={profile.name}
        onConfirm={handleDeactivate}
      />
    </>
  );
}
