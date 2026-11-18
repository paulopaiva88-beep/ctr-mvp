"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatMonthLabel, monthOptions } from "../lib/format";

export function StudentsFilters({ defaultMonth }: { defaultMonth: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [month, setMonth] = useState(searchParams.get("month") ?? defaultMonth);
  const [includeInactive, setIncludeInactive] = useState(
    searchParams.get("includeInactive") === "1",
  );

  function apply(event?: FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    params.set("month", month);
    if (q.trim()) params.set("q", q.trim());
    if (includeInactive) params.set("includeInactive", "1");
    router.push(`/painel/alunos?${params.toString()}`);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-col gap-3 border border-pine/10 bg-white/70 p-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="block grow">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          Buscar
        </span>
        <input
          className="w-full border border-pine/15 bg-white px-3 py-2 outline-none ring-moss/30 focus:ring-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nome, telefone ou e-mail"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          Mês
        </span>
        <select
          className="w-full border border-pine/15 bg-white px-3 py-2 outline-none ring-moss/30 focus:ring-2 sm:min-w-44"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {monthOptions(defaultMonth).map((m) => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          className="accent-moss"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
        />
        Incluir inativos
      </label>
      <button
        type="submit"
        className="bg-pine px-4 py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-moss"
      >
        Filtrar
      </button>
    </form>
  );
}
