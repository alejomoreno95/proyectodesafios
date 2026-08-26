// Panel de directivo → gestión de personal: listar el estado de cada
// cuenta, dar de alta a alguien nuevo, generar/reenviar un link de acceso,
// y editar el email de login de una persona.
//
// Seguridad: mismo esquema que invitar-usuarios — no hay secreto
// compartido. Quien llama manda el JWT de su propia sesión
// (Authorization: Bearer <token>); acá adentro se verifica con la
// service-role key (nunca vista por fuera de esta función) que ese
// usuario es un perfil con access_level = 'directivo' y active = true
// antes de hacer cualquier otra cosa.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_TO = "https://proyectodesafios.vercel.app/auth/aceptar";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

type Body =
  | { accion: "listar" }
  | {
      accion: "crear";
      full_name: string;
      email: string;
      cargo: string;
      access_level: "docente" | "directivo";
    }
  | { accion: "reenviar"; email: string }
  | { accion: "editar_email"; user_id: string; nuevo_email: string };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return jsonResponse({ error: "Falta el token de autorización." }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData?.user) {
    return jsonResponse({ error: "Token inválido o vencido." }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: perfil, error: perfilError } = await admin
    .from("profiles")
    .select("access_level, active")
    .eq("id", callerData.user.id)
    .single();

  if (perfilError || !perfil || perfil.access_level !== "directivo" || !perfil.active) {
    return jsonResponse({ error: "Solo un directivo activo puede gestionar personal." }, 403);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body inválido, se esperaba JSON." }, 400);
  }

  if (body.accion === "listar") {
    // Hasta 1000 cuentas por página — muy por encima de lo que este
    // colegio va a tener. Se devuelve solo lo necesario para cruzar con
    // public.profiles del lado del cliente (nunca datos sensibles extra).
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
    const usuarios = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      email_confirmed_at: u.email_confirmed_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));
    return jsonResponse({ ok: true, usuarios });
  }

  if (body.accion === "crear") {
    const { full_name, email, cargo, access_level } = body;
    if (!full_name?.trim() || !email?.trim() || !cargo?.trim() || !access_level) {
      return jsonResponse({ ok: false, error: "Faltan campos." }, 400);
    }
    if (access_level !== "docente" && access_level !== "directivo") {
      return jsonResponse({ ok: false, error: "Rol inválido." }, 400);
    }

    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email: email.trim(),
      options: {
        data: { full_name: full_name.trim(), cargo: cargo.trim(), access_level },
        redirectTo: REDIRECT_TO,
      },
    });

    if (error || !linkData?.properties?.hashed_token) {
      const yaExiste = (error?.message ?? "").toLowerCase().includes("already");
      return jsonResponse({
        ok: false,
        error: yaExiste
          ? "Ya existe una cuenta con ese email."
          : (error?.message ?? "No se pudo generar el link."),
      }, 400);
    }

    const link = `${REDIRECT_TO}?token_hash=${linkData.properties.hashed_token}&type=invite`;
    return jsonResponse({ ok: true, link });
  }

  if (body.accion === "reenviar") {
    const { email } = body;
    if (!email?.trim()) {
      return jsonResponse({ ok: false, error: "Falta el email." }, 400);
    }

    // "recovery" en vez de "invite": funciona tanto para alguien que todavía
    // no activó su cuenta como para alguien activo que necesita elegir una
    // contraseña nueva — /auth/aceptar ya maneja cualquiera de los dos tipos
    // de link de la misma forma (verifyOtp genérico según ?type=).
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim(),
      options: { redirectTo: REDIRECT_TO },
    });

    if (error || !linkData?.properties?.hashed_token) {
      return jsonResponse({ ok: false, error: error?.message ?? "No se pudo generar el link." }, 400);
    }

    const link = `${REDIRECT_TO}?token_hash=${linkData.properties.hashed_token}&type=recovery`;
    return jsonResponse({ ok: true, link });
  }

  if (body.accion === "editar_email") {
    const { user_id, nuevo_email } = body;
    if (!user_id || !nuevo_email?.trim()) {
      return jsonResponse({ ok: false, error: "Faltan campos." }, 400);
    }

    // email_confirm: true evita depender de que salga (o no) un mail de
    // confirmación de cambio de dirección — el directivo ya verificó el
    // dato a mano, así que el cambio queda aplicado al toque.
    const { error } = await admin.auth.admin.updateUserById(user_id, {
      email: nuevo_email.trim(),
      email_confirm: true,
    });

    if (error) {
      return jsonResponse({ ok: false, error: error.message }, 400);
    }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Acción desconocida." }, 400);
});
