import { redirect } from "next/navigation";
import { PainelNav } from "../../components/painel-nav";
import { getAccessState } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAccessState();
  if (access.status !== "ok") {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <PainelNav
        adminName={access.identity.name || access.identity.email || "Admin"}
        simulated={access.identity.simulated === true}
        viaPassword={access.identity.via === "password"}
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
