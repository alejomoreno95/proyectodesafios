import { createClient } from "@/lib/supabase/server";

export type NotificacionFila = {
  id: string;
  situacion_id: string | null;
  solicitud_capellan_id: string | null;
  tipo: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
};

/**
 * Últimas notificaciones del usuario actual, para la campanita del header.
 * La RLS (notificaciones_select_own) ya limita esto a destinatario_id =
 * auth.uid(); el filtro acá es solo para no repetirlo en cada layout. Los
 * textos ya vienen genéricos desde la base (sin nombres, descripciones ni
 * motivos) — acá no hay nada más que filtrar por privacidad.
 */
export async function obtenerNotificaciones(
  profileId: string,
): Promise<NotificacionFila[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notificaciones")
    .select("id, situacion_id, solicitud_capellan_id, tipo, mensaje, leido, created_at")
    .eq("destinatario_id", profileId)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}
