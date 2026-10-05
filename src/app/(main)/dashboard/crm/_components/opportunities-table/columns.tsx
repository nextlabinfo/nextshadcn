"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { cn } from "cn";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { DataTableFeatures } from "@/lib/data-table-features";

import type { OpportunityRow } from "./schema";

const probabilityStripSlots = Array.from({ length: 18 }, (_, index) => ({
  id: `strip-${index + 1}`,
  threshold: index + 1,
}));

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatCloseDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

export const opportunitiesColumns: ColumnDef<DataTableFeatures, OpportunityRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Subscribe
        source={table.atoms.rowSelection}
        selector={() =>
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
        }
      >
        {(checked) => (
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all opportunities"
          />
        )}
      </Subscribe>
    ),
    cell: ({ row }) => (
      <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
        {(checked) => (
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.account}`}
          />
        )}
      </Subscribe>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Opportunity",
    cell: ({ row }) => <div className="font-medium text-sm">{row.original.name}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => <div className="font-medium text-sm">{row.original.account}</div>,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => (
      <Badge variant="outline" className="rounded-full px-2.5 capitalize">
        {row.original.stage}
      </Badge>
    ),
    filterFn: "equalsString",
  },
  {
    accessorKey: "closeDate",
    header: "Close Date",
    cell: ({ row }) => <div className="text-sm tabular-nums">{formatCloseDate(row.original.closeDate)}</div>,
  },
  {
    accessorKey: "probability",
    header: "Probability",
    cell: ({ row }) => {
      const score = Math.round((row.original.probability / 100) * probabilityStripSlots.length);
      return (
        <div className="flex items-end gap-0.5" title={`${row.original.probability}%`}>
          <span className="sr-only">{row.original.probability}%</span>
          {probabilityStripSlots.map((slot) => (
            <div
              key={`${row.original.id}-${slot.id}`}
              className={cn(
                "h-5 w-1 rounded-full",
                slot.threshold <= score ? "bg-green-500/85" : "bg-green-500/15",
              )}
            />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Value",
    cell: ({ row }) => (
      <div className="font-medium text-sm tabular-nums">{currencyFormatter.format(row.original.amount)}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Edit</div>,
    cell: () => (
      <div className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:bg-transparent focus-visible:bg-transparent"
        >
          <Pencil />
          <span className="sr-only">Edit opportunity</span>
        </Button>
      </div>
    ),
    enableHiding: false,
  },
];
