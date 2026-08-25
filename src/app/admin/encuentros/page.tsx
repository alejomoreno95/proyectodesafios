import Link from "next/link";
import { requireDirectivo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EjeChip } from "@/components/EjeChip";
import { formatDate } from "@/lib/format";
import {
  aQueryString,
  consultaEncuentros,
  hayFiltrosActivos,
  leerFiltros,
  sinFiltro,
  type FiltrosEncuentros,
} from "@/lib/admin-encuentros";

export default async function EncuentrosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDirectivo();
  const sp = await searchParams;
  const filtros = leerFiltros(sp);
  const idSeleccionado = typeof sp.id === "string" ? sp.id : "";

  const supabase = await createClient();

  const [{ data: encuentros }, { data: cursos }, { data: ejes }, { data: productos }, { data: docentesRaw }] =
    await Promise.all([
      consultaEncuentros(supabase, filtros),
      supabase
        .from("courses")
        .select("id, nivel, display_name, sort_order")
        .order("sort_order"),
      supabase.from("axes").select("id, numero, nombre").order("sort_order"),
      supabase
        .from("products")
        .select("id, nombre, sort_order")
        .order("sort_order"),
      supabase.from("encounters").select("docente"),
    ]);

  const filas = encuentros ?? [];
  const docentes = Array.from(
    new Set((docentesRaw ?? []).map((d) => d.docente)),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const seleccionado =
    filas.find((e) => e.id === idSeleccionado) ?? filas[0] ?? null;

  function hrefDetalle(id: string): string {
    const qs = aQueryString(filtros);
    return `/admin/encuentros${qs}${qs ? "&" : "?"}id=${id}`;
  }

  const CHIP_LABELS: Record<string, (f: FiltrosEncuentros) => string | null> = {
    nivel: (f) => (f.nivel ? `Nivel: ${f.nivel}` : null),
    cursoId: (f) =>
      f.cursoId
        ? `Curso: ${cursos?.find((c) => c.id === f.cursoId)?.display_name ?? f.cursoId}`
        : null,
    docente: (f) => (f.docente ? `Docente: ${f.docente}` : null),
    ejeId: (f) =>
      f.ejeId
        ? `Eje: ${ejes?.find((e) => e.id === f.ejeId)?.nombre ?? f.ejeId}`
        : null,
    productoId: (f) =>
      f.productoId
        ? `Producto: ${productos?.find((p) => p.id === f.productoId)?.nombre ?? f.productoId}`
        : null,
    familia: (f) =>
      f.familia ? `Familias: ${f.familia === "si" ? "Sí" : "No"}` : null,
    desde: (f) => (f.desde ? `Desde: ${formatDate(f.desde)}` : null),
    hasta: (f) => (f.hasta ? `Hasta: ${formatDate(f.hasta)}` : null),
    q: (f) => (f.q ? `“${f.q}”` : null),
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink md:text-[26px]">
            Encuentros
          </h1>
          <span className="text-sm text-ink-faint">
            {filas.length} resultado{filas.length === 1 ? "" : "s"}
          </span>
        </div>
        <a
          href={`/admin/encuentros/export${aQueryString(filtros)}`}
          className="flex items-center gap-2 rounded-full bg-brand px-[18px] py-[9px] text-[13.5px] font-semibold text-white"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v13m0 0l-4-4m4 4l4-4" />
            <path d="M4 19h16" />
          </svg>
          Exportar CSV
        </a>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={filtros.q}
            placeholder="Buscar en contenidos, actividades o docente…"
            className="min-w-[220px] flex-1 rounded-full border border-line bg-bg px-4 py-2.5 text-[13.5px] text-ink"
          />
          <select
            name="nivel"
            defaultValue={filtros.nivel}
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <option value="">Nivel: todos</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
          </select>
          <select
            name="curso"
            defaultValue={filtros.cursoId}
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <option value="">Curso: todos</option>
            {cursos?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
          <select
            name="docente"
            defaultValue={filtros.docente}
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <option value="">Docente: todos</option>
            {docentes.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            name="eje"
            defaultValue={filtros.ejeId}
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <option value="">Eje: todos</option>
            {ejes?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
          <select
            name="producto"
            defaultValue={filtros.productoId}
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <option value="">Producto: todos</option>
            {productos?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <select
            name="familia"
            defaultValue={filtros.familia}
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <option value="">Familias: todas</option>
            <option value="si">Compartido</option>
            <option value="no">No compartido</option>
          </select>
          <input
            type="date"
            name="desde"
            defaultValue={filtros.desde}
            aria-label="Desde"
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          />
          <input
            type="date"
            name="hasta"
            defaultValue={filtros.hasta}
            aria-label="Hasta"
            className="rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink-soft"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-deep px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            Filtrar
          </button>
        </div>

        {hayFiltrosActivos(filtros) && (
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(CHIP_LABELS) as (keyof FiltrosEncuentros)[]).map(
              (key) => {
                const label = CHIP_LABELS[key](filtros);
                if (!label) return null;
                return (
                  <Link
                    key={key}
                    href={`/admin/encuentros${sinFiltro(filtros, key)}`}
                    className="flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1.5 text-xs font-semibold text-brand-deep"
                  >
                    {label}
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </Link>
                );
              },
            )}
            <Link
              href="/admin/encuentros"
              className="text-xs font-semibold text-ink-faint underline"
            >
              Limpiar todo
            </Link>
          </div>
        )}
      </form>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          {filas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">
              No hay encuentros que coincidan con estos filtros.
            </p>
          ) : (
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  {["Fecha", "Curso", "Docente", "Eje", "Producto", "Fam."].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-ink-faint"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filas.map((e) => {
                  const activo = seleccionado?.id === e.id;
                  return (
                    <tr key={e.id} style={activo ? { background: "var(--brand-tint)" } : undefined}>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefDetalle(e.id)} className="block font-mono">
                          {formatDate(e.fecha_encuentro)}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px] font-semibold">
                        <Link href={hrefDetalle(e.id)} className="block">
                          {e.courses?.display_name}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefDetalle(e.id)} className="block">
                          {e.docente}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefDetalle(e.id)} className="block">
                          {e.axes && (
                            <EjeChip
                              numero={e.axes.numero}
                              nombre={e.axes.nombre}
                              size="sm"
                            />
                          )}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefDetalle(e.id)} className="block">
                          {e.products?.nombre}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-center">
                        <Link href={hrefDetalle(e.id)} className="block">
                          <span
                            style={{
                              color: e.compartido_familia
                                ? "var(--good)"
                                : "var(--ink-faint)",
                            }}
                          >
                            ●
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 md:p-[26px]">
          {seleccionado ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-ink-faint">
                    ENCUENTRO
                  </span>
                  <h2 className="mt-0.5 font-display text-xl font-semibold text-ink">
                    {seleccionado.courses?.display_name}
                  </h2>
                </div>
                {seleccionado.axes && (
                  <EjeChip
                    numero={seleccionado.axes.numero}
                    nombre={seleccionado.axes.nombre}
                  />
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-faint">Fecha</span>
                  <span className="font-mono font-semibold text-ink">
                    {formatDate(seleccionado.fecha_encuentro)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-faint">Docente</span>
                  <span className="font-semibold text-ink">
                    {seleccionado.docente}
                  </span>
                </div>
                <div className="h-px bg-line" />
                <div>
                  <span className="text-[13px] text-ink-faint">
                    Contenidos
                  </span>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">
                    {seleccionado.contenidos}
                  </p>
                </div>
                <div>
                  <span className="text-[13px] text-ink-faint">
                    Actividades
                  </span>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">
                    {seleccionado.actividades}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-faint">Producto</span>
                  <span className="font-semibold text-ink">
                    {seleccionado.products?.nombre}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-faint">
                    Compartido con familias
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={
                      seleccionado.compartido_familia
                        ? { background: "var(--good-tint)", color: "#0a6e0a" }
                        : {
                            background: "var(--neutral-chip)",
                            color: "var(--neutral-ink)",
                          }
                    }
                  >
                    {seleccionado.compartido_familia ? "Sí" : "No"}
                  </span>
                </div>
              </div>

              <span className="text-[11.5px] text-ink-faint">
                Registrado el {formatDate(seleccionado.created_at.slice(0, 10))}
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Elegí un encuentro de la lista para ver el detalle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
