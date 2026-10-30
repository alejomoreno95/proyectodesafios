import { redirect } from "next/navigation";
import { hasRole, requireProfile } from "@/lib/auth";

export default async function RootPage() {
  const profile = await requireProfile();
  const esAdmin =
    profile.access_level === "directivo" || hasRole(profile, "administrador");
  redirect(esAdmin ? "/admin" : "/docente");
}
