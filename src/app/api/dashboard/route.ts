import { jsonPrivate, requireAdmin } from "../../../lib/auth";
import { currentReferenceMonth } from "../../../lib/format";
import { getDashboard } from "../../../lib/students";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const url = new URL(request.url);
  const month = url.searchParams.get("month") || currentReferenceMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return jsonPrivate({ error: "Mês inválido." }, { status: 400 });
  }

  const data = await getDashboard(month);
  return jsonPrivate(data);
}
