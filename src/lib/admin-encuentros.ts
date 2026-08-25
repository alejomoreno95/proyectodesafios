import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type FiltrosEncuentros = {
  nivel: string;
  cursoId: string;
  docente: string;
  ejeId: string;
  productoId: string;
  familia: string; // "" | "si" | "no"
  desde: string;
  hasta: string;
  q: string;
};

const NOMBRES_PARAM: Record<keyof FiltrosEncuentros, string> = {
  nivel: "nivel",
  cursoId: "curso",
  docente: "docente",
  ejeId: "eje",
  productoId: "producto",
  familia: "familia",
  desde: "desde",
  hasta: "hasta",
  q: "q",
};

type SearchParams = Record<string, string | string[] | undefined>;

function uno(sp: SearchParams, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function leerFiltros(sp: SearchParams): FiltrosEncuentros {
  return {
    nivel: uno(sp, "nivel"),
    cursoId: uno(sp, "curso"),
    docente: uno(sp, "docente"),
    ejeId: uno(sp, "eje"),
    productoId: uno(sp, "producto"),
    familia: uno(sp, "familia"),
    desde: uno(sp, "desde"),
    hasta: uno(sp, "hasta"),
    q: uno(sp, "q"),
  };
}

export function hayFiltrosActivos(f: FiltrosEncuentros): boolean {
  return Object.values(f).some((v) => v !== "");
}

/** Builds a query string from the current filters, optionally overriding one key. */
export function aQueryString(
  f: FiltrosEncuentros,
  overrides?: Partial<Record<keyof FiltrosEncuentros, string>>,
): string {
  const combinado = { ...f, ...overrides };
  const params = new URLSearchParams();
  (Object.keys(combinado) as (keyof FiltrosEncuentros)[]).forEach((k) => {
    if (combinado[k]) params.set(NOMBRES_PARAM[k], combinado[k]);
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Same filters minus one key — used to render removable filter chips. */
export function sinFiltro(
  f: FiltrosEncuentros,
  key: keyof FiltrosEncuentros,
): string {
  return aQueryString(f, { [key]: "" });
}

const SELECT_ENCUENTRO =
  "id, fecha_encuentro, docente, contenidos, actividades, compartido_familia, created_at, course_id, axis_id, product_id, courses!inner(display_name, nivel), axes(numero, nombre), products(nombre)";

export function consultaEncuentros(
  supabase: SupabaseClient<Database>,
  filtros: FiltrosEncuentros,
) {
  let query = supabase
    .from("encounters")
    .select(SELECT_ENCUENTRO)
    .order("fecha_encuentro", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtros.nivel) query = query.eq("courses.nivel", filtros.nivel);
  if (filtros.cursoId) query = query.eq("course_id", filtros.cursoId);
  if (filtros.ejeId) query = query.eq("axis_id", filtros.ejeId);
  if (filtros.productoId) query = query.eq("product_id", filtros.productoId);
  if (filtros.docente) query = query.eq("docente", filtros.docente);
  if (filtros.familia === "si") query = query.eq("compartido_familia", true);
  if (filtros.familia === "no") query = query.eq("compartido_familia", false);
  if (filtros.desde) query = query.gte("fecha_encuentro", filtros.desde);
  if (filtros.hasta) query = query.lte("fecha_encuentro", filtros.hasta);
  if (filtros.q) {
    const term = filtros.q.replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `docente.ilike.%${term}%,contenidos.ilike.%${term}%,actividades.ilike.%${term}%`,
      );
    }
  }

  return query;
}
