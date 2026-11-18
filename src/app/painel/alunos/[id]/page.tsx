import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentForm } from "../../../../components/payment-form";
import { PaymentList } from "../../../../components/payment-list";
import { StatusBadge } from "../../../../components/status-badge";
import { StudentForm } from "../../../../components/student-form";
import { currentReferenceMonth, formatMonthLabel } from "../../../../lib/format";
import {
  getStudent,
  listPaymentsForStudent,
  listStudentsWithStatus,
} from "../../../../lib/students";

export const dynamic = "force-dynamic";

export default async function AlunoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const month =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month)
      ? sp.month
      : currentReferenceMonth();

  const student = await getStudent(id);
  if (!student) notFound();

  const [payments, withStatus] = await Promise.all([
    listPaymentsForStudent(id),
    listStudentsWithStatus(month, { includeInactive: true }),
  ]);
  const statusRow = withStatus.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/painel/alunos?month=${month}`}
          className="text-sm font-semibold text-moss hover:underline"
        >
          ← Alunos
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl uppercase tracking-wide text-pine">
              {student.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Status em {formatMonthLabel(month)}
            </p>
          </div>
          {statusRow ? <StatusBadge status={statusRow.status} /> : null}
        </div>
      </div>

      <section className="panel-shell space-y-3 p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl uppercase tracking-wide text-trail">
          Registrar pagamento
        </h2>
        <p className="text-sm text-muted">
          Baixa manual — sem Pix/boleto automático nesta versão.
        </p>
        <PaymentForm
          studentId={student.id}
          defaultAmountCents={student.monthly_amount_cents}
          defaultMonth={month}
        />
      </section>

      <section className="panel-shell space-y-3 p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl uppercase tracking-wide text-trail">
          Histórico
        </h2>
        <PaymentList payments={payments} />
      </section>

      <section className="panel-shell space-y-3 p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-xl uppercase tracking-wide text-trail">
          Dados do aluno
        </h2>
        <StudentForm
          mode="edit"
          studentId={student.id}
          initial={{
            name: student.name,
            phone: student.phone,
            email: student.email,
            monthlyAmountCents: student.monthly_amount_cents,
            notes: student.notes,
            active: student.active,
          }}
        />
      </section>
    </div>
  );
}
