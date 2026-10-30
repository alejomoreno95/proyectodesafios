import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MisEncuentrosClient, type Encuentro } from "./MisEncuentrosClient";

const SELECT_ENCUENTRO =
  "id, fecha_encuentro, contenidos, actividades, docente, compartido_familia, course_id, axis_id, product_id, deleted_at, courses(display_name), axes(numero, nombre), products(nombre)";

export default async function MisEncuentrosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const tab = sp.tab === "papelera" ? "papelera" : "activos";

  const supabase = await createClient();

  let query = supabase
    .from("encounters")
    .select(SELECT_ENCUENTRO)
    .eq("user_id", profile.id)
    .order("fecha_encuentro", { ascending: false })
    .order("created_at", { ascending: false });

  query =
    tab === "papelera"
      ? query.not("deleted_at", "is", null)
      : query.is("deleted_at", null);

  const { data: encuentros } = await query;

  return (
    <MisEncuentrosClient
      encuentros={(encuentros ?? []) as Encuentro[]}
      tab={tab}
    />
  );
}
