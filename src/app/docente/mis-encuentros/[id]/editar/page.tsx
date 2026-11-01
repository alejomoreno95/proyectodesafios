import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditarEncuentroForm } from "./EditarEncuentroForm";

export default async function EditarEncuentroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  // Sin filtrar por active ni por alcance todavía: un encuentro viejo
  // puede apuntar a un curso que después se desactivó o quedó fuera del
  // alcance actual de la cuenta, y el select tiene que poder seguir
  // mostrando esa opción seleccionada (se agrega abajo si hace falta).
  let cursosQuery = supabase
    .from("courses")
    .select("id, nivel, display_name, sort_order")
    .order("sort_order");
  if (profile.alcance !== "Total") {
    cursosQuery = cursosQuery.eq("nivel", profile.alcance);
  }

  const [{ data: encuentro }, { data: cursos }, { data: ejes }, { data: productos }] =
    await Promise.all([
      supabase
        .from("encounters")
        .select(
          "id, fecha_encuentro, course_id, axis_id, docente, contenidos, actividades, product_id, compartido_familia, deleted_at",
        )
        .eq("id", id)
        .eq("user_id", profile.id)
        .is("deleted_at", null)
        .maybeSingle(),
      cursosQuery,
      supabase.from("axes").select("id, numero, nombre").order("sort_order"),
      supabase
        .from("products")
        .select("id, nombre, sort_order")
        .order("sort_order"),
    ]);

  if (!encuentro) {
    notFound();
  }

  let cursosDisponibles = cursos ?? [];
  if (!cursosDisponibles.some((c) => c.id === encuentro.course_id)) {
    const { data: cursoActual } = await supabase
      .from("courses")
      .select("id, nivel, display_name, sort_order")
      .eq("id", encuentro.course_id)
      .maybeSingle();
    if (cursoActual) cursosDisponibles = [...cursosDisponibles, cursoActual];
  }

  return (
    <EditarEncuentroForm
      encuentro={encuentro}
      cursos={cursosDisponibles}
      ejes={ejes ?? []}
      productos={productos ?? []}
    />
  );
}
