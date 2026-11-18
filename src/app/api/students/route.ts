import { jsonPrivate, requireAdmin } from "../../../lib/auth";
import { currentReferenceMonth } from "../../../lib/format";
import { createStudent, listStudentsWithStatus } from "../../../lib/students";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const url = new URL(request.url);
  const month = url.searchParams.get("month") || currentReferenceMonth();
  const q = url.searchParams.get("q") || "";
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return jsonPrivate({ error: "Mês inválido." }, { status: 400 });
  }

  const students = await listStudentsWithStatus(month, { includeInactive, q });
  return jsonPrivate({ month, students });
}

export async function POST(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

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

  const student = await createStudent({
    name,
    phone: String(body.phone ?? ""),
    email: String(body.email ?? ""),
    monthlyAmountCents,
    notes: String(body.notes ?? ""),
  });
  return jsonPrivate({ student }, { status: 201 });
}
