import { requireEOE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EjeChip } from "@/components/EjeChip";
import { formatDate } from "@/lib/format";

// Solo lectura: la RLS (encounters_select_own_or_directivo) ya limita el
// resultado al alcance de quien consulta — ninguna fila fuera de nivel
// autorizado llega acá, sin necesidad de filtrar nada del lado del cliente.
export default async function EoeEncuentrosPage() {
  await requireEOE();
  const supabase = await createClient();

  const { data: encuentros } = await supabase
    .from("encounters")
    .select(
      "id, fecha_encuentro, docente, contenidos, course_id, courses(display_name, nivel), axes(numero, nombre), products(nombre)",
    )
    .order("fecha_encuentro", { ascending: false })
    .limit(200);

  const filas = encuentros ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Encuentros
        </h1>
        <span className="text-sm text-ink-faint">
          {filas.length} dentro de tu alcance
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        {filas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-soft">
            Todavía no hay encuentros registrados en tu alcance.
          </p>
        ) : (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                {["Fecha", "Curso", "Docente", "Eje", "Producto"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-ink-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((e) => (
                <tr key={e.id}>
                  <td className="border-t border-line px-3 py-3 font-mono text-[13px]">
                    {formatDate(e.fecha_encuentro)}
                  </td>
                  <td className="border-t border-line px-3 py-3 text-[13.5px] font-semibold">
                    {e.courses?.display_name}
                  </td>
                  <td className="border-t border-line px-3 py-3 text-[13.5px]">
                    {e.docente}
                  </td>
                  <td className="border-t border-line px-3 py-3">
                    {e.axes && (
                      <EjeChip numero={e.axes.numero} nombre={e.axes.nombre} size="sm" />
                    )}
                  </td>
                  <td className="border-t border-line px-3 py-3 text-[13.5px]">
                    {e.products?.nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
