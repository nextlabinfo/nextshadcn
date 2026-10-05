"use client";

import { useTransition } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FinPeriod } from "@/lib/finance/types";

export function PeriodSelector({ periods, current }: { periods: FinPeriod[]; current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    startTransition(() => router.push(`?${params.toString()}`));
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-[160px]" disabled={isPending}>
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {periods.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
            {p.status !== "closed" ? ` · ${p.status}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
