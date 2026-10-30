"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CrearSituacionPayload = {
  course_id: string;
  encounter_id: string | null;
  titulo: string;
  descripcion: string;
};

export type CrearSituacionResult = { ok: true } | { ok: false; error: string };

/**
 * Crea una situación reportada por el docente. docente_id y nivel los
 * completa automáticamente un trigger en la base (situaciones_before_insert)
 * a partir del curso elegido — nunca se mandan desde el cliente.
 */
export async function crearSituacion(
  payload: CrearSituacionPayload,
): Promise<CrearSituacionResult> {
  const profile = await requireProfile();

  const titulo = payload.titulo?.trim();
  const descripcion = payload.descripcion?.trim();

  if (!payload.course_id || !titulo || !descripcion) {
    return { ok: false, error: "Completá curso, título y descripción." };
  }

  const supabase = await createClient();

  // docente_id y nivel son NOT NULL en la tabla y el trigger
  // situaciones_before_insert los pisa siempre con el valor correcto
  // (auth.uid() y el nivel real del curso) — se busca el nivel acá solo
  // para que el insert quede tipado sin placeholders falsos.
  const { data: curso } = await supabase
    .from("courses")
    .select("nivel")
    .eq("id", payload.course_id)
    .single();

  if (!curso) {
    return { ok: false, error: "El curso elegido no es válido." };
  }

  const { error } = await supabase.from("situaciones").insert({
    course_id: payload.course_id,
    encounter_id: payload.encounter_id,
    titulo,
    descripcion,
    docente_id: profile.id,
    nivel: curso.nivel,
  });

  if (error) {
    return { ok: false, error: "No se pudo enviar el reporte. Probá de nuevo." };
  }

  revalidatePath("/docente/reportar");
  return { ok: true };
}
