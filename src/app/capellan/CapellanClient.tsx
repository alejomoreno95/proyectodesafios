"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatDate } from "@/lib/format";
import { cambiarEstadoSolicitudCapellan, type EstadoSolicitudCapellan } from "./actions";

export type SolicitudCapellanFila = {
  id: string;
  tipo: "individual" | "grupal";
  persona_nombre: string | null;
  motivo: "confesion" | "charla";
  descripcion: string | null;
  estado: string;
  created_at: string;
  solicitud_capellan_cursos: { courses: { display_name: string } | null }[];
  encounters: { fecha_encuentro: string; courses: { display_name: string } | null } | null;
  docente: { full_name: string; cargo: string } | null;
};

const ESTADOS: EstadoSolicitudCapellan[] = ["Pendiente", "En atención", "Finalizado"];
const MOTIVO_LABEL: Record<string, string> = { confesion: "Confesión", charla: "Charla" };

function hrefCon(estadoFiltro: string): string {
  const params = new URLSearchParams();
  if (estadoFiltro) params.set("estado", estadoFiltro);
  const qs = params.toString();
  return `/capellan${qs ? `?${qs}` : ""}`;
}

function cursosLabel(s: SolicitudCapellanFila): string {
  const nombres = s.solicitud_capellan_cursos.map((sc) => sc.courses?.display_name).filter(Boolean);
  return nombres.length > 0 ? nombres.join(", ") : "—";
}

function Tarjeta({ solicitud }: { solicitud: SolicitudCapellanFila }) {
  const router = useRouter();
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState("");

  async function cambiarEstado(estado: EstadoSolicitudCapellan) {
    if (estado === solicitud.estado) return;
    setCambiando(true);
    setError("");
    const resultado = await cambiarEstadoSolicitudCapellan(solicitud.id, estado);
    setCambiando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "var(--eje5-tint)", color: "var(--eje5-deep)" }}
          >
            {MOTIVO_LABEL[solicitud.motivo]}
          </span>
          <p className="mt-1.5 text-[14.5px] font-semibold text-ink">
            {solicitud.tipo === "individual" ? solicitud.persona_nombre : "Situación grupal"}
          </p>
        </div>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      <div className="flex flex-col gap-1 text-[13px]">
        <div className="flex justify-between">
          <span className="text-ink-faint">Enviada por</span>
          <span className="font-semibold text-ink">
            {solicitud.docente?.full_name ?? "—"}
            {solicitud.docente?.cargo ? ` (${solicitud.docente.cargo})` : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-faint">Curso(s)</span>
          <span className="font-semibold text-ink">{cursosLabel(solicitud)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-faint">Fecha</span>
          <span className="font-mono font-semibold text-ink">
            {formatDate(solicitud.created_at.slice(0, 10))}
          </span>
        </div>
        {solicitud.encounters && (
          <div className="flex justify-between">
            <span className="text-ink-faint">Encuentro relacionado</span>
            <span className="font-semibold text-ink">
              {solicitud.encounters.courses?.display_name} ·{" "}
              {formatDate(solicitud.encounters.fecha_encuentro)}
            </span>
          </div>
        )}
      </div>

      {solicitud.motivo === "charla" && solicitud.descripcion && (
        <p className="whitespace-pre-wrap rounded-xl bg-bg px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          {solicitud.descripcion}
        </p>
      )}

      <div className="flex gap-2">
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => cambiarEstado(e)}
            disabled={cambiando}
            className="flex-1 rounded-full px-3 py-2 text-[12.5px] font-semibold disabled:opacity-50"
            style={
              solicitud.estado === e
                ? { background: "var(--eje5)", color: "#fff" }
                : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
            }
          >
            {e}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-eje2-tint px-3 py-2 text-[12.5px] font-medium text-eje2-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export function CapellanClient({
  solicitudes,
  estadoFiltro,
}: {
  solicitudes: SolicitudCapellanFila[];
  estadoFiltro: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">Solicitudes</h1>
          <span className="text-sm text-ink-faint">
            {solicitudes.length} resultado{solicitudes.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={hrefCon("")}
            className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={
              !estadoFiltro
                ? { background: "var(--eje5-tint)", color: "var(--eje5-deep)" }
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
                  ? { background: "var(--eje5-tint)", color: "var(--eje5-deep)" }
                  : { color: "var(--ink-faint)" }
              }
            >
              {e}
            </Link>
          ))}
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
          <p className="text-sm text-ink-soft">
            No hay solicitudes que coincidan con este filtro.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {solicitudes.map((s) => (
            <Tarjeta key={s.id} solicitud={s} />
          ))}
        </div>
      )}
    </div>
  );
}
