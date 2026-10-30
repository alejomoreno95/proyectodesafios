import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ReportarSituacionClient,
  type Curso,
  type EncuentroOpcion,
  type SolicitudFila,
} from "./ReportarSituacionClient";

const SELECT_SITUACION =
  "id, tipo, persona_nombre, descripcion, estado, created_at, situacion_cursos(courses(display_name))";

const SELECT_CAPELLAN =
  "id, tipo, persona_nombre, motivo, estado, created_at, solicitud_capellan_cursos(courses(display_name))";

export default async function ReportarSituacionPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let cursosQuery = supabase
    .from("courses")
    .select("id, nivel, display_name, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (profile.alcance !== "Total") {
    cursosQuery = cursosQuery.eq("nivel", profile.alcance);
  }

  const [{ data: cursos }, { data: encuentros }, { data: situaciones }, { data: solicitudesCapellan }] =
    await Promise.all([
      cursosQuery,
      supabase
        .from("encounters")
        .select("id, course_id, fecha_encuentro, courses(display_name)")
        .eq("user_id", profile.id)
        .is("deleted_at", null)
        .order("fecha_encuentro", { ascending: false }),
      supabase
        .from("situaciones")
        .select(SELECT_SITUACION)
        .eq("docente_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("solicitudes_capellan")
        .select(SELECT_CAPELLAN)
        .eq("docente_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

  const propiasEoe: SolicitudFila[] = (situaciones ?? []).map((s) => ({
    id: s.id,
    destinatario: "eoe" as const,
    tipo: s.tipo as "individual" | "grupal",
    persona_nombre: s.persona_nombre,
    motivo: null,
    estado: s.estado,
    created_at: s.created_at,
    cursos: (s.situacion_cursos ?? [])
      .map((sc) => sc.courses?.display_name)
      .filter((n): n is string => Boolean(n)),
  }));

  const propiasCapellan: SolicitudFila[] = (solicitudesCapellan ?? []).map((s) => ({
    id: s.id,
    destinatario: "capellan" as const,
    tipo: s.tipo as "individual" | "grupal",
    persona_nombre: s.persona_nombre,
    motivo: s.motivo as "confesion" | "charla",
    estado: s.estado,
    created_at: s.created_at,
    cursos: (s.solicitud_capellan_cursos ?? [])
      .map((sc) => sc.courses?.display_name)
      .filter((n): n is string => Boolean(n)),
  }));

  const solicitudes = [...propiasEoe, ...propiasCapellan].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  return (
    <ReportarSituacionClient
      cursos={(cursos ?? []) as Curso[]}
      encuentros={(encuentros ?? []) as EncuentroOpcion[]}
      solicitudesIniciales={solicitudes}
      alcance={profile.alcance}
    />
  );
}
