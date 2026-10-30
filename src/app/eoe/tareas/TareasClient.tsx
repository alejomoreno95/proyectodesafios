"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { cambiarEstadoTarea, crearTarea } from "./actions";

export type Curso = {
  id: string;
  nivel: string;
  display_name: string;
  sort_order: number;
};

export type Tarea = {
  id: string;
  nivel: string;
  course_id: string | null;
  titulo: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  courses: { display_name: string } | null;
};

function TareaRow({ tarea }: { tarea: Tarea }) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);

  async function alternarEstado() {
    setProcesando(true);
    const nuevoEstado = tarea.estado === "Hecha" ? "Pendiente" : "Hecha";
    await cambiarEstadoTarea(tarea.id, nuevoEstado);
    setProcesando(false);
    router.refresh();
  }

  const hecha = tarea.estado === "Hecha";

  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-line bg-surface px-4 py-[15px]">
      <button
        type="button"
        onClick={alternarEstado}
        disabled={procesando}
        aria-label={hecha ? "Marcar como pendiente" : "Marcar como hecha"}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 disabled:opacity-50"
        style={{
          borderColor: hecha ? "var(--good)" : "var(--line)",
          background: hecha ? "var(--good)" : "transparent",
        }}
      >
        {hecha && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <span
          className="text-[14.5px] font-semibold"
          style={{
            color: hecha ? "var(--ink-faint)" : "var(--ink)",
            textDecoration: hecha ? "line-through" : "none",
          }}
        >
          {tarea.titulo}
        </span>
        {tarea.descripcion && (
          <span className="text-[13px] text-ink-soft">{tarea.descripcion}</span>
        )}
        <span className="text-[11.5px] text-ink-faint">
          {tarea.nivel}
          {tarea.courses?.display_name ? ` · ${tarea.courses.display_name}` : ""} ·{" "}
          {formatDate(tarea.created_at.slice(0, 10))}
        </span>
      </div>
    </div>
  );
}

export function TareasClient({
  tareasIniciales,
  cursos,
  nivelesDisponibles,
}: {
  tareasIniciales: Tarea[];
  cursos: Curso[];
  nivelesDisponibles: string[];
}) {
  const [tareas, setTareas] = useState(tareasIniciales);
  const [abierto, setAbierto] = useState(false);
  const [nivel, setNivel] = useState(nivelesDisponibles[0] ?? "");
  const [courseId, setCourseId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const cursosDelNivel = useMemo(
    () => cursos.filter((c) => c.nivel === nivel),
    [cursos, nivel],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nivel || !titulo.trim()) {
      setError("El nivel y el título son obligatorios.");
      return;
    }

    setEnviando(true);
    const resultado = await crearTarea({
      nivel: nivel as "Primaria" | "Secundaria",
      course_id: courseId || null,
      titulo: titulo.trim(),
      descripcion,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    const curso = cursos.find((c) => c.id === courseId);
    setTareas((prev) => [
      {
        id: `temp-${Date.now()}`,
        nivel,
        course_id: courseId || null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        estado: "Pendiente",
        created_at: new Date().toISOString(),
        courses: curso ? { display_name: curso.display_name } : null,
      },
      ...prev,
    ]);
    setCourseId("");
    setTitulo("");
    setDescripcion("");
    setAbierto(false);
  }

  const pendientes = tareas.filter((t) => t.estado !== "Hecha");
  const hechas = tareas.filter((t) => t.estado === "Hecha");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Tareas</h1>
        {!abierto && (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva tarea
          </button>
        )}
      </div>

      {abierto && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
        >
          <div className="flex flex-wrap gap-3">
            <select
              value={nivel}
              onChange={(e) => {
                setNivel(e.target.value);
                setCourseId("");
              }}
              className="rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
            >
              {nivelesDisponibles.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="min-w-[180px] flex-1 rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
            >
              <option value="">Curso (opcional)</option>
              {cursosDelNivel.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
          />
          {error && (
            <p className="rounded-lg bg-eje2-tint px-3.5 py-2.5 text-[13px] font-medium text-eje2-deep">
              {error}
            </p>
          )}
          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-brand-deep px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {enviando ? "Creando…" : "Crear tarea"}
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-ink-faint"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {tareas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
          <p className="text-[14px] text-ink-soft">No hay tareas internas todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {pendientes.map((t) => (
              <TareaRow key={t.id} tarea={t} />
            ))}
          </div>
          {hechas.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="pl-0.5 text-xs font-semibold tracking-wide text-ink-faint">
                HECHAS
              </span>
              {hechas.map((t) => (
                <TareaRow key={t.id} tarea={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
