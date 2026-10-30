import { requireEOE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TareasClient, type Curso, type Tarea } from "./TareasClient";

export default async function TareasPage() {
  const profile = await requireEOE();
  const supabase = await createClient();

  const [{ data: tareas }, { data: cursos }] = await Promise.all([
    supabase
      .from("tareas_eoe")
      .select("id, nivel, course_id, titulo, descripcion, estado, created_at, courses(display_name)")
      .order("estado", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("courses")
      .select("id, nivel, display_name, sort_order")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const nivelesDisponibles =
    profile.alcance === "Total" ? ["Primaria", "Secundaria"] : [profile.alcance];

  return (
    <TareasClient
      tareasIniciales={(tareas ?? []) as Tarea[]}
      cursos={(cursos ?? []) as Curso[]}
      nivelesDisponibles={nivelesDisponibles}
    />
  );
}
