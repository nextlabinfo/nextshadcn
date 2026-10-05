import type { Metadata } from "next";

import { ImportClient } from "./_components/import-client";

export const metadata: Metadata = {
  title: "Import finance data",
  description: "Import AR invoices, AP bills, and budget lines from CSV or XLSX into the Finance Analyst workspace.",
  alternates: { canonical: "/dashboard/finance-analyst/import" },
};

export default function Page() {
  return <ImportClient />;
}
