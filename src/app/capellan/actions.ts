"use server";

import { revalidatePath } from "next/cache";
import { requireCapellan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AccionResult = { ok: true } | { ok: false; error: string };

export type EstadoSolicitudCapellan = "Pendiente" | "En atención" | "Finalizado";

/**
 * Cambia el estado de una solicitud al Capellán. requireCapellan() no tiene
 * bypass de administrador a propósito — y la RLS de solicitudes_capellan
 * tampoco, así que ni siquiera un bug acá podría abrir esto a otro rol.
 */
export async function cambiarEstadoSolicitudCapellan(
  solicitudId: string,
  estado: EstadoSolicitudCapellan,
): Promise<AccionResult> {
  await requireCapellan();
  const supabase = await createClient();

  const { error } = await supabase
    .from("solicitudes_capellan")
    .update({ estado })
    .eq("id", solicitudId);

  if (error) return { ok: false, error: "No se pudo cambiar el estado." };
  revalidatePath("/capellan");
  return { ok: true };
}
