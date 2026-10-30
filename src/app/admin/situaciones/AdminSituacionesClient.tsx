import Link from "next/link";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatDate } from "@/lib/format";

export type SituacionFila = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: "individual" | "grupal";
  persona_nombre: string | null;
  estado: string;
  nivel: string | null;
  created_at: string;
  responsable_id: string | null;
  situacion_cursos: { courses: { display_name: string; nivel: string } | null }[];
  docente: { full_name: string; cargo: string } | null;
  responsable: { full_name: string } | null;
};

function cursosLabel(s: SituacionFila): string {
  const nombres = s.situacion_cursos.map((sc) => sc.courses?.display_name).filter(Boolean);
  return nombres.length > 0 ? nombres.join(", ") : "—";
}

export type Nota = {
  id: string;
  nota: string;
  created_at: string;
  autor: { full_name: string } | null;
};

const ESTADOS = ["Pendiente", "En seguimiento", "Cerrada"];

function hrefCon(estadoFiltro: string, id?: string): string {
  const params = new URLSearchParams();
  if (estadoFiltro) params.set("estado", estadoFiltro);
  if (id) params.set("id", id);
  const qs = params.toString();
  return `/admin/situaciones${qs ? `?${qs}` : ""}`;
}

// Vista exclusivamente de lectura: un directivo con ver_situaciones_eoe
// puede consultar, nunca modificar — asumir, cambiar estado y agregar
// notas son acciones del EOE en /eoe.
export function AdminSituacionesClient({
  situaciones,
  seleccionadaId,
  notas,
  estadoFiltro,
  puedeVerNotas,
}: {
  situaciones: SituacionFila[];
  seleccionadaId: string | null;
  notas: Nota[];
  estadoFiltro: string;
  puedeVerNotas: boolean;
}) {
  const seleccionada = situaciones.find((s) => s.id === seleccionadaId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink md:text-[26px]">
            Situaciones
          </h1>
          <span className="text-sm text-ink-faint">
            {situaciones.length} resultado{situaciones.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={hrefCon("")}
            className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={
              !estadoFiltro
                ? { background: "var(--brand-tint)", color: "var(--brand-deep)" }
                : { color: "var(--ink-faint)" }
            }
          >
            Todas
          </Link>
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={hrefCon(e)}
              className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
              style={
                estadoFiltro === e
                  ? { background: "var(--brand-tint)", color: "var(--brand-deep)" }
                  : { color: "var(--ink-faint)" }
              }
            >
              {e}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          {situaciones.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">
              No hay situaciones que coincidan con este filtro.
            </p>
          ) : (
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr>
                  {["Título", "Curso(s)", "Responsable", "Estado"].map((h) => (
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
                {situaciones.map((s) => {
                  const activo = seleccionada?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      style={activo ? { background: "var(--brand-tint)" } : undefined}
                    >
                      <td className="border-t border-line px-3 py-3 text-[13.5px] font-semibold">
                        <Link href={hrefCon(estadoFiltro, s.id)} className="block">
                          {s.titulo}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefCon(estadoFiltro, s.id)} className="block">
                          {cursosLabel(s)}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefCon(estadoFiltro, s.id)} className="block">
                          {s.responsable?.full_name ?? "Sin asignar"}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3">
                        <Link href={hrefCon(estadoFiltro, s.id)} className="block">
                          <EstadoBadge estado={s.estado} />
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
          {!seleccionada ? (
            <p className="text-sm text-ink-soft">
              Elegí una situación de la lista para ver el detalle.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-ink-faint">
                    {cursosLabel(seleccionada)} · {seleccionada.nivel ?? "—"}
                  </span>
                  <h2 className="mt-0.5 font-display text-xl font-semibold text-ink">
                    {seleccionada.titulo}
                  </h2>
                </div>
                <EstadoBadge estado={seleccionada.estado} />
              </div>

              <div className="flex flex-col gap-1 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-ink-faint">Reportada por</span>
                  <span className="font-semibold text-ink">
                    {seleccionada.docente?.full_name ?? "—"}
                    {seleccionada.docente?.cargo ? ` (${seleccionada.docente.cargo})` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint">Fecha</span>
                  <span className="font-mono font-semibold text-ink">
                    {formatDate(seleccionada.created_at.slice(0, 10))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint">Tipo</span>
                  <span className="font-semibold text-ink">
                    {seleccionada.tipo === "individual"
                      ? seleccionada.persona_nombre ?? "Individual"
                      : "Grupal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint">Responsable</span>
                  <span className="font-semibold text-ink">
                    {seleccionada.responsable?.full_name ?? "Sin asignar"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-line" />

              {seleccionada.descripcion && (
                <div>
                  <span className="text-[13px] text-ink-faint">Descripción</span>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
                    {seleccionada.descripcion}
                  </p>
                </div>
              )}

              <div className="h-px bg-line" />

              <div className="flex flex-col gap-3">
                <span className="text-[13px] text-ink-faint">
                  Notas internas {puedeVerNotas ? `(${notas.length})` : ""}
                </span>
                {!puedeVerNotas ? (
                  <p className="rounded-xl bg-neutral-chip px-3.5 py-2.5 text-[12.5px] text-neutral-ink">
                    Tu cuenta no tiene habilitada la consulta de notas
                    internas del EOE.
                  </p>
                ) : notas.length === 0 ? (
                  <p className="text-[12.5px] text-ink-faint">
                    Todavía no hay notas en esta situación.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {notas.map((n) => (
                      <div key={n.id} className="rounded-xl bg-bg px-3.5 py-2.5">
                        <p className="text-[13px] leading-relaxed text-ink">
                          {n.nota}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-faint">
                          {n.autor?.full_name ?? "—"} ·{" "}
                          {formatDate(n.created_at.slice(0, 10))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
