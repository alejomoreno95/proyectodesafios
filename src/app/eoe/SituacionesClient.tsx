"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatDate } from "@/lib/format";
import { agregarNota, asumirSituacion, cambiarEstadoSituacion, type EstadoSituacion } from "./actions";

export type SituacionFila = {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  nivel: string;
  created_at: string;
  course_id: string;
  encounter_id: string | null;
  responsable_id: string | null;
  courses: { display_name: string; nivel: string } | null;
  docente: { full_name: string } | null;
  responsable: { full_name: string } | null;
};

export type Nota = {
  id: string;
  nota: string;
  created_at: string;
  autor: { full_name: string } | null;
};

const ESTADOS: EstadoSituacion[] = ["Pendiente", "En seguimiento", "Cerrada"];

function hrefCon(estadoFiltro: string, id?: string): string {
  const params = new URLSearchParams();
  if (estadoFiltro) params.set("estado", estadoFiltro);
  if (id) params.set("id", id);
  const qs = params.toString();
  return `/eoe${qs ? `?${qs}` : ""}`;
}

function NotaForm({ situacionId }: { situacionId: string }) {
  const router = useRouter();
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar() {
    if (!nota.trim()) return;
    setEnviando(true);
    setError("");
    const resultado = await agregarNota(situacionId, nota.trim());
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setNota("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={2}
        placeholder="Agregar una nota breve sobre lo realizado o lo pendiente…"
        className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2.5 text-[13.5px] text-ink"
      />
      {error && (
        <p className="text-[12px] font-medium text-eje2-deep">{error}</p>
      )}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !nota.trim()}
        className="self-start rounded-full bg-brand-deep px-4 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
      >
        {enviando ? "Guardando…" : "Agregar nota"}
      </button>
    </div>
  );
}

function PanelDetalle({
  situacion,
  notas,
}: {
  situacion: SituacionFila;
  notas: Nota[];
}) {
  const router = useRouter();
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [asumiendo, setAsumiendo] = useState(false);
  const [error, setError] = useState("");

  async function cambiarEstado(estado: EstadoSituacion) {
    if (estado === situacion.estado) return;
    setCambiandoEstado(true);
    setError("");
    const resultado = await cambiarEstadoSituacion(situacion.id, estado);
    setCambiandoEstado(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  async function asumir() {
    setAsumiendo(true);
    setError("");
    const resultado = await asumirSituacion(situacion.id);
    setAsumiendo(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-ink-faint">
            {situacion.courses?.display_name} · {situacion.nivel}
          </span>
          <h2 className="mt-0.5 font-display text-xl font-semibold text-ink">
            {situacion.titulo}
          </h2>
        </div>
        <EstadoBadge estado={situacion.estado} />
      </div>

      <div className="flex flex-col gap-1 text-[13px]">
        <div className="flex justify-between">
          <span className="text-ink-faint">Reportada por</span>
          <span className="font-semibold text-ink">
            {situacion.docente?.full_name ?? "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-faint">Fecha</span>
          <span className="font-mono font-semibold text-ink">
            {formatDate(situacion.created_at.slice(0, 10))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-faint">Responsable</span>
          {situacion.responsable ? (
            <span className="font-semibold text-ink">
              {situacion.responsable.full_name}
            </span>
          ) : (
            <button
              type="button"
              onClick={asumir}
              disabled={asumiendo}
              className="rounded-full bg-brand px-3.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {asumiendo ? "Asumiendo…" : "Asumir"}
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-line" />

      <div>
        <span className="text-[13px] text-ink-faint">Descripción</span>
        <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
          {situacion.descripcion}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] text-ink-faint">Estado</span>
        <div className="flex gap-2">
          {ESTADOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => cambiarEstado(e)}
              disabled={cambiandoEstado}
              className="flex-1 rounded-full px-3 py-2 text-[12.5px] font-semibold disabled:opacity-50"
              style={
                situacion.estado === e
                  ? { background: "var(--brand)", color: "#fff" }
                  : {
                      background: "var(--bg)",
                      color: "var(--ink-soft)",
                      border: "1px solid var(--line)",
                    }
              }
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-eje2-tint px-3 py-2 text-[12.5px] font-medium text-eje2-deep">
          {error}
        </p>
      )}

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-3">
        <span className="text-[13px] text-ink-faint">
          Notas internas ({notas.length})
        </span>
        <NotaForm situacionId={situacion.id} />
        <div className="flex flex-col gap-2.5">
          {notas.map((n) => (
            <div key={n.id} className="rounded-xl bg-bg px-3.5 py-2.5">
              <p className="text-[13px] leading-relaxed text-ink">{n.nota}</p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {n.autor?.full_name ?? "—"} ·{" "}
                {formatDate(n.created_at.slice(0, 10))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SituacionesClient({
  situaciones,
  seleccionadaId,
  notas,
  estadoFiltro,
}: {
  situaciones: SituacionFila[];
  seleccionadaId: string | null;
  notas: Nota[];
  estadoFiltro: string;
}) {
  const seleccionada = situaciones.find((s) => s.id === seleccionadaId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">
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
                  {["Título", "Curso", "Responsable", "Estado"].map((h) => (
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
                          {s.courses?.display_name}
                        </Link>
                      </td>
                      <td className="border-t border-line px-3 py-3 text-[13.5px]">
                        <Link href={hrefCon(estadoFiltro, s.id)} className="block">
                          {s.responsable?.full_name ?? "—"}
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
          {seleccionada ? (
            <PanelDetalle situacion={seleccionada} notas={notas} />
          ) : (
            <p className="text-sm text-ink-soft">
              Elegí una situación de la lista para ver el detalle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
