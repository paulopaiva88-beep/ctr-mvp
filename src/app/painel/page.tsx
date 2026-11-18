import Link from "next/link";
import { MonthSwitcher } from "../../components/month-switcher";
import { SampleBanner } from "../../components/sample-banner";
import { StatusBadge } from "../../components/status-badge";
import {
  currentReferenceMonth,
  formatBRL,
  formatMonthLabel,
} from "../../lib/format";
import { getDashboard, listStudentsWithStatus } from "../../lib/students";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : currentReferenceMonth();
  const dash = await getDashboard(month);
  const students = await listStudentsWithStatus(month, {
    includeInactive: false,
  });
  const pending = students.filter((s) => s.status === "inadimplente").slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            Visão geral
          </p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-pine sm:text-4xl">
            {formatMonthLabel(month)}
          </h1>
        </div>
        <MonthSwitcher month={month} basePath="/painel" />
      </div>

      <SampleBanner show={dash.sampleData} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Alunos ativos", value: String(dash.activeStudents) },
          { label: "Adimplentes", value: String(dash.adimplentes) },
          { label: "Inadimplentes", value: String(dash.inadimplentes) },
          { label: "Recebido", value: formatBRL(dash.receivedCents) },
        ].map((item) => (
          <div key={item.label} className="panel-shell p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              {item.label}
            </p>
            <p className="mt-2 font-display text-3xl text-pine">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel-shell p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl uppercase tracking-wide text-trail">
              Pendências do mês
            </h2>
            <Link
              href={`/painel/alunos?month=${month}`}
              className="text-sm font-semibold text-moss hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhum aluno inadimplente em {formatMonthLabel(month)}.
            </p>
          ) : (
            <ul className="divide-y divide-pine/10">
              {pending.map((student) => (
                <li key={student.id}>
                  <Link
                    href={`/painel/alunos/${student.id}?month=${month}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:bg-fog/60"
                  >
                    <div>
                      <p className="font-semibold text-ink">{student.name}</p>
                      <p className="text-sm text-muted">
                        {formatBRL(student.monthly_amount_cents)}
                      </p>
                    </div>
                    <StatusBadge status="inadimplente" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-shell space-y-4 p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-xl uppercase tracking-wide text-trail">
            Financeiro do mês
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Esperado</dt>
              <dd className="font-semibold">{formatBRL(dash.expectedCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Recebido</dt>
              <dd className="font-semibold text-ok">
                {formatBRL(dash.receivedCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-pine/10 pt-3">
              <dt className="text-muted">Em aberto</dt>
              <dd className="font-semibold text-warn">
                {formatBRL(dash.openCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Inativos</dt>
              <dd className="font-semibold">{dash.inactiveStudents}</dd>
            </div>
          </dl>
          <Link
            href="/painel/alunos/novo"
            className="inline-flex bg-pine px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-moss"
          >
            Novo aluno
          </Link>
        </div>
      </section>
    </div>
  );
}
