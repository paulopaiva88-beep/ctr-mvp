import { jsonPrivate, requireAdmin } from "../../../../lib/auth";
import { deletePayment } from "../../../../lib/students";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;

  const { id } = await ctx.params;
  const ok = await deletePayment(id);
  if (!ok) {
    return jsonPrivate({ error: "Pagamento não encontrado." }, { status: 404 });
  }
  return jsonPrivate({ ok: true });
}
