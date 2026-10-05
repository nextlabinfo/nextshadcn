"use server";

import { iso, pool, requireSession } from "@/lib/db";
import type { FmFile, FmFolder, FmStorage } from "@/lib/dashboards/types";

export async function getFolders(): Promise<FmFolder[]> {
  await requireSession();
  const res = await pool.query(`
    SELECT f.id, f.name,
           COUNT(fi.id)::int AS file_count,
           COALESCE(SUM(fi.size_bytes),0)::bigint AS size_bytes
    FROM fm_folder f
    LEFT JOIN fm_file fi ON fi.folder_id = f.id
    GROUP BY f.id
    ORDER BY f.name ASC`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    fileCount: Number(r.file_count),
    sizeBytes: Number(r.size_bytes),
  }));
}

export async function getFiles(): Promise<FmFile[]> {
  await requireSession();
  const res = await pool.query(`
    SELECT fi.*, fo.name AS folder_name
    FROM fm_file fi
    LEFT JOIN fm_folder fo ON fo.id = fi.folder_id
    ORDER BY fi.updated_at DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    folderName: r.folder_name,
    name: r.name,
    kind: r.kind,
    sizeBytes: Number(r.size_bytes),
    owner: r.owner,
    starred: Boolean(r.starred),
    updatedAt: iso(r.updated_at),
  }));
}

export async function getStorageSummary(): Promise<FmStorage> {
  await requireSession();
  const res = await pool.query(`
    SELECT COALESCE(SUM(size_bytes),0)::bigint AS used, COUNT(*)::int AS files FROM fm_file`);
  const folders = await pool.query(`SELECT COUNT(*)::int AS c FROM fm_folder`);
  return {
    usedBytes: Number(res.rows[0].used),
    fileCount: Number(res.rows[0].files),
    folderCount: Number(folders.rows[0].c),
  };
}
