import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EncuentroWizard } from "./EncuentroWizard";

export default async function NuevoEncuentroPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: cursos }, { data: ejes }, { data: productos }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, nivel, display_name, sort_order")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("axes")
        .select("id, numero, nombre")
        .order("sort_order"),
      supabase
        .from("products")
        .select("id, nombre, sort_order")
        .eq("active", true)
        .order("sort_order"),
    ]);

  return (
    <EncuentroWizard
      cursos={cursos ?? []}
      ejes={ejes ?? []}
      productos={productos ?? []}
      nombreDocente={profile.full_name}
    />
  );
}
