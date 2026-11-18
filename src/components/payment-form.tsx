"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  formatBRL,
  formatMonthLabel,
  monthOptions,
  parseBRLToCents,
} from "../lib/format";

export function PaymentForm({
  studentId,
  defaultAmountCents,
  defaultMonth,
}: {
  studentId: string;
  defaultAmountCents: number;
  defaultMonth: string;
}) {
  const router = useRouter();
  const months = monthOptions(defaultMonth);
  const [referenceMonth, setReferenceMonth] = useState(defaultMonth);
  const [amount, setAmount] = useState(
    formatBRL(defaultAmountCents).replace("R$", "").trim(),
  );
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const amountCents = parseBRLToCents(amount);
    if (amountCents === null) {
      setError("Informe um valor válido.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId,
          referenceMonth,
          amountCents,
          paidAt,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível registrar.");
        return;
      }
      setNotes("");
      router.refresh();
    } catch {
      setError("Falha de rede ao registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Mês de referência
          </span>
          <select
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Valor recebido (R$)
          </span>
          <input
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Data do pagamento
          </span>
          <input
            type="date"
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Observação
          </span>
          <input
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pix, dinheiro, transferência…"
          />
        </label>
      </div>
      {error ? <p className="text-sm font-medium text-warn">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="bg-moss px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-pine disabled:opacity-60"
      >
        {saving ? "Registrando…" : "Marcar como pago"}
      </button>
    </form>
  );
}
