export function StatusBadge({
  status,
}: {
  status: "adimplente" | "inadimplente";
}) {
  const ok = status === "adimplente";
  return (
    <span className={`status-pill ${ok ? "status-ok" : "status-warn"}`}>
      <span
        className={`h-1.5 w-1.5 rounded-sm ${ok ? "bg-ok" : "bg-warn"}`}
        aria-hidden
      />
      {ok ? "Adimplente" : "Inadimplente"}
    </span>
  );
}
