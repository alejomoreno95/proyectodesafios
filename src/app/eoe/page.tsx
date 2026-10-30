import { requireEOE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  SituacionesClient,
  type Nota,
  type SituacionFila,
} from "./SituacionesClient";

const SELECT_SITUACION =
  "id, titulo, descripcion, tipo, persona_nombre, estado, nivel, created_at, encounter_id, responsable_id, situacion_cursos(courses(display_name, nivel)), encounters(fecha_encuentro, courses(display_name)), docente:profiles!situaciones_docente_id_fkey(full_name, cargo), responsable:profiles!situaciones_responsable_id_fkey(full_name)";

const SELECT_NOTA =
  "id, nota, created_at, autor:profiles!situacion_notas_autor_id_fkey(full_name)";

export default async function EoePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireEOE();
  const sp = await searchParams;
  const estadoFiltro = typeof sp.estado === "string" ? sp.estado : "";
  const idSeleccionado = typeof sp.id === "string" ? sp.id : "";

  const supabase = await createClient();

  let query = supabase
    .from("situaciones")
    .select(SELECT_SITUACION)
    .order("created_at", { ascending: false });

  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data: situacionesRaw } = await query;
  const filas = (situacionesRaw ?? []) as unknown as SituacionFila[];

  const seleccionada =
    filas.find((s) => s.id === idSeleccionado) ?? filas[0] ?? null;

  let notas: Nota[] = [];
  if (seleccionada) {
    const { data: notasRaw } = await supabase
      .from("situacion_notas")
      .select(SELECT_NOTA)
      .eq("situacion_id", seleccionada.id)
      .order("created_at", { ascending: false });
    notas = (notasRaw ?? []) as unknown as Nota[];
  }

  return (
    <SituacionesClient
      situaciones={filas}
      seleccionadaId={seleccionada?.id ?? null}
      notas={notas}
      estadoFiltro={estadoFiltro}
    />
  );
}
