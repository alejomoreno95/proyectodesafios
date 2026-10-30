"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EditarEncuentroPayload = {
  fecha_encuentro: string;
  course_id: string;
  axis_id: string;
  docente: string;
  contenidos: string;
  actividades: string;
  product_id: string;
  compartido_familia: boolean;
};

export type AccionResult = { ok: true } | { ok: false; error: string };

function revalidarListados(id?: string) {
  revalidatePath("/docente");
  revalidatePath("/docente/mis-encuentros");
  if (id) revalidatePath(`/docente/mis-encuentros/${id}/editar`);
}

/**
 * Guarda los cambios de un encuentro propio. RLS (encounters_update_own)
 * ya exige user_id = auth.uid(); el .eq("user_id", ...) de acá es defensa
 * en profundidad, no el límite real de seguridad.
 */
export async function actualizarEncuentro(
  id: string,
  payload: EditarEncuentroPayload,
): Promise<AccionResult> {
  const profile = await requireProfile();

  const fecha = payload.fecha_encuentro?.trim();
  const docente = payload.docente?.trim();
  const contenidos = payload.contenidos?.trim();
  const actividades = payload.actividades?.trim();

  if (
    !fecha ||
    !payload.course_id ||
    !payload.axis_id ||
    !docente ||
    !contenidos ||
    !actividades ||
    !payload.product_id ||
    typeof payload.compartido_familia !== "boolean"
  ) {
    return { ok: false, error: "Faltan campos por completar." };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (fecha > today) {
    return { ok: false, error: "La fecha del encuentro no puede ser futura." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update({
      fecha_encuentro: fecha,
      course_id: payload.course_id,
      axis_id: payload.axis_id,
      docente,
      contenidos,
      actividades,
      product_id: payload.product_id,
      compartido_familia: payload.compartido_familia,
    })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    return {
      ok: false,
      error: "No se pudo guardar el encuentro. Probá de nuevo en un momento.",
    };
  }

  revalidarListados(id);
  return { ok: true };
}

/**
 * Elimina (soft-delete) un encuentro propio — lo manda a la papelera. Un
 * trigger en la base (encounters_before_update) registra quién y cuándo.
 * Si el encuentro tenía una situación vinculada, la situación conserva la
 * referencia: no se borra nada ahí.
 */
export async function eliminarEncuentro(id: string): Promise<AccionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    return { ok: false, error: "No se pudo eliminar el encuentro. Probá de nuevo." };
  }

  revalidarListados();
  return { ok: true };
}

/** Saca un encuentro propio de la papelera. */
export async function restaurarEncuentro(id: string): Promise<AccionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    return { ok: false, error: "No se pudo restaurar el encuentro. Probá de nuevo." };
  }

  revalidarListados();
  return { ok: true };
}
