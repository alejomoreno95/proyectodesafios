"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Tipo = "individual" | "grupal";
export type Motivo = "confesion" | "charla";

export type CrearSituacionPayload = {
  course_ids: string[];
  tipo: Tipo;
  persona_nombre: string | null;
  descripcion: string | null;
  encounter_id: string | null;
};

export type CrearSolicitudCapellanPayload = {
  course_ids: string[];
  tipo: Tipo;
  persona_nombre: string | null;
  motivo: Motivo;
  descripcion: string | null;
  encounter_id: string | null;
};

export type CrearSolicitudResult = { ok: true } | { ok: false; error: string };

function validarComun(payload: {
  course_ids: string[];
  tipo: Tipo;
  persona_nombre: string | null;
}): string | null {
  if (!payload.course_ids || payload.course_ids.length === 0) {
    return "Elegí al menos un curso.";
  }
  if (payload.tipo === "individual" && !payload.persona_nombre?.trim()) {
    return "Completá el nombre de la persona a quien refiere.";
  }
  return null;
}

/**
 * Crea una situación dirigida al EOE. Pasa por crear_situacion_eoe (RPC
 * SECURITY INVOKER) para que el insert de la situación y el de sus cursos
 * queden atómicos — la RLS sigue siendo la autoridad real, esto solo evita
 * dejar una situación "huérfana" sin cursos si algo falla a mitad de camino.
 */
export async function crearSituacion(
  payload: CrearSituacionPayload,
): Promise<CrearSolicitudResult> {
  await requireProfile();

  const error0 = validarComun(payload);
  if (error0) return { ok: false, error: error0 };

  const supabase = await createClient();
  // Los tipos generados marcan estos parámetros como `string` porque
  // Postgres no distingue "nullable" a nivel de firma de función — en
  // runtime la RPC los acepta NULL sin problema (ninguno es STRICT).
  const { error } = await supabase.rpc("crear_situacion_eoe", {
    p_course_ids: payload.course_ids,
    p_tipo: payload.tipo,
    p_persona_nombre: (payload.tipo === "individual" ? payload.persona_nombre!.trim() : null) as string,
    p_descripcion: (payload.descripcion?.trim() || null) as string,
    p_encounter_id: payload.encounter_id as string,
  });

  if (error) return { ok: false, error: "No se pudo enviar la solicitud. Probá de nuevo." };

  revalidatePath("/docente/reportar");
  return { ok: true };
}

/**
 * Crea una solicitud al Capellán. Igual que arriba, pero la RPC además
 * fuerza descripcion = NULL en el servidor cuando el motivo es confesión,
 * sin importar lo que se haya mandado desde acá — nunca confiamos en el
 * cliente para eso.
 */
export async function crearSolicitudCapellan(
  payload: CrearSolicitudCapellanPayload,
): Promise<CrearSolicitudResult> {
  await requireProfile();

  const error0 = validarComun(payload);
  if (error0) return { ok: false, error: error0 };

  const supabase = await createClient();
  const { error } = await supabase.rpc("crear_solicitud_capellan", {
    p_course_ids: payload.course_ids,
    p_tipo: payload.tipo,
    p_persona_nombre: (payload.tipo === "individual" ? payload.persona_nombre!.trim() : null) as string,
    p_motivo: payload.motivo,
    p_descripcion: (payload.motivo === "confesion" ? null : payload.descripcion?.trim() || null) as string,
    p_encounter_id: payload.encounter_id as string,
  });

  if (error) return { ok: false, error: "No se pudo enviar la solicitud. Probá de nuevo." };

  revalidatePath("/docente/reportar");
  return { ok: true };
}
