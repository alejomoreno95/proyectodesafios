import { requireDirectivo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PersonalClient, type Persona } from "./PersonalClient";

// Se llama a la Edge Function acá, del lado del servidor, con el access
// token de la sesión actual — así el browser nunca necesita saber esta URL
// ni hacer la primera llamada; el listado ya llega completo en el HTML.
async function listarUsuariosAuth(accessToken: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gestionar-personal`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ accion: "listar" }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return null;
    return data.usuarios as {
      id: string;
      email: string;
      email_confirmed_at: string | null;
      last_sign_in_at: string | null;
    }[];
  } catch {
    return null;
  }
}

export default async function PersonalPage() {
  await requireDirectivo();
  const supabase = await createClient();

  const [{ data: perfiles }, { data: sessionData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, cargo, access_level, active")
      .order("access_level", { ascending: false })
      .order("full_name"),
    supabase.auth.getSession(),
  ]);

  const accessToken = sessionData.session?.access_token;
  const usuariosAuth = accessToken ? await listarUsuariosAuth(accessToken) : null;
  const porId = new Map((usuariosAuth ?? []).map((u) => [u.id, u]));

  const personas: Persona[] = (perfiles ?? []).map((p) => {
    const auth = porId.get(p.id);
    return {
      id: p.id,
      full_name: p.full_name,
      cargo: p.cargo,
      access_level: p.access_level as "docente" | "directivo",
      active: p.active,
      email: auth?.email ?? null,
      confirmado: Boolean(auth?.email_confirmed_at),
      ultimo_ingreso: auth?.last_sign_in_at ?? null,
    };
  });

  return (
    <PersonalClient
      personasIniciales={personas}
      emailsDisponibles={usuariosAuth !== null}
    />
  );
}
