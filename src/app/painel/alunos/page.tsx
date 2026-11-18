import Link from "next/link";
import { Suspense } from "react";
import { SampleBanner } from "../../../components/sample-banner";
import { StatusBadge } from "../../../components/status-badge";
import { StudentsFilters } from "../../../components/students-filters";
import {
  currentReferenceMonth,
  formatBRL,
  formatMonthLabel,
} from "../../../lib/format";
import { isUsingSampleDatabase } from "../../../lib/db";
import { listStudentsWithStatus } from "../../../lib/students";

export const dynamic = "force-dynamic";

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    q?: string;
    includeInactive?: string;
  }>;
}) {
  const params = await searchParams;
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : currentReferenceMonth();
  const q = params.q ?? "";
  const includeInactive = params.includeInactive === "1";
  const students = await listStudentsWithStatus(month, { includeInactive, q });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            Alunos · {formatMonthLabel(month)}
          </p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-pine">
            Cadastro
          </h1>
        </div>
        <Link
          href="/painel/alunos/novo"
          className="inline-flex self-start bg-pine px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-moss"
        >
          Novo aluno
        </Link>
      </div>

      <SampleBanner show={isUsingSampleDatabase()} />

      <Suspense fallback={null}>
        <StudentsFilters defaultMonth={month} />
      </Suspense>

      <div className="overflow-hidden border border-pine/10 bg-white/80">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b border-pine/10 bg-fog/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted sm:grid">
          <span>Aluno</span>
          <span>Valor</span>
          <span>Status</span>
          <span />
        </div>
        {students.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">
            Nenhum aluno encontrado. Cadastre o primeiro pelo botão acima.
          </p>
        ) : (
          <ul className="divide-y divide-pine/10">
            {students.map((student) => (
              <li key={student.id}>
                <Link
                  href={`/painel/alunos/${student.id}?month=${month}`}
                  className="grid gap-2 px-4 py-3 transition hover:bg-fog/70 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center sm:gap-3"
                >
                  <div>
                    <p className="font-semibold text-ink">
                      {student.name}
                      {!student.active ? (
                        <span className="ml-2 text-xs font-bold uppercase tracking-wide text-muted">
                          inativo
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">
                      {student.phone || student.email || "Sem contato"}
                    </p>
                  </div>
                  <p className="text-sm font-medium sm:text-base">
                    {formatBRL(student.monthly_amount_cents)}
                  </p>
                  <div>
                    <StatusBadge status={student.status} />
                  </div>
                  <span className="text-sm font-semibold text-moss">Abrir</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
