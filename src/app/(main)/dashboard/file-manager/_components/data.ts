import { File, FileArchive, FileChartColumn, FileImage, FileText } from "lucide-react";

export type FileManagerView = "grid" | "list";

const fileIconMap: Record<string, typeof File> = {
  archive: FileArchive,
  design: FileImage,
  document: FileText,
  pdf: File,
  spreadsheet: FileChartColumn,
};

const fileKindLabelMap: Record<string, string> = {
  archive: "Archive",
  design: "Design",
  document: "Document",
  pdf: "PDF",
  spreadsheet: "Spreadsheet",
};

export function getFileIcon(kind: string): typeof File {
  return fileIconMap[kind] ?? File;
}

export function getFileKindLabel(kind: string): string {
  return fileKindLabelMap[kind] ?? (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "File");
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
