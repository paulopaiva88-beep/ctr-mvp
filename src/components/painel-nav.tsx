"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/painel", label: "Visão geral" },
  { href: "/painel/alunos", label: "Alunos" },
];

export function PainelNav({
  adminName,
  simulated,
  viaPassword,
}: {
  adminName: string;
  simulated: boolean;
  viaPassword?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="border-b border-pine/10 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/painel" className="group flex items-baseline gap-2">
            <span className="brand-display text-2xl text-pine transition group-hover:text-moss">
              CTR
            </span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-muted sm:inline">
              Painel
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wide text-moss sm:hidden"
          >
            Início
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/painel"
                ? pathname === "/painel"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-pine text-white"
                    : "text-ink/80 hover:bg-fog hover:text-pine"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-sm text-muted">
          <span>
            <span className="font-medium text-ink">{adminName}</span>
            {simulated ? (
              <span className="ml-2 text-xs uppercase tracking-wide text-amber">
                simulado
              </span>
            ) : null}
            {viaPassword ? (
              <span className="ml-2 text-xs uppercase tracking-wide text-moss">
                senha
              </span>
            ) : null}
          </span>
          {viaPassword ? (
            <button
              type="button"
              onClick={logout}
              disabled={pending}
              className="text-xs font-semibold uppercase tracking-wide text-moss hover:text-pine disabled:opacity-50"
            >
              Sair
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
