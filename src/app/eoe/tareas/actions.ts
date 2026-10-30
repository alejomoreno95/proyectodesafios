"use server";

import { revalidatePath } from "next/cache";
import { requireEOE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AccionResult = { ok: true } | { ok: false; error: string };

export type CrearTareaPayload = {
  nivel: "Primaria" | "Secundaria";
  course_id: string | null;
  titulo: string;
  descripcion: string;
};

export async function crearTarea(payload: CrearTareaPayload): Promise<AccionResult> {
  const profile = await requireEOE();
  const titulo = payload.titulo?.trim();

  if (!payload.nivel || !titulo) {
    return { ok: false, error: "El nivel y el título son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tareas_eoe").insert({
    nivel: payload.nivel,
    course_id: payload.course_id,
    titulo,
    descripcion: payload.descripcion?.trim() || null,
    autor_id: profile.id,
  });

  if (error) {
    return { ok: false, error: "No se pudo crear la tarea. Probá de nuevo." };
  }

  revalidatePath("/eoe/tareas");
  return { ok: true };
}

export async function cambiarEstadoTarea(
  id: string,
  estado: "Pendiente" | "Hecha",
): Promise<AccionResult> {
  await requireEOE();
  const supabase = await createClient();
  const { error } = await supabase.from("tareas_eoe").update({ estado }).eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudo actualizar la tarea." };
  }

  revalidatePath("/eoe/tareas");
  return { ok: true };
}
