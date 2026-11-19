"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PanelLoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, name }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível entrar.");
        return;
      }
      router.push("/painel");
      router.refresh();
    } catch {
      setError("Falha de rede. Tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-3 border border-white/20 bg-black/30 p-4"
    >
      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-sand/80">
        Seu nome
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-white/25 bg-transparent px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-amber"
          placeholder="Admin"
          autoComplete="username"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-sand/80">
        Senha do painel
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-white/25 bg-transparent px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-amber"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-amber">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-amber px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-trail disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
