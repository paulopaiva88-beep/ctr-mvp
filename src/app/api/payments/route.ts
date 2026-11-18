import { jsonPrivate, requireAdmin } from "../../../lib/auth";
import { recordPayment } from "../../../lib/students";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonPrivate({ error: "JSON inválido." }, { status: 400 });
  }

  const studentId = String(body.studentId ?? "").trim();
  const referenceMonth = String(body.referenceMonth ?? "").trim();
  const amountCents = Number(body.amountCents);
  if (!studentId) {
    return jsonPrivate({ error: "Aluno é obrigatório." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
    return jsonPrivate({ error: "Mês de referência inválido." }, { status: 400 });
  }
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    return jsonPrivate({ error: "Valor inválido." }, { status: 400 });
  }

  try {
    const payment = await recordPayment({
      studentId,
      amountCents,
      referenceMonth,
      paidAt: body.paidAt ? String(body.paidAt) : undefined,
      notes: String(body.notes ?? ""),
      recordedBySub: identity.sub,
      recordedByName: identity.name || identity.email || "Admin",
    });
    return jsonPrivate({ payment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar.";
    if (message.includes("payments_student_id_fkey") || message.includes("foreign key")) {
      return jsonPrivate({ error: "Aluno não encontrado." }, { status: 404 });
    }
    return jsonPrivate({ error: "Não foi possível registrar o pagamento." }, { status: 500 });
  }
}
