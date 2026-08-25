import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export default async function RootPage() {
  const profile = await requireProfile();
  redirect(profile.access_level === "directivo" ? "/admin" : "/docente");
}
