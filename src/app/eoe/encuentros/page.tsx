import { Fragment } from "react";
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
          <table className="w-full min-w-0 border-collapse md:min-w-[560px]">
            <thead className="hidden md:table-header-group">
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
                <Fragment key={e.id}>
                  <tr className="hidden md:table-row">
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
                  <tr className="border-t border-line md:hidden">
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[14px] font-semibold text-ink">{e.courses?.display_name}</span>
                          <span className="font-mono text-[12px] text-ink-faint">{formatDate(e.fecha_encuentro)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                          <span>{e.docente}</span>
                          {e.axes && <EjeChip numero={e.axes.numero} nombre={e.axes.nombre} size="sm" />}
                        </div>
                        <span className="text-[12px] text-ink-faint">{e.products?.nombre}</span>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
