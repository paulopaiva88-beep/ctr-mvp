"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatBRL, parseBRLToCents } from "../lib/format";

type Props = {
  mode: "create" | "edit";
  studentId?: string;
  initial?: {
    name: string;
    phone: string;
    email: string;
    monthlyAmountCents: number;
    notes: string;
    active: boolean;
  };
};

export function StudentForm({ mode, studentId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [amount, setAmount] = useState(
    initial ? formatBRL(initial.monthlyAmountCents).replace("R$", "").trim() : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const monthlyAmountCents = parseBRLToCents(amount);
    if (!name.trim()) {
      setError("Informe o nome do aluno.");
      return;
    }
    if (monthlyAmountCents === null) {
      setError("Informe um valor mensal válido, ex.: 180,00");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        email,
        monthlyAmountCents,
        notes,
        active,
      };
      const res =
        mode === "create"
          ? await fetch("/api/students", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/students/${studentId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível salvar.");
        return;
      }
      router.push(`/painel/alunos/${data.student.id}`);
      router.refresh();
    } catch {
      setError("Falha de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Nome
          </span>
          <input
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Telefone
          </span>
          <input
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            E-mail
          </span>
          <input
            type="email"
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Valor mensal (R$)
          </span>
          <input
            className="w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="180,00"
            required
          />
        </label>
        {mode === "edit" ? (
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-moss"
            />
            <span className="text-sm font-medium">Aluno ativo</span>
          </label>
        ) : null}
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            Observações
          </span>
          <textarea
            className="min-h-24 w-full border border-pine/15 bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>
      {error ? <p className="text-sm font-medium text-warn">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="bg-pine px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-moss disabled:opacity-60"
      >
        {saving ? "Salvando…" : mode === "create" ? "Cadastrar aluno" : "Salvar alterações"}
      </button>
    </form>
  );
}
