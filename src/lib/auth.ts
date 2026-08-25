import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string;
  cargo: string;
  access_level: "docente" | "directivo";
  active: boolean;
};

/**
 * Fetches the signed-in user's profile. Redirects to /login if there is no
 * session. This is the one place route code should ask "who is this and
 * what can they do" — Row Level Security enforces the same rule at the
 * database layer independently, so a bug here never turns into a data leak.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, cargo, access_level, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) {
    redirect("/login?error=cuenta-inactiva");
  }

  return profile as Profile;
}

/** Same as requireProfile, but redirects docentes away from /admin/* routes. */
export async function requireDirectivo(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.access_level !== "directivo") {
    redirect("/docente");
  }
  return profile;
}
