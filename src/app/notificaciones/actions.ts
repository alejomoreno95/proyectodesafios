"use server";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: true } | { ok: false; error: string };

/**
 * Marca como leída una notificación propia. La RLS (notificaciones_update_own)
 * ya impide marcar notificaciones de otra persona — no hace falta
 * verificarlo acá.
 */
export async function marcarLeida(id: string): Promise<Resultado> {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notificaciones")
    .update({ leido: true })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo marcar como leída." };
  return { ok: true };
}

/** Marca como leídas todas las notificaciones pendientes del usuario actual. */
export async function marcarTodasLeidas(): Promise<Resultado> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notificaciones")
    .update({ leido: true })
    .eq("destinatario_id", profile.id)
    .eq("leido", false);

  if (error) return { ok: false, error: "No se pudieron marcar las notificaciones." };
  return { ok: true };
}
