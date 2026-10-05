"use server";

import { headers } from "next/headers";

import { Pool } from "pg";

import type { ProfileDocument, ProfileRecord } from "@/app/(main)/dashboard/profile/_components/profile-data";
import { auth } from "@/lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function computeInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function getMyProfile(): Promise<{ profile: ProfileRecord; userId: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const userId = session.user.id;
  const userName = session.user.name ?? session.user.email;
  const userEmail = session.user.email;
  const userImage = (session.user as { image?: string }).image ?? "";

  const [profileRes, docsRes] = await Promise.all([
    pool.query("SELECT * FROM user_profile WHERE user_id = $1", [userId]),
    pool.query("SELECT * FROM profile_document WHERE user_id = $1 ORDER BY created_at DESC", [userId]),
  ]);

  const row = profileRes.rows[0] ?? {};

  const managerName = row.manager_name ?? "";
  const managerRole = row.manager_role ?? "";

  const documents: ProfileDocument[] = docsRes.rows.map((doc) => ({
    id: doc.id as string,
    name: doc.name as string,
    category: doc.category as string,
    updatedAt: formatDate(doc.updated_at as Date | string),
    status: (doc.status as "Signed" | "Current" | null) ?? "Current",
    isRestricted: Boolean(doc.is_restricted),
  }));

  const profile: ProfileRecord = {
    name: userName,
    preferredName: row.preferred_name ?? userName,
    legalName: row.legal_name ?? userName,
    pronouns: row.pronouns ?? "",
    initials: computeInitials(userName),
    avatar: row.avatar ?? userImage,
    engagementStatus: "Active",
    jobTitle: row.job_title ?? "",
    jobLevel: row.job_level ?? "",
    department: row.department ?? "",
    team: row.team ?? "",
    currentProject: row.current_project ?? "",
    workEmail: row.work_email ?? userEmail,
    personalEmail: row.personal_email ?? "",
    workPhone: row.work_phone ?? "",
    workplace: row.workplace ?? "",
    timeZone: row.time_zone ?? "",
    contractorId: row.contractor_id ?? "",
    startDate: row.start_date ?? "",
    engagementLength: row.engagement_length ?? "",
    employmentType: row.employment_type ?? "",
    weeklyHours: row.weekly_hours ?? "",
    schedule: row.schedule ?? "",
    contractingEntity: row.contracting_entity ?? "",
    noticePeriod: row.notice_period ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    address: row.address ?? "",
    emergencyContact: row.emergency_contact ?? "",
    emergencyPhone: row.emergency_phone ?? "",
    manager: {
      name: managerName,
      role: managerRole,
      initials: managerName ? computeInitials(managerName) : "",
    },
    bio: row.bio ?? "",
    leavePolicy: row.leave_policy ?? "",
    annualLeaveAllowance: row.annual_leave_allowance ?? "",
    remainingLeave: row.remaining_leave ?? "",
    carriedOverLeave: row.carried_over_leave ?? "",
    usedLeave: row.used_leave ?? "",
    scheduledLeave: row.scheduled_leave ?? "",
    pendingLeaveRequests: row.pending_leave_requests ?? "",
    leaveYear: row.leave_year ?? "",
    nextLeave: row.next_leave ?? "",
    lastWorkingDay: row.last_working_day ?? "",
    updatedBy: row.updated_by ?? "",
    updatedAt: row.updated_at ? formatDate(row.updated_at as Date) : "",
    documents,
  };

  return { profile, userId };
}

const PROFILE_KEY_MAP: Record<string, string> = {
  preferredName: "preferred_name",
  legalName: "legal_name",
  pronouns: "pronouns",
  avatar: "avatar",
  bio: "bio",
  jobTitle: "job_title",
  jobLevel: "job_level",
  department: "department",
  team: "team",
  currentProject: "current_project",
  workEmail: "work_email",
  personalEmail: "personal_email",
  workPhone: "work_phone",
  workplace: "workplace",
  timeZone: "time_zone",
  contractorId: "contractor_id",
  startDate: "start_date",
  engagementLength: "engagement_length",
  employmentType: "employment_type",
  weeklyHours: "weekly_hours",
  schedule: "schedule",
  contractingEntity: "contracting_entity",
  noticePeriod: "notice_period",
  dateOfBirth: "date_of_birth",
  address: "address",
  emergencyContact: "emergency_contact",
  emergencyPhone: "emergency_phone",
  leavePolicy: "leave_policy",
  annualLeaveAllowance: "annual_leave_allowance",
  remainingLeave: "remaining_leave",
  carriedOverLeave: "carried_over_leave",
  usedLeave: "used_leave",
  scheduledLeave: "scheduled_leave",
  pendingLeaveRequests: "pending_leave_requests",
  leaveYear: "leave_year",
  nextLeave: "next_leave",
  lastWorkingDay: "last_working_day",
};

export async function updateMyProfile(updates: Partial<ProfileRecord>): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  const userId = session.user.id;

  const cols: string[] = ["user_id", "updated_at"];
  const vals: unknown[] = [userId, new Date()];
  let _idx = 3;

  for (const [key, value] of Object.entries(updates)) {
    if (
      key === "name" ||
      key === "initials" ||
      key === "engagementStatus" ||
      key === "documents" ||
      key === "manager"
    ) {
      continue;
    }
    const col = PROFILE_KEY_MAP[key];
    if (col) {
      cols.push(col);
      vals.push(value as string);
      _idx++;
    }
  }

  if (updates.manager) {
    cols.push("manager_name");
    vals.push(updates.manager.name);
    cols.push("manager_role");
    vals.push(updates.manager.role);
  }

  const insertCols = cols.join(", ");
  const insertPlaceholders = vals.map((_, i) => `$${i + 1}`).join(", ");
  const updateSets = cols
    .slice(2)
    .map((col, i) => `${col} = $${i + 3}`)
    .join(", ");

  await pool.query(
    `INSERT INTO user_profile (${insertCols}) VALUES (${insertPlaceholders})
     ON CONFLICT (user_id) DO UPDATE SET ${updateSets}`,
    vals,
  );

  if (updates.name) {
    await pool.query(`UPDATE "user" SET name = $1 WHERE id = $2`, [updates.name, userId]);
  }
}

export async function addProfileDocument(doc: {
  name: string;
  category: string;
  status: "Signed" | "Current";
  isRestricted: boolean;
}): Promise<ProfileDocument> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const res = await pool.query(
    `INSERT INTO profile_document (user_id, name, category, status, is_restricted)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, doc.name, doc.category, doc.status, doc.isRestricted],
  );

  const row = res.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    updatedAt: formatDate(row.updated_at as Date),
    status: row.status as "Signed" | "Current",
    isRestricted: Boolean(row.is_restricted),
  };
}

export async function deleteProfileDocument(id: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  const userId = session.user.id;
  await pool.query("DELETE FROM profile_document WHERE id = $1 AND user_id = $2", [id, userId]);
}
