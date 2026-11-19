export function SampleBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-trail">
      Ambiente de <strong>exemplo / preview</strong> — dados isolados do Postgres
      de produção. No app publicado em produção, os dados ficam no banco da
      aplicação.
    </div>
  );
}
