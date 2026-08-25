"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type NuevoEncuentroPayload = {
  fecha_encuentro: string;
  course_id: string;
  axis_id: string;
  docente: string;
  contenidos: string;
  actividades: string;
  product_id: string;
  compartido_familia: boolean;
};

export type CrearEncuentroResult = { ok: true } | { ok: false; error: string };

/**
 * Inserts one encounter row for the signed-in docente. Client-side wizard
 * validation is a UX convenience only — every field is re-checked here,
 * since this is the boundary RLS actually enforces (encounters_insert_own
 * requires user_id = auth.uid()).
 */
export async function crearEncuentro(
  payload: NuevoEncuentroPayload,
): Promise<CrearEncuentroResult> {
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
  const { error } = await supabase.from("encounters").insert({
    fecha_encuentro: fecha,
    course_id: payload.course_id,
    axis_id: payload.axis_id,
    docente,
    contenidos,
    actividades,
    product_id: payload.product_id,
    compartido_familia: payload.compartido_familia,
    user_id: profile.id,
  });

  if (error) {
    return {
      ok: false,
      error: "No se pudo guardar el encuentro. Probá de nuevo en un momento.",
    };
  }

  revalidatePath("/docente");
  revalidatePath("/docente/mis-encuentros");

  return { ok: true };
}
