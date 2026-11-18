"use client";

import { useRouter } from "next/navigation";
import { formatMonthLabel, monthOptions } from "../lib/format";

export function MonthSwitcher({
  month,
  basePath,
}: {
  month: string;
  basePath: string;
}) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="font-bold uppercase tracking-wide text-muted">Mês</span>
      <select
        className="border border-pine/15 bg-white px-3 py-2 outline-none ring-moss/30 focus:ring-2"
        value={month}
        onChange={(e) => {
          const params = new URLSearchParams();
          params.set("month", e.target.value);
          router.push(`${basePath}?${params.toString()}`);
        }}
      >
        {monthOptions(month).map((m) => (
          <option key={m} value={m}>
            {formatMonthLabel(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
