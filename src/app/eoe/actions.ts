"use server";

import { revalidatePath } from "next/cache";
import { requireEOE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AccionResult = { ok: true } | { ok: false; error: string };

export type EstadoSituacion = "Pendiente" | "En seguimiento" | "Cerrada";

/** Asume una situación — la responsable pasa a ser quien llama. */
export async function asumirSituacion(situacionId: string): Promise<AccionResult> {
  const profile = await requireEOE();
  const supabase = await createClient();
  const { error } = await supabase
    .from("situaciones")
    .update({ responsable_id: profile.id })
    .eq("id", situacionId);

  if (error) return { ok: false, error: "No se pudo asumir la situación." };
  revalidatePath("/eoe");
  return { ok: true };
}

export async function cambiarEstadoSituacion(
  situacionId: string,
  estado: EstadoSituacion,
): Promise<AccionResult> {
  await requireEOE();
  const supabase = await createClient();
  const { error } = await supabase
    .from("situaciones")
    .update({ estado })
    .eq("id", situacionId);

  if (error) return { ok: false, error: "No se pudo cambiar el estado." };
  revalidatePath("/eoe");
  return { ok: true };
}

export async function agregarNota(
  situacionId: string,
  nota: string,
): Promise<AccionResult> {
  const profile = await requireEOE();
  const texto = nota.trim();
  if (!texto) {
    return { ok: false, error: "Escribí algo antes de guardar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("situacion_notas").insert({
    situacion_id: situacionId,
    autor_id: profile.id,
    nota: texto,
  });

  if (error) return { ok: false, error: "No se pudo guardar la nota." };
  revalidatePath("/eoe");
  return { ok: true };
}
