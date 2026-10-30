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
      // Sin filtrar por active: un encuentro viejo puede apuntar a un curso
      // o producto que después se desactivó, y el select tiene que poder
      // seguir mostrando esa opción seleccionada.
      supabase
        .from("courses")
        .select("id, nivel, display_name, sort_order")
        .order("sort_order"),
      supabase.from("axes").select("id, numero, nombre").order("sort_order"),
      supabase
        .from("products")
        .select("id, nombre, sort_order")
        .order("sort_order"),
    ]);

  if (!encuentro) {
    notFound();
  }

  return (
    <EditarEncuentroForm
      encuentro={encuentro}
      cursos={cursos ?? []}
      ejes={ejes ?? []}
      productos={productos ?? []}
    />
  );
}
