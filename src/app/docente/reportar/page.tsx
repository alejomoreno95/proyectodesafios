import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ReportarSituacionClient,
  type Curso,
  type EncuentroOpcion,
  type Situacion,
} from "./ReportarSituacionClient";

export default async function ReportarSituacionPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: cursos }, { data: encuentros }, { data: situaciones }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, nivel, display_name, sort_order")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("encounters")
        .select("id, course_id, fecha_encuentro, courses(display_name)")
        .eq("user_id", profile.id)
        .is("deleted_at", null)
        .order("fecha_encuentro", { ascending: false }),
      supabase
        .from("situaciones")
        .select(
          "id, titulo, descripcion, estado, created_at, course_id, courses(display_name)",
        )
        .eq("docente_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <ReportarSituacionClient
      cursos={(cursos ?? []) as Curso[]}
      encuentros={(encuentros ?? []) as EncuentroOpcion[]}
      situacionesIniciales={(situaciones ?? []) as Situacion[]}
    />
  );
}
