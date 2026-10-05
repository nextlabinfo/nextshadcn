"use client";

import { useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Download, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toCsv } from "@/lib/finance/format";
import type { ImportEntity, ImportResult } from "@/lib/finance/types";
import { importFinanceData } from "@/server/finance-actions";

const SCHEMAS: Record<ImportEntity, { label: string; headers: string[]; sample: (string | number)[] }> = {
  ar_invoice: {
    label: "AR invoices",
    headers: ["invoice_no", "customer_name", "invoice_date", "due_date", "amount", "amount_paid", "status"],
    sample: ["INV-2001", "Acme Corp", "2026-10-01", "2026-10-31", 12500, 0, "open"],
  },
  ap_bill: {
    label: "AP bills",
    headers: ["bill_no", "vendor_name", "bill_date", "due_date", "amount", "amount_paid", "status"],
    sample: ["BILL-6001", "Acme Supplies", "2026-10-01", "2026-10-31", 4200, 0, "open"],
  },
  budget: {
    label: "Budget lines",
    headers: ["account_code", "fiscal_year", "period_number", "amount", "scenario"],
    sample: ["6100", 2026, 11, 60000, "budget"],
  },
};

// Minimal RFC-4180-ish CSV parser (handles quotes, commas, newlines).
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((v) => v !== "")) rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

// Lazy-load SheetJS from CDN for XLSX parsing (no npm dependency required).
let xlsxPromise: Promise<unknown> | null = null;
function loadXlsx(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as unknown as { XLSX?: unknown };
  if (w.XLSX) return Promise.resolve(w.XLSX);
  if (xlsxPromise !== null) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => resolve((window as unknown as { XLSX: unknown }).XLSX);
    s.onerror = () => reject(new Error("Failed to load the XLSX parser from CDN."));
    document.head.appendChild(s);
  });
  return xlsxPromise;
}

async function parseXlsx(file: File): Promise<Record<string, string>[]> {
  const XLSX = (await loadXlsx()) as {
    read: (data: ArrayBuffer, opts: { type: string }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
    utils: { sheet_to_json: (ws: unknown, opts: { defval: string; raw: boolean }) => Record<string, unknown>[] };
  };
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  return json.map((r) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) o[String(k).trim()] = String(v ?? "").trim();
    return o;
  });
}

export function ImportClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<ImportEntity>("ar_invoice");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const schema = SCHEMAS[entity];

  async function onFile(file: File) {
    setParseError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const parsed = file.name.toLowerCase().endsWith(".csv") ? parseCsv(await file.text()) : await parseXlsx(file);
      setRows(parsed);
      if (parsed.length === 0) setParseError("No data rows found in the file.");
    } catch (err) {
      setRows([]);
      setParseError((err as Error).message);
    }
  }

  function downloadTemplate() {
    const csv = toCsv(schema.headers, [schema.sample]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function runImport() {
    startTransition(async () => {
      const res = await importFinanceData(entity, rows);
      setResult(res);
      if (res.inserted > 0) router.refresh();
    });
  }

  const preview = rows.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl tracking-tight">Import finance data</h1>
          <p className="text-muted-foreground text-sm">
            Upload a CSV or XLSX file to load AR invoices, AP bills, or budget lines.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/finance-analyst">
            <ArrowLeft data-icon="inline-start" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">1. Choose what to import</CardTitle>
          <CardDescription>Download the template to see the exact columns expected.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select
            value={entity}
            onValueChange={(v) => {
              setEntity(v as ImportEntity);
              setRows([]);
              setResult(null);
              setFileName("");
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SCHEMAS) as ImportEntity[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SCHEMAS[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download data-icon="inline-start" />
            Download {schema.label} template
          </Button>
          <code className="text-muted-foreground text-xs">{schema.headers.join(", ")}</code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">2. Upload file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <FileUp data-icon="inline-start" />
            {fileName || "Select CSV or XLSX file"}
          </Button>
          {parseError ? <p className="text-destructive text-sm">{parseError}</p> : null}
          {rows.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              Parsed {rows.length} row{rows.length > 1 ? "s" : ""}. Previewing first {preview.length}.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {preview.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-normal">3. Preview &amp; import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {schema.headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((r) => (
                    <TableRow key={schema.headers.map((h) => String(r[h] ?? "")).join("|")}>
                      {schema.headers.map((h) => (
                        <TableCell key={h} className="whitespace-nowrap">
                          {r[h] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button onClick={runImport} disabled={isPending}>
              {isPending ? "Importing…" : `Import ${rows.length} row${rows.length > 1 ? "s" : ""}`}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card className={result.errors.length ? "border-amber-500/30" : "border-green-500/30"}>
          <CardHeader>
            <CardTitle className="font-normal">Import result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-green-600 dark:text-green-400">Inserted: {result.inserted}</p>
            {result.skipped > 0 ? <p className="text-destructive">Skipped: {result.skipped}</p> : null}
            {result.errors.length > 0 ? (
              <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
