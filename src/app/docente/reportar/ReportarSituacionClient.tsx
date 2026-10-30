"use client";

import { useMemo, useState } from "react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatDate } from "@/lib/format";
import {
  crearSituacion,
  crearSolicitudCapellan,
  type Motivo,
  type Tipo,
} from "./actions";

export type Curso = {
  id: string;
  nivel: string;
  display_name: string;
  sort_order: number;
};

export type EncuentroOpcion = {
  id: string;
  course_id: string;
  fecha_encuentro: string;
  courses: { display_name: string } | null;
};

export type SolicitudFila = {
  id: string;
  destinatario: "eoe" | "capellan";
  tipo: "individual" | "grupal";
  persona_nombre: string | null;
  motivo: "confesion" | "charla" | null;
  estado: string;
  created_at: string;
  cursos: string[];
};

const MOTIVO_LABEL: Record<string, string> = {
  confesion: "Confesión",
  charla: "Charla",
};

export function ReportarSituacionClient({
  cursos,
  encuentros,
  solicitudesIniciales,
  alcance,
}: {
  cursos: Curso[];
  encuentros: EncuentroOpcion[];
  solicitudesIniciales: SolicitudFila[];
  alcance: "Primaria" | "Secundaria" | "Total";
}) {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);

  const puedeCapellan = alcance === "Secundaria" || alcance === "Total";

  const [destinatario, setDestinatario] = useState<"eoe" | "capellan">("eoe");
  const [cursoIds, setCursoIds] = useState<string[]>([]);
  const [tipo, setTipo] = useState<Tipo>("grupal");
  const [personaNombre, setPersonaNombre] = useState("");
  const [motivo, setMotivo] = useState<Motivo>("charla");
  const [descripcion, setDescripcion] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [avisoCursosQuitados, setAvisoCursosQuitados] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState<string>("");

  const cursosPorId = useMemo(() => new Map(cursos.map((c) => [c.id, c])), [cursos]);

  const cursosVisibles = useMemo(
    () => (destinatario === "capellan" ? cursos.filter((c) => c.nivel === "Secundaria") : cursos),
    [cursos, destinatario],
  );

  const nivelesSeleccionados = useMemo(() => {
    const niveles = new Set<string>();
    for (const id of cursoIds) {
      const c = cursosPorId.get(id);
      if (c) niveles.add(c.nivel);
    }
    return niveles;
  }, [cursoIds, cursosPorId]);

  const avisoAmbosNiveles = destinatario === "eoe" && nivelesSeleccionados.size > 1;

  const encuentrosFiltrados = useMemo(
    () => encuentros.filter((e) => cursoIds.includes(e.course_id)),
    [encuentros, cursoIds],
  );

  function elegirDestinatario(d: "eoe" | "capellan") {
    setDestinatario(d);
    setError("");
    if (d === "capellan") {
      const quitados = cursoIds.filter((id) => cursosPorId.get(id)?.nivel !== "Secundaria");
      if (quitados.length > 0) {
        setCursoIds((prev) => prev.filter((id) => cursosPorId.get(id)?.nivel === "Secundaria"));
        setAvisoCursosQuitados(true);
      }
    } else {
      setAvisoCursosQuitados(false);
    }
  }

  function toggleCurso(id: string) {
    setCursoIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    setEncounterId("");
    setAvisoCursosQuitados(false);
  }

  function resetForm() {
    setDestinatario("eoe");
    setCursoIds([]);
    setTipo("grupal");
    setPersonaNombre("");
    setMotivo("charla");
    setDescripcion("");
    setEncounterId("");
    setAvisoCursosQuitados(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setExito("");

    if (cursoIds.length === 0) {
      setError("Elegí al menos un curso.");
      return;
    }
    if (tipo === "individual" && !personaNombre.trim()) {
      setError("Completá el nombre de la persona a quien refiere.");
      return;
    }

    setEnviando(true);

    const resultado =
      destinatario === "eoe"
        ? await crearSituacion({
            course_ids: cursoIds,
            tipo,
            persona_nombre: tipo === "individual" ? personaNombre.trim() : null,
            descripcion: descripcion.trim() || null,
            encounter_id: encounterId || null,
          })
        : await crearSolicitudCapellan({
            course_ids: cursoIds,
            tipo,
            persona_nombre: tipo === "individual" ? personaNombre.trim() : null,
            motivo,
            descripcion: motivo === "confesion" ? null : descripcion.trim() || null,
            encounter_id: encounterId || null,
          });

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setSolicitudes((prev) => [
      {
        id: `temp-${Date.now()}`,
        destinatario,
        tipo,
        persona_nombre: tipo === "individual" ? personaNombre.trim() : null,
        motivo: destinatario === "capellan" ? motivo : null,
        estado: "Pendiente",
        created_at: new Date().toISOString(),
        cursos: cursoIds.map((id) => cursosPorId.get(id)?.display_name).filter((n): n is string => Boolean(n)),
      },
      ...prev,
    ]);

    setExito(
      destinatario === "eoe"
        ? "Solicitud enviada al Equipo de Orientación Escolar."
        : "Solicitud enviada al Capellán.",
    );
    resetForm();
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div>
        <h1 className="font-display text-[21px] font-semibold text-ink">
          Reportar situación
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          Elegí a quién va dirigido. Nunca queda público — solo lo ve quien corresponde.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">Destinatario</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => elegirDestinatario("eoe")}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
              style={
                destinatario === "eoe"
                  ? { background: "var(--brand)", color: "#fff" }
                  : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
              }
            >
              Equipo de Orientación
            </button>
            <button
              type="button"
              onClick={() => puedeCapellan && elegirDestinatario("capellan")}
              disabled={!puedeCapellan}
              title={puedeCapellan ? undefined : "Disponible solo para Secundaria o Acceso total"}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              style={
                destinatario === "capellan"
                  ? { background: "var(--eje5)", color: "#fff" }
                  : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
              }
            >
              Capellán
            </button>
          </div>
          {!puedeCapellan && (
            <p className="text-[12px] text-ink-faint">
              La opción Capellán está disponible solo para cuentas con alcance Secundaria o Acceso total.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            {destinatario === "capellan" ? "Curso o cursos (Secundaria)" : "Curso o cursos"}
          </label>
          <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-bg p-2.5">
            {cursosVisibles.length === 0 && (
              <p className="px-1.5 py-1 text-[13px] text-ink-faint">No hay cursos disponibles.</p>
            )}
            {cursosVisibles.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[14px] text-ink">
                <input
                  type="checkbox"
                  checked={cursoIds.includes(c.id)}
                  onChange={() => toggleCurso(c.id)}
                  className="h-4 w-4"
                />
                {c.display_name}
              </label>
            ))}
          </div>
          {avisoCursosQuitados && (
            <p className="rounded-lg bg-eje4-tint px-3 py-2 text-[12.5px] font-medium text-eje4-deep">
              Quitamos los cursos de Primaria que tenías seleccionados — para Capellán solo se puede elegir Secundaria.
            </p>
          )}
          {avisoAmbosNiveles && (
            <p className="rounded-lg bg-brand-tint px-3 py-2 text-[12.5px] font-medium text-brand-deep">
              Esta situación se va a compartir con el EOE de Primaria y de Secundaria, porque involucra cursos de ambos niveles.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">Tipo de situación</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo("individual")}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
              style={
                tipo === "individual"
                  ? { background: "var(--brand)", color: "#fff" }
                  : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
              }
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setTipo("grupal")}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
              style={
                tipo === "grupal"
                  ? { background: "var(--brand)", color: "#fff" }
                  : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
              }
            >
              Grupal
            </button>
          </div>
        </div>

        {tipo === "individual" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft">
              Nombre de la persona a quien refiere
            </label>
            <input
              type="text"
              value={personaNombre}
              onChange={(e) => setPersonaNombre(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink"
            />
          </div>
        )}

        {destinatario === "capellan" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft">Motivo del pedido</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMotivo("confesion")}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={
                  motivo === "confesion"
                    ? { background: "var(--eje5)", color: "#fff" }
                    : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
                }
              >
                Solicitar confesión
              </button>
              <button
                type="button"
                onClick={() => setMotivo("charla")}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={
                  motivo === "charla"
                    ? { background: "var(--eje5)", color: "#fff" }
                    : { background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)" }
                }
              >
                Solicitar charla
              </button>
            </div>
          </div>
        )}

        {destinatario === "capellan" && motivo === "confesion" ? (
          <p className="rounded-lg bg-eje5-tint px-3.5 py-2.5 text-[13px] font-medium text-eje5-deep">
            Solo se registrará la solicitud de un encuentro. No escribas acá el contenido de la confesión.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft">
              Descripción de la situación (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              placeholder="Contá lo que viste u observaste, si hace falta"
              className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Encuentro relacionado (opcional)
          </label>
          <select
            value={encounterId}
            onChange={(e) => setEncounterId(e.target.value)}
            disabled={cursoIds.length === 0}
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink disabled:opacity-50"
          >
            <option value="">Ninguno</option>
            {encuentrosFiltrados.map((enc) => (
              <option key={enc.id} value={enc.id}>
                {formatDate(enc.fecha_encuentro)} — {enc.courses?.display_name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-eje2-tint px-3.5 py-2.5 text-[13px] font-medium text-eje2-deep">
            {error}
          </p>
        )}
        {exito && (
          <p className="rounded-lg bg-good-tint px-3.5 py-2.5 text-[13px] font-medium" style={{ color: "#0a6e0a" }}>
            {exito}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-brand px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
        >
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <span className="pl-0.5 text-xs font-semibold tracking-wide text-ink-faint">
          MIS SOLICITUDES
        </span>

        {solicitudes.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface px-5 py-7 text-center">
            <p className="text-[14px] text-ink-soft">
              Todavía no enviaste ninguna solicitud.
            </p>
          </div>
        )}

        {solicitudes.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface px-4 py-[15px]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[14.5px] font-semibold text-ink">
                {s.destinatario === "eoe" ? "Equipo de Orientación" : "Capellán"}
                {s.motivo ? ` · ${MOTIVO_LABEL[s.motivo]}` : ""}
              </span>
              <EstadoBadge estado={s.estado} />
            </div>
            <span className="text-[13px] text-ink-soft">
              {s.tipo === "individual" ? s.persona_nombre : "Situación grupal"}
              {s.cursos.length > 0 ? ` · ${s.cursos.join(", ")}` : ""}
            </span>
            <span className="font-mono text-[11.5px] text-ink-faint">
              {formatDate(s.created_at.slice(0, 10))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
