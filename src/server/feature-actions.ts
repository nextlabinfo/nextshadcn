"use server";

import { headers } from "next/headers";

import { Pool } from "pg";

import { auth } from "@/lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ============================================================
// Types
// ============================================================

export interface AppUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  roleNames: string[];
}

export interface AppRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
}

export interface AppTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  label: string | null;
  kanbanColumn: string | null;
  assigneeId: string | null;
  reporterId: string;
  dueDate: string | null;
  progress: number;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  label?: string;
  kanbanColumn?: string;
  assigneeId?: string;
  dueDate?: string;
  progress?: number;
}

export interface KanbanBoardData {
  columns: Array<{ id: string; title: string }>;
  tasks: Record<string, AppTask[]>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  color: string;
  userId: string;
}

export interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  participants: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface MailMessage {
  id: string;
  fromUserId: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  to: string[];
  labels: string[];
  createdAt: string;
}

export interface MailLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

// ============================================================
// Helpers
// ============================================================

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

function toIso(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  try {
    return new Date(v as string).toISOString();
  } catch {
    return "";
  }
}

function toIsoOrNull(v: unknown): string | null {
  if (!v) return null;
  try {
    return new Date(v as string).toISOString();
  } catch {
    return null;
  }
}

function toDateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return String(v).split("T")[0];
}

// ============================================================
// Users
// ============================================================

export async function getUsers(): Promise<AppUser[]> {
  await requireSession();

  const res = await pool.query(
    `SELECT u.id, u.name, u.email, u.image, u."createdAt",
            string_agg(r.name, ',') AS role_names
     FROM "user" u
     LEFT JOIN app_user_role ur ON ur.user_id = u.id
     LEFT JOIN app_role r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u."createdAt" DESC`,
  );

  return res.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    image: (row.image as string | null) ?? null,
    createdAt: toIso(row.createdAt),
    roleNames: row.role_names ? (row.role_names as string).split(",") : [],
  }));
}

export async function getActiveUsers(): Promise<Pick<AppUser, "id" | "name" | "email" | "image">[]> {
  const user = await requireSession();
  const res = await pool.query(`SELECT id, name, email, image FROM "user" WHERE id != $1 ORDER BY name ASC`, [user.id]);
  return res.rows.map((row) => ({
    id: row.id as string,
    name: (row.name as string | null) ?? (row.email as string),
    email: row.email as string,
    image: (row.image as string | null) ?? null,
  }));
}

export async function updateUserStatus(userId: string, _status: string): Promise<void> {
  await requireSession();
  await pool.query(`UPDATE "user" SET updated_at = now() WHERE id = $1`, [userId]);
}

export async function deleteUser(userId: string): Promise<void> {
  const user = await requireSession();
  if (user.id === userId) throw new Error("Cannot delete your own account");
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
}

// ============================================================
// Roles
// ============================================================

export async function getRoles(): Promise<AppRole[]> {
  await requireSession();

  const res = await pool.query(
    `SELECT r.id, r.name, r.slug, r.description, r.color, r.is_system, r.created_at,
            COUNT(DISTINCT ur.user_id)::int AS user_count,
            COUNT(DISTINCT rp.permission_id)::int AS permission_count
     FROM app_role r
     LEFT JOIN app_user_role ur ON ur.role_id = r.id
     LEFT JOIN app_role_permission rp ON rp.role_id = r.id
     GROUP BY r.id
     ORDER BY r.created_at ASC`,
  );

  return res.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    color: (row.color as string | null) ?? "blue",
    isSystem: Boolean(row.is_system),
    userCount: Number(row.user_count),
    permissionCount: Number(row.permission_count),
    createdAt: toIso(row.created_at),
  }));
}

export async function createRole(data: {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}): Promise<AppRole> {
  await requireSession();

  const res = await pool.query(
    `INSERT INTO app_role (name, slug, description, color)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.slug, data.description ?? null, data.color ?? "blue"],
  );

  const row = res.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    color: (row.color as string | null) ?? "blue",
    isSystem: Boolean(row.is_system),
    userCount: 0,
    permissionCount: 0,
    createdAt: toIso(row.created_at),
  };
}

export async function updateRole(
  id: string,
  data: Partial<Pick<AppRole, "name" | "slug" | "description" | "color">>,
): Promise<AppRole> {
  await requireSession();

  const clauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) {
    clauses.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    clauses.push(`slug = $${idx++}`);
    values.push(data.slug);
  }
  if (data.description !== undefined) {
    clauses.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.color !== undefined) {
    clauses.push(`color = $${idx++}`);
    values.push(data.color);
  }
  clauses.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(`UPDATE app_role SET ${clauses.join(", ")} WHERE id = $${idx} RETURNING *`, values);

  const row = res.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    color: (row.color as string | null) ?? "blue",
    isSystem: Boolean(row.is_system),
    userCount: 0,
    permissionCount: 0,
    createdAt: toIso(row.created_at),
  };
}

export async function deleteRole(id: string): Promise<void> {
  await requireSession();
  await pool.query(`DELETE FROM app_role WHERE id = $1 AND is_system = false`, [id]);
}

export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  const user = await requireSession();
  await pool.query(
    `INSERT INTO app_user_role (user_id, role_id, assigned_by)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [userId, roleId, user.id],
  );
}

export async function removeRoleFromUser(userId: string, roleId: string): Promise<void> {
  await requireSession();
  await pool.query(`DELETE FROM app_user_role WHERE user_id = $1 AND role_id = $2`, [userId, roleId]);
}

// ============================================================
// Tasks
// ============================================================

function rowToTask(row: Record<string, unknown>): AppTask {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as string,
    priority: row.priority as string,
    label: (row.label as string | null) ?? null,
    kanbanColumn: (row.kanban_column as string | null) ?? null,
    assigneeId: (row.assignee_id as string | null) ?? null,
    reporterId: row.reporter_id as string,
    dueDate: toDateStr(row.due_date),
    progress: Number(row.progress),
    createdAt: toIso(row.created_at),
  };
}

export async function getTasks(): Promise<AppTask[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM app_task ORDER BY created_at DESC`);
  return res.rows.map(rowToTask);
}

export async function createTask(data: CreateTaskInput): Promise<AppTask> {
  const user = await requireSession();

  const res = await pool.query(
    `INSERT INTO app_task
       (title, description, status, priority, label, kanban_column, assignee_id, reporter_id, due_date, progress)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      data.title,
      data.description ?? null,
      data.status ?? "todo",
      data.priority ?? "medium",
      data.label ?? "feature",
      data.kanbanColumn ?? "ideas",
      data.assigneeId ?? null,
      user.id,
      data.dueDate ?? null,
      data.progress ?? 0,
    ],
  );

  return rowToTask(res.rows[0]);
}

export async function updateTask(id: string, data: Partial<CreateTaskInput>): Promise<AppTask> {
  await requireSession();

  const clauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    clauses.push(`title = $${idx++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    clauses.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    clauses.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    clauses.push(`priority = $${idx++}`);
    values.push(data.priority);
  }
  if (data.label !== undefined) {
    clauses.push(`label = $${idx++}`);
    values.push(data.label);
  }
  if (data.kanbanColumn !== undefined) {
    clauses.push(`kanban_column = $${idx++}`);
    values.push(data.kanbanColumn);
  }
  if (data.assigneeId !== undefined) {
    clauses.push(`assignee_id = $${idx++}`);
    values.push(data.assigneeId);
  }
  if (data.dueDate !== undefined) {
    clauses.push(`due_date = $${idx++}`);
    values.push(data.dueDate);
  }
  if (data.progress !== undefined) {
    clauses.push(`progress = $${idx++}`);
    values.push(data.progress);
  }
  clauses.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(`UPDATE app_task SET ${clauses.join(", ")} WHERE id = $${idx} RETURNING *`, values);

  return rowToTask(res.rows[0]);
}

export async function deleteTask(id: string): Promise<void> {
  await requireSession();
  await pool.query(`DELETE FROM app_task WHERE id = $1`, [id]);
}

// ============================================================
// Kanban
// ============================================================

const KANBAN_COLUMNS = [
  { id: "ideas", title: "Ideas" },
  { id: "planned", title: "Planned" },
  { id: "building", title: "Building" },
  { id: "qa", title: "QA" },
  { id: "shipped", title: "Shipped" },
];

export async function getKanbanBoard(): Promise<KanbanBoardData> {
  await requireSession();

  const res = await pool.query(`SELECT * FROM app_task ORDER BY created_at ASC`);

  const tasks: Record<string, AppTask[]> = {
    ideas: [],
    planned: [],
    building: [],
    qa: [],
    shipped: [],
  };

  for (const row of res.rows) {
    const col = (row.kanban_column as string) || "ideas";
    const task = rowToTask(row);
    if (tasks[col]) {
      tasks[col].push(task);
    } else {
      tasks.ideas.push(task);
    }
  }

  return { columns: KANBAN_COLUMNS, tasks };
}

export async function moveKanbanTask(taskId: string, targetColumn: string): Promise<void> {
  await requireSession();
  await pool.query(`UPDATE app_task SET kanban_column = $1, updated_at = now() WHERE id = $2`, [targetColumn, taskId]);
}

export async function createKanbanTask(data: {
  title: string;
  description?: string;
  priority?: string;
  kanbanColumn?: string;
  assigneeId?: string;
  dueDate?: string;
  label?: string;
}): Promise<AppTask> {
  return createTask({ ...data, status: "todo" });
}

// ============================================================
// Calendar Events
// ============================================================

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  await requireSession();

  const res = await pool.query(`SELECT * FROM app_calendar_event ORDER BY start_time ASC`);

  return res.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    start: toIso(row.start_time),
    end: toIsoOrNull(row.end_time),
    allDay: Boolean(row.all_day),
    color: (row.color as string | null) ?? "blue",
    userId: row.user_id as string,
  }));
}

export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
}): Promise<CalendarEvent> {
  const user = await requireSession();

  const res = await pool.query(
    `INSERT INTO app_calendar_event (title, description, start_time, end_time, all_day, color, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.title,
      data.description ?? null,
      data.start,
      data.end ?? null,
      data.allDay ?? false,
      data.color ?? "blue",
      user.id,
    ],
  );

  const row = res.rows[0];
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    start: toIso(row.start_time),
    end: toIsoOrNull(row.end_time),
    allDay: Boolean(row.all_day),
    color: row.color as string,
    userId: row.user_id as string,
  };
}

export async function updateCalendarEvent(
  id: string,
  data: Partial<{ title: string; description: string; start: string; end: string; allDay: boolean; color: string }>,
): Promise<CalendarEvent> {
  await requireSession();

  const clauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    clauses.push(`title = $${idx++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    clauses.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.start !== undefined) {
    clauses.push(`start_time = $${idx++}`);
    values.push(data.start);
  }
  if (data.end !== undefined) {
    clauses.push(`end_time = $${idx++}`);
    values.push(data.end);
  }
  if (data.allDay !== undefined) {
    clauses.push(`all_day = $${idx++}`);
    values.push(data.allDay);
  }
  if (data.color !== undefined) {
    clauses.push(`color = $${idx++}`);
    values.push(data.color);
  }
  clauses.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `UPDATE app_calendar_event SET ${clauses.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );

  const row = res.rows[0];
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    start: toIso(row.start_time),
    end: toIsoOrNull(row.end_time),
    allDay: Boolean(row.all_day),
    color: row.color as string,
    userId: row.user_id as string,
  };
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await requireSession();
  await pool.query(`DELETE FROM app_calendar_event WHERE id = $1`, [id]);
}

// ============================================================
// Chat
// ============================================================

export async function getChatConversations(): Promise<Conversation[]> {
  const user = await requireSession();

  const res = await pool.query(
    `SELECT c.id, c.name, c.is_group,
            (SELECT m.content FROM app_chat_message m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
            (SELECT m.created_at FROM app_chat_message m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
            array_agg(DISTINCT p.user_id) AS participants
     FROM app_chat_conversation c
     JOIN app_chat_participant p ON p.conversation_id = c.id
     WHERE p.user_id = $1
     GROUP BY c.id
     ORDER BY COALESCE(
       (SELECT m.created_at FROM app_chat_message m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
       c.created_at
     ) DESC`,
    [user.id],
  );

  return res.rows.map((row) => ({
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    isGroup: Boolean(row.is_group),
    lastMessage: (row.last_message as string | null) ?? null,
    lastMessageAt: toIsoOrNull(row.last_message_at),
    participants: row.participants as string[],
  }));
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const user = await requireSession();

  const check = await pool.query(`SELECT 1 FROM app_chat_participant WHERE conversation_id = $1 AND user_id = $2`, [
    conversationId,
    user.id,
  ]);
  if ((check.rowCount ?? 0) === 0) throw new Error("Forbidden");

  const res = await pool.query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
            COALESCE(u.name, m.sender_id) AS sender_name
     FROM app_chat_message m
     LEFT JOIN "user" u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [conversationId],
  );

  return res.rows.map((row) => ({
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    senderName: (row.sender_name as string) || "Unknown",
    content: row.content as string,
    createdAt: toIso(row.created_at),
  }));
}

export async function sendChatMessage(conversationId: string, content: string): Promise<ChatMessage> {
  const user = await requireSession();

  const check = await pool.query(`SELECT 1 FROM app_chat_participant WHERE conversation_id = $1 AND user_id = $2`, [
    conversationId,
    user.id,
  ]);
  if ((check.rowCount ?? 0) === 0) throw new Error("Forbidden");

  const res = await pool.query(
    `INSERT INTO app_chat_message (conversation_id, sender_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, user.id, content],
  );

  await pool.query(`UPDATE app_chat_conversation SET updated_at = now() WHERE id = $1`, [conversationId]);

  const row = res.rows[0];
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    senderName: (user.name as string) || user.email,
    content: row.content as string,
    createdAt: toIso(row.created_at),
  };
}

export async function createConversation(
  name: string,
  isGroup: boolean,
  participantIds: string[],
): Promise<Conversation> {
  const user = await requireSession();

  const res = await pool.query(`INSERT INTO app_chat_conversation (name, is_group) VALUES ($1, $2) RETURNING *`, [
    name || null,
    isGroup,
  ]);

  const conv = res.rows[0];
  const allParticipants = Array.from(new Set([user.id, ...participantIds]));

  await Promise.all(
    allParticipants.map((uid) =>
      pool.query(`INSERT INTO app_chat_participant (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
        conv.id,
        uid,
      ]),
    ),
  );

  return {
    id: conv.id as string,
    name: (conv.name as string | null) ?? null,
    isGroup: Boolean(conv.is_group),
    lastMessage: null,
    lastMessageAt: null,
    participants: allParticipants,
  };
}

// ============================================================
// Mail
// ============================================================

export async function getMailMessages(folder = "inbox"): Promise<MailMessage[]> {
  const user = await requireSession();

  const res = await pool.query(
    `SELECT m.id, m.from_user_id, m.subject, m.body, m.folder,
            m.is_read, m.is_starred, m.is_important, m.created_at,
            COALESCE(u.name, m.from_user_id) AS from_name,
            COALESCE(u.email, m.from_user_id) AS from_email,
            ARRAY(SELECT mr.email FROM app_mail_recipient mr WHERE mr.mail_id = m.id AND mr.type = 'to') AS to_addrs,
            ARRAY(SELECT ml.name FROM app_mail_message_label mml JOIN app_mail_label ml ON ml.id = mml.label_id WHERE mml.mail_id = m.id) AS label_names
     FROM app_mail_message m
     LEFT JOIN "user" u ON u.id = m.from_user_id
     WHERE m.owner_user_id = $1 AND m.folder = $2
     ORDER BY m.created_at DESC`,
    [user.id, folder],
  );

  return res.rows.map((row) => ({
    id: row.id as string,
    fromUserId: row.from_user_id as string,
    fromName: row.from_name as string,
    fromEmail: row.from_email as string,
    subject: row.subject as string,
    body: row.body as string,
    folder: row.folder as string,
    isRead: Boolean(row.is_read),
    isStarred: Boolean(row.is_starred),
    isImportant: Boolean(row.is_important),
    to: row.to_addrs as string[],
    labels: row.label_names as string[],
    createdAt: toIso(row.created_at),
  }));
}

export async function getMailMessage(id: string): Promise<MailMessage | null> {
  const user = await requireSession();

  const res = await pool.query(
    `SELECT m.id, m.from_user_id, m.subject, m.body, m.folder,
            m.is_read, m.is_starred, m.is_important, m.created_at,
            COALESCE(u.name, m.from_user_id) AS from_name,
            COALESCE(u.email, m.from_user_id) AS from_email,
            ARRAY(SELECT mr.email FROM app_mail_recipient mr WHERE mr.mail_id = m.id AND mr.type = 'to') AS to_addrs,
            ARRAY(SELECT ml.name FROM app_mail_message_label mml JOIN app_mail_label ml ON ml.id = mml.label_id WHERE mml.mail_id = m.id) AS label_names
     FROM app_mail_message m
     LEFT JOIN "user" u ON u.id = m.from_user_id
     WHERE m.id = $1 AND m.owner_user_id = $2`,
    [id, user.id],
  );

  if ((res.rowCount ?? 0) === 0) return null;

  await pool.query(`UPDATE app_mail_message SET is_read = true WHERE id = $1`, [id]);

  const row = res.rows[0];
  return {
    id: row.id as string,
    fromUserId: row.from_user_id as string,
    fromName: row.from_name as string,
    fromEmail: row.from_email as string,
    subject: row.subject as string,
    body: row.body as string,
    folder: row.folder as string,
    isRead: true,
    isStarred: Boolean(row.is_starred),
    isImportant: Boolean(row.is_important),
    to: row.to_addrs as string[],
    labels: row.label_names as string[],
    createdAt: toIso(row.created_at),
  };
}

export async function sendMail(data: { to: string; subject: string; body: string }): Promise<MailMessage> {
  const user = await requireSession();

  // Create the sent copy for the sender
  const res = await pool.query(
    `INSERT INTO app_mail_message (from_user_id, subject, body, folder, owner_user_id)
     VALUES ($1, $2, $3, 'sent', $1) RETURNING *`,
    [user.id, data.subject, data.body],
  );

  const row = res.rows[0];
  await pool.query(`INSERT INTO app_mail_recipient (mail_id, email, type) VALUES ($1, $2, 'to')`, [row.id, data.to]);

  // Deliver an inbox copy to the recipient if they have an account
  const recipientRes = await pool.query(`SELECT id FROM "user" WHERE email = $1 LIMIT 1`, [data.to]);
  if ((recipientRes.rowCount ?? 0) > 0) {
    const recipientId = recipientRes.rows[0].id as string;
    const inboxRes = await pool.query(
      `INSERT INTO app_mail_message (from_user_id, subject, body, folder, owner_user_id)
       VALUES ($1, $2, $3, 'inbox', $4) RETURNING id`,
      [user.id, data.subject, data.body, recipientId],
    );
    await pool.query(`INSERT INTO app_mail_recipient (mail_id, email, type) VALUES ($1, $2, 'to')`, [
      inboxRes.rows[0].id,
      data.to,
    ]);
  }

  return {
    id: row.id as string,
    fromUserId: user.id,
    fromName: (user.name as string | null) ?? user.email,
    fromEmail: user.email,
    subject: data.subject,
    body: data.body,
    folder: "sent",
    isRead: true,
    isStarred: false,
    isImportant: false,
    to: [data.to],
    labels: [],
    createdAt: toIso(row.created_at),
  };
}

export async function updateMailStatus(
  id: string,
  updates: { isRead?: boolean; isStarred?: boolean; isImportant?: boolean; folder?: string },
): Promise<void> {
  const user = await requireSession();

  const clauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.isRead !== undefined) {
    clauses.push(`is_read = $${idx++}`);
    values.push(updates.isRead);
  }
  if (updates.isStarred !== undefined) {
    clauses.push(`is_starred = $${idx++}`);
    values.push(updates.isStarred);
  }
  if (updates.isImportant !== undefined) {
    clauses.push(`is_important = $${idx++}`);
    values.push(updates.isImportant);
  }
  if (updates.folder !== undefined) {
    clauses.push(`folder = $${idx++}`);
    values.push(updates.folder);
  }

  if (clauses.length === 0) return;
  values.push(id, user.id);

  await pool.query(
    `UPDATE app_mail_message SET ${clauses.join(", ")} WHERE id = $${idx} AND owner_user_id = $${idx + 1}`,
    values,
  );
}

export async function deleteMailMessage(id: string): Promise<void> {
  const user = await requireSession();
  const res = await pool.query(`SELECT folder FROM app_mail_message WHERE id = $1 AND owner_user_id = $2`, [
    id,
    user.id,
  ]);
  if ((res.rowCount ?? 0) === 0) return;
  const folder = res.rows[0].folder as string;
  if (folder === "trash") {
    await pool.query(`DELETE FROM app_mail_message WHERE id = $1 AND owner_user_id = $2`, [id, user.id]);
  } else {
    await pool.query(`UPDATE app_mail_message SET folder = 'trash' WHERE id = $1 AND owner_user_id = $2`, [
      id,
      user.id,
    ]);
  }
}

export async function getMailLabels(): Promise<MailLabel[]> {
  const user = await requireSession();

  const res = await pool.query(`SELECT * FROM app_mail_label WHERE user_id = $1 ORDER BY created_at ASC`, [user.id]);

  return res.rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    color: (row.color as string) || "gray",
    createdAt: toIso(row.created_at),
  }));
}

export async function createMailLabel(data: { name: string; color?: string }): Promise<MailLabel> {
  const user = await requireSession();

  const res = await pool.query(`INSERT INTO app_mail_label (user_id, name, color) VALUES ($1, $2, $3) RETURNING *`, [
    user.id,
    data.name,
    data.color ?? "gray",
  ]);

  const row = res.rows[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: toIso(row.created_at),
  };
}
