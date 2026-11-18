import { jsonPrivate, requireAdmin } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAdmin(request);
  if (identity instanceof Response) return identity;
  return jsonPrivate({
    name: identity.name,
    email: identity.email,
    simulated: identity.simulated === true,
  });
}
