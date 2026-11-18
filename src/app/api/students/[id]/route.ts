import { jsonPrivate, requireAdmin } from "../../../../lib/auth";
import {
  getStudent,
  listPaymentsForStudent,
  updateStudent,
} from "../../../../lib/students";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const { id } = await ctx.params;
  const student = await getStudent(id);
  if (!student) {
    return jsonPrivate({ error: "Aluno não encontrado." }, { status: 404 });
  }
  const payments = await listPaymentsForStudent(id);
  return jsonPrivate({ student, payments });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonPrivate({ error: "JSON inválido." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const monthlyAmountCents = Number(body.monthlyAmountCents);
  if (!name) {
    return jsonPrivate({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!Number.isInteger(monthlyAmountCents) || monthlyAmountCents < 0) {
    return jsonPrivate(
      { error: "Informe um valor mensal válido em centavos." },
      { status: 400 },
    );
  }

  const student = await updateStudent(id, {
    name,
    phone: String(body.phone ?? ""),
    email: String(body.email ?? ""),
    monthlyAmountCents,
    notes: String(body.notes ?? ""),
    active: body.active !== false,
  });
  if (!student) {
    return jsonPrivate({ error: "Aluno não encontrado." }, { status: 404 });
  }
  return jsonPrivate({ student });
}
