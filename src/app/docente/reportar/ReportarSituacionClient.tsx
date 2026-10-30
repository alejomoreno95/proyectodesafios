"use client";

import { useMemo, useState } from "react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatDate } from "@/lib/format";
import { crearSituacion } from "./actions";

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

export type Situacion = {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  created_at: string;
  course_id: string;
  courses: { display_name: string } | null;
};

export function ReportarSituacionClient({
  cursos,
  encuentros,
  situacionesIniciales,
}: {
  cursos: Curso[];
  encuentros: EncuentroOpcion[];
  situacionesIniciales: Situacion[];
}) {
  const [situaciones, setSituaciones] = useState(situacionesIniciales);

  const [nivel, setNivel] = useState("");
  const [courseId, setCourseId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const niveles = useMemo(
    () => Array.from(new Set(cursos.map((c) => c.nivel))),
    [cursos],
  );
  const cursosDelNivel = useMemo(
    () => cursos.filter((c) => c.nivel === nivel),
    [cursos, nivel],
  );
  const encuentrosDelCurso = useMemo(
    () => encuentros.filter((e) => e.course_id === courseId),
    [encuentros, courseId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setExito(false);

    if (!courseId || !titulo.trim() || !descripcion.trim()) {
      setError("Completá curso, título y descripción.");
      return;
    }

    setEnviando(true);
    const resultado = await crearSituacion({
      course_id: courseId,
      encounter_id: encounterId || null,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    const curso = cursos.find((c) => c.id === courseId);
    setSituaciones((prev) => [
      {
        id: `temp-${Date.now()}`,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado: "Pendiente",
        created_at: new Date().toISOString(),
        course_id: courseId,
        courses: curso ? { display_name: curso.display_name } : null,
      },
      ...prev,
    ]);

    setNivel("");
    setCourseId("");
    setEncounterId("");
    setTitulo("");
    setDescripcion("");
    setExito(true);
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div>
        <h1 className="font-display text-[21px] font-semibold text-ink">
          Reportar situación
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          Lo que cuentes acá lo recibe el equipo de orientación (EOE), nunca
          queda público.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">Curso</label>
          <div className="flex gap-2">
            {niveles.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setNivel(n);
                  setCourseId("");
                  setEncounterId("");
                }}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={
                  nivel === n
                    ? { background: "var(--brand)", color: "#fff" }
                    : {
                        background: "var(--bg)",
                        color: "var(--ink-soft)",
                        border: "1px solid var(--line)",
                      }
                }
              >
                {n}
              </button>
            ))}
          </div>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setEncounterId("");
            }}
            disabled={!nivel}
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink disabled:opacity-50"
          >
            <option value="">
              {nivel ? "Elegí el curso" : "Elegí primero el nivel"}
            </option>
            {cursosDelNivel.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Encuentro relacionado (opcional)
          </label>
          <select
            value={encounterId}
            onChange={(e) => setEncounterId(e.target.value)}
            disabled={!courseId}
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink disabled:opacity-50"
          >
            <option value="">Ninguno</option>
            {encuentrosDelCurso.map((enc) => (
              <option key={enc.id} value={enc.id}>
                {formatDate(enc.fecha_encuentro)} — {enc.courses?.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Resumen breve de la situación"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={5}
            placeholder="Contá lo que viste u observaste, con el detalle que haga falta"
            className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-3 text-[14.5px] text-ink"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-eje2-tint px-3.5 py-2.5 text-[13px] font-medium text-eje2-deep">
            {error}
          </p>
        )}
        {exito && (
          <p className="rounded-lg bg-good-tint px-3.5 py-2.5 text-[13px] font-medium" style={{ color: "#0a6e0a" }}>
            Reporte enviado. El EOE ya lo tiene disponible.
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-brand px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
        >
          {enviando ? "Enviando…" : "Enviar reporte"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <span className="pl-0.5 text-xs font-semibold tracking-wide text-ink-faint">
          MIS REPORTES
        </span>

        {situaciones.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface px-5 py-7 text-center">
            <p className="text-[14px] text-ink-soft">
              Todavía no reportaste ninguna situación.
            </p>
          </div>
        )}

        {situaciones.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface px-4 py-[15px]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[14.5px] font-semibold text-ink">
                {s.titulo}
              </span>
              <EstadoBadge estado={s.estado} />
            </div>
            <span className="text-[13px] text-ink-soft">
              {s.courses?.display_name}
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
