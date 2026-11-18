export function SampleBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-trail">
      Ambiente local com <strong>dados de exemplo</strong> (sem Postgres). No
      app publicado, os dados ficam no banco da aplicação.
    </div>
  );
}
