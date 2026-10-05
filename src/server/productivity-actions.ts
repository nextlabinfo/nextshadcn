"use server";

import { dateStr, iso, pool, requireSession } from "@/lib/db";
import type { ProdNote, ProdProject } from "@/lib/dashboards/types";

export async function getProdProjects(): Promise<ProdProject[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM prod_project ORDER BY
    CASE status WHEN 'active' THEN 0 WHEN 'on_hold' THEN 1 ELSE 2 END, due_date ASC NULLS LAST`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color ?? "blue",
    progress: Number(r.progress),
    status: r.status,
    dueDate: dateStr(r.due_date),
  }));
}

export async function getProdNotes(): Promise<ProdNote[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM prod_note ORDER BY pinned DESC, created_at DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    pinned: Boolean(r.pinned),
    createdAt: iso(r.created_at),
  }));
}

export async function getProductivitySummary() {
  await requireSession();
  const proj = await pool.query(`
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status='active') AS active,
           COUNT(*) FILTER (WHERE status='done') AS done,
           COALESCE(AVG(progress),0) AS avg_progress
    FROM prod_project`);
  const tasks = await pool.query(`
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status='done') AS done
    FROM app_task`).catch(() => ({ rows: [{ total: 0, done: 0 }] }));
  const p = proj.rows[0];
  const t = tasks.rows[0];
  return {
    activeProjects: Number(p.active),
    doneProjects: Number(p.done),
    avgProgress: Math.round(Number(p.avg_progress)),
    totalTasks: Number(t.total),
    doneTasks: Number(t.done),
  };
}
