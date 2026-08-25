// Envía invitaciones reales por email a personal de CSME.
//
// Seguridad: no usa un secreto compartido. Quien llama debe mandar el JWT
// de una sesión de Supabase Auth ya iniciada (Authorization: Bearer <token>)
// perteneciente a un perfil con access_level = 'directivo' y active = true.
// Esto se verifica acá adentro con la service-role key (inyectada
// automáticamente por Supabase, nunca vista por fuera de esta función) antes
// de invitar a nadie.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_TO = "https://proyectodesafios.vercel.app/auth/aceptar";

type Invitado = {
  email: string;
  full_name: string;
  cargo: string;
  access_level: "docente" | "directivo";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return jsonResponse({ error: "Falta el token de autorización." }, 401);
  }

  // Cliente "as user" solo para validar quién está llamando.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData?.user) {
    return jsonResponse({ error: "Token inválido o vencido." }, 401);
  }

  // Cliente con service-role para leer el perfil real y para invitar.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: perfil, error: perfilError } = await admin
    .from("profiles")
    .select("access_level, active")
    .eq("id", callerData.user.id)
    .single();

  if (perfilError || !perfil || perfil.access_level !== "directivo" || !perfil.active) {
    return jsonResponse({ error: "Solo un directivo activo puede enviar invitaciones." }, 403);
  }

  let body: { usuarios?: Invitado[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body inválido, se esperaba JSON." }, 400);
  }

  const usuarios = body.usuarios;
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return jsonResponse({ error: "Falta la lista 'usuarios'." }, 400);
  }

  const resultados: { email: string; ok: boolean; error?: string }[] = [];

  for (const u of usuarios) {
    if (!u.email || !u.full_name || !u.cargo || !u.access_level) {
      resultados.push({ email: u.email ?? "(sin email)", ok: false, error: "Faltan campos." });
      continue;
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(u.email, {
      data: {
        full_name: u.full_name,
        cargo: u.cargo,
        access_level: u.access_level,
      },
      redirectTo: REDIRECT_TO,
    });

    resultados.push({ email: u.email, ok: !error, error: error?.message });

    // Pequeña pausa entre envíos para no pisar el rate limit de emails
    // del proveedor de correo incluido de Supabase.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  return jsonResponse({ resultados });
});
