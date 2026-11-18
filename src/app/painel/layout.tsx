import { redirect } from "next/navigation";
import { PainelNav } from "../../components/painel-nav";
import { getAdmin } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getAdmin();
  if (!identity.verified) {
    redirect("/");
  }
  if (identity.kind === "key") {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <PainelNav
        adminName={identity.name || identity.email || "Admin"}
        simulated={identity.simulated === true}
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
