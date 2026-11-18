"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBRL, formatMonthLabel } from "../lib/format";
import type { Payment } from "../lib/students";

export function PaymentList({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function remove(id: string) {
    if (!confirm("Remover este registro de pagamento?")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível remover.");
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de rede ao remover.");
    } finally {
      setBusyId(null);
    }
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted">Nenhum pagamento registrado ainda.</p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm font-medium text-warn">{error}</p> : null}
      <ul className="divide-y divide-pine/10 border border-pine/10 bg-white/80">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-ink">
                {formatMonthLabel(payment.reference_month)} ·{" "}
                {formatBRL(payment.amount_cents)}
              </p>
              <p className="text-xs text-muted">
                Pago em{" "}
                {new Date(payment.paid_at).toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })}
                {payment.recorded_by_name
                  ? ` · por ${payment.recorded_by_name}`
                  : ""}
                {payment.notes ? ` · ${payment.notes}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(payment.id)}
              disabled={busyId === payment.id}
              className="self-start border border-warn/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-warn hover:bg-warn/5 disabled:opacity-50"
            >
              {busyId === payment.id ? "…" : "Desfazer"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
