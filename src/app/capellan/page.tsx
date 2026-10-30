import { requireCapellan } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CapellanClient, type SolicitudCapellanFila } from "./CapellanClient";

const SELECT_SOLICITUD =
  "id, tipo, persona_nombre, motivo, descripcion, estado, created_at, solicitud_capellan_cursos(courses(display_name)), encounters(fecha_encuentro, courses(display_name)), docente:profiles!solicitudes_capellan_docente_id_fkey(full_name, cargo)";

export default async function CapellanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCapellan();
  const sp = await searchParams;
  const estadoFiltro = typeof sp.estado === "string" ? sp.estado : "";

  const supabase = await createClient();

  let query = supabase
    .from("solicitudes_capellan")
    .select(SELECT_SOLICITUD)
    .order("created_at", { ascending: false });

  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data } = await query;

  return (
    <CapellanClient
      solicitudes={(data ?? []) as unknown as SolicitudCapellanFila[]}
      estadoFiltro={estadoFiltro}
    />
  );
}
