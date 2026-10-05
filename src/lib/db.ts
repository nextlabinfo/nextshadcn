// Shared server-side DB access + session guard for dashboard server actions.
// This is a plain server module (not "use server"); import it from action files.
import { headers } from "next/headers";

import { Pool } from "pg";

import { auth } from "@/lib/auth";

// Single shared pool for the dashboard data layer.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};

export const iso = (v: unknown): string => {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  try {
    return new Date(v as string).toISOString();
  } catch {
    return "";
  }
};

export const dateStr = (v: unknown): string | null => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};
