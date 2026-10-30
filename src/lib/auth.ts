import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "docente" | "directivo" | "eoe" | "administrador";
export type Alcance = "Primaria" | "Secundaria" | "Total";

export type Profile = {
  id: string;
  full_name: string;
  cargo: string;
  access_level: "docente" | "directivo";
  active: boolean;
  roles: Role[];
  alcance: Alcance;
  ver_situaciones_eoe: boolean;
  ver_notas_eoe: boolean;
};

const PROFILE_SELECT =
  "id, full_name, cargo, access_level, active, roles, alcance, ver_situaciones_eoe, ver_notas_eoe";

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
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) {
    redirect("/login?error=cuenta-inactiva");
  }

  return profile as Profile;
}

/** True when the profile carries the given role (roles are combinable). */
export function hasRole(profile: Profile, role: Role): boolean {
  return profile.roles.includes(role);
}

/** True when the profile can see every nivel (alcance "Total") or the one given. */
export function alcanceIncludes(profile: Profile, nivel: "Primaria" | "Secundaria"): boolean {
  return profile.alcance === "Total" || profile.alcance === nivel;
}

/**
 * Same as requireProfile, but redirects docentes away from /admin/* routes.
 * access_level is kept as the legacy field driving existing admin routes;
 * roles=['administrador'] is treated as a superset (same bypass the
 * database policies already grant it) so an administrador account reaches
 * /admin even without the directivo access_level.
 */
export async function requireDirectivo(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.access_level !== "directivo" && !hasRole(profile, "administrador")) {
    redirect("/docente");
  }
  return profile;
}

/** Mesa de trabajo del EOE — redirects accounts without the eoe role (or administrador) to /docente. */
export async function requireEOE(): Promise<Profile> {
  const profile = await requireProfile();
  if (!hasRole(profile, "eoe") && !hasRole(profile, "administrador")) {
    redirect("/docente");
  }
  return profile;
}

/**
 * Directivo view onto situaciones reportadas al EOE — gated by the
 * explicit ver_situaciones_eoe permission (never implied by the directivo
 * role or alcance "Total" alone, per spec). administrador bypasses it.
 */
export async function requireVerSituacionesEoe(): Promise<Profile> {
  const profile = await requireDirectivo();
  if (!profile.ver_situaciones_eoe && !hasRole(profile, "administrador")) {
    redirect("/admin");
  }
  return profile;
}
