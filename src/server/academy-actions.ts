"use server";

import { dateStr, iso, num, pool, requireSession } from "@/lib/db";
import type { AcademyEvent, AcademyKpis, Assignment, Course } from "@/lib/dashboards/types";

export async function getCourses(): Promise<Course[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM edu_course ORDER BY students DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    instructor: r.instructor,
    category: r.category,
    lessons: Number(r.lessons),
    students: Number(r.students),
    rating: num(r.rating),
    status: r.status,
  }));
}

export async function getAssignments(): Promise<Assignment[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM edu_assignment ORDER BY due_date ASC NULLS LAST`);
  return res.rows.map((r) => ({
    id: r.id,
    courseTitle: r.course_title,
    title: r.title,
    dueDate: dateStr(r.due_date),
    submitted: Number(r.submitted),
    total: Number(r.total),
    status: r.status,
  }));
}

export async function getAcademyEvents(): Promise<AcademyEvent[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM edu_event ORDER BY start_at ASC`);
  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    location: r.location,
    startAt: iso(r.start_at),
    endAt: r.end_at ? iso(r.end_at) : null,
  }));
}

export async function getAcademyKpis(): Promise<AcademyKpis> {
  await requireSession();
  const res = await pool.query(`
    SELECT COALESCE(SUM(students),0) AS students,
           COUNT(*) FILTER (WHERE status='published') AS active,
           COALESCE(AVG(rating),0) AS rating
    FROM edu_course`);
  const due = await pool.query(`SELECT COUNT(*) AS c FROM edu_assignment WHERE status IN ('open','grading')`);
  const r = res.rows[0];
  return {
    totalStudents: Number(r.students),
    activeCourses: Number(r.active),
    avgRating: num(r.rating),
    assignmentsDue: Number(due.rows[0].c),
  };
}
