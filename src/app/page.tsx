import Link from "next/link";
import { PanelLoginForm } from "../components/panel-login-form";
import { getAccessState } from "../lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const access = await getAccessState();
  const signedIn = access.status === "ok";

  return (
    <main className="min-h-screen">
      <section className="hero-mountains animate-trail relative min-h-[100svh] overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0 trail-grid opacity-30" />
        <div className="pointer-events-none absolute -left-16 bottom-24 h-64 w-64 rounded-full bg-amber/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-fern/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sand/90">
              Assessoria de corrida
            </p>
            {signedIn ? (
              <p className="text-xs text-sand/80">
                {access.identity.name || access.identity.email || "Admin"}
                {access.identity.simulated ? " · simulado" : ""}
                {access.identity.via === "password" ? " · senha" : ""}
              </p>
            ) : (
              <p className="text-xs text-sand/80">Acesso para admins</p>
            )}
          </div>

          <div className="max-w-3xl py-16">
            <p className="animate-rise brand-display text-[clamp(4.5rem,18vw,9rem)] leading-[0.85] text-white">
              CTR
            </p>
            <h1 className="animate-rise-delay mt-3 max-w-xl font-display text-3xl uppercase tracking-[0.08em] text-sand sm:text-4xl">
              Chavinho Trail Running
            </h1>
            <p className="animate-rise-delay mt-5 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              Controle de alunos, valores individuais e pagamentos manuais —
              painel com senha compartilhada (não precisa de conta Cursor).
            </p>

            {signedIn ? (
              <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
                <Link
                  href="/painel"
                  className="bg-amber px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-trail transition hover:bg-sand"
                >
                  Entrar no painel
                </Link>
                <Link
                  href="/painel/alunos"
                  className="border border-white/35 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                >
                  Ver alunos
                </Link>
              </div>
            ) : (
              <div className="animate-rise-delay mt-6 max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber">
                  Login do painel
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Use a senha compartilhada dos admins. No Cursor, o app deve
                  estar <strong>public</strong> para quem não tem conta Cursor
                  abrir o link.
                </p>
                {access.status === "blocked" && access.code === "password_unset" ? (
                  <p className="mt-3 border border-amber/40 bg-black/35 px-3 py-2 text-sm text-sand">
                    {access.message}
                  </p>
                ) : (
                  <PanelLoginForm />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-white/15 pt-5 text-xs uppercase tracking-[0.18em] text-sand/75 sm:flex-row sm:items-center sm:justify-between">
            <span>Adimplente · Inadimplente · Multi-admin</span>
            <span>Web · celular e computador</span>
          </div>
        </div>
      </section>
    </main>
  );
}
