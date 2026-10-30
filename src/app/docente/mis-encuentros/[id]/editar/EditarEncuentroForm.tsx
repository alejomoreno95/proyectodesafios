"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarEncuentro } from "../../actions";

type Curso = { id: string; nivel: string; display_name: string; sort_order: number };
type Eje = { id: string; numero: number; nombre: string };
type Producto = { id: string; nombre: string; sort_order: number };

type Encuentro = {
  id: string;
  fecha_encuentro: string;
  course_id: string;
  axis_id: string;
  docente: string;
  contenidos: string;
  actividades: string;
  product_id: string;
  compartido_familia: boolean;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function EditarEncuentroForm({
  encuentro,
  cursos,
  ejes,
  productos,
}: {
  encuentro: Encuentro;
  cursos: Curso[];
  ejes: Eje[];
  productos: Producto[];
}) {
  const router = useRouter();

  const cursoActual = cursos.find((c) => c.id === encuentro.course_id);

  const [fecha, setFecha] = useState(encuentro.fecha_encuentro);
  const [nivel, setNivel] = useState(cursoActual?.nivel ?? "");
  const [courseId, setCourseId] = useState(encuentro.course_id);
  const [axisId, setAxisId] = useState(encuentro.axis_id);
  const [docente, setDocente] = useState(encuentro.docente);
  const [contenidos, setContenidos] = useState(encuentro.contenidos);
  const [actividades, setActividades] = useState(encuentro.actividades);
  const [productId, setProductId] = useState(encuentro.product_id);
  const [compartido, setCompartido] = useState(encuentro.compartido_familia);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const niveles = useMemo(
    () => Array.from(new Set(cursos.map((c) => c.nivel))),
    [cursos],
  );
  const cursosDelNivel = useMemo(
    () => cursos.filter((c) => c.nivel === nivel),
    [cursos, nivel],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !fecha ||
      fecha > todayISO() ||
      !courseId ||
      !axisId ||
      !docente.trim() ||
      !contenidos.trim() ||
      !actividades.trim() ||
      !productId
    ) {
      setError("Completá todos los campos con una fecha válida.");
      return;
    }

    setGuardando(true);
    const resultado = await actualizarEncuentro(encuentro.id, {
      fecha_encuentro: fecha,
      course_id: courseId,
      axis_id: axisId,
      docente: docente.trim(),
      contenidos: contenidos.trim(),
      actividades: actividades.trim(),
      product_id: productId,
      compartido_familia: compartido,
    });
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push("/docente/mis-encuentros");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Editar encuentro
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">
          Los cambios se guardan sobre este mismo registro.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">Fecha</label>
          <input
            type="date"
            value={fecha}
            max={todayISO()}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[16px] text-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">Curso</label>
          <div className="flex gap-2">
            {niveles.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setNivel(n);
                  if (!cursos.find((c) => c.id === courseId && c.nivel === n)) {
                    setCourseId("");
                  }
                }}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={
                  nivel === n
                    ? { background: "var(--brand)", color: "#fff" }
                    : {
                        background: "var(--surface)",
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
            onChange={(e) => setCourseId(e.target.value)}
            disabled={!nivel}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[16px] text-ink disabled:opacity-50"
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
          <label className="text-[13px] font-semibold text-ink-soft">Eje</label>
          <select
            value={axisId}
            onChange={(e) => setAxisId(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[16px] text-ink"
          >
            <option value="">Elegí un eje</option>
            {ejes.map((e) => (
              <option key={e.id} value={e.id}>
                Eje {e.numero} — {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Docente a cargo
          </label>
          <input
            type="text"
            value={docente}
            onChange={(e) => setDocente(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[16px] text-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Contenidos
          </label>
          <textarea
            value={contenidos}
            onChange={(e) => setContenidos(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Actividades
          </label>
          <textarea
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            Producto
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[16px] text-ink"
          >
            <option value="">Elegí un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-soft">
            ¿Se compartió con la familia?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCompartido(true)}
              className="flex-1 rounded-2xl px-4 py-3.5 text-center text-[15px] font-bold"
              style={
                compartido
                  ? {
                      background: "var(--good-tint)",
                      color: "#0a6e0a",
                      border: "1.5px solid #0ca30c",
                    }
                  : {
                      background: "var(--surface)",
                      color: "var(--ink-soft)",
                      border: "1.5px solid var(--line)",
                    }
              }
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setCompartido(false)}
              className="flex-1 rounded-2xl px-4 py-3.5 text-center text-[15px] font-bold"
              style={
                !compartido
                  ? {
                      background: "var(--neutral-chip)",
                      color: "var(--ink)",
                      border: "1.5px solid var(--ink-faint)",
                    }
                  : {
                      background: "var(--surface)",
                      color: "var(--ink-soft)",
                      border: "1.5px solid var(--line)",
                    }
              }
            >
              No
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-eje2-tint px-4 py-3 text-sm text-eje2-deep">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.push("/docente/mis-encuentros")}
            className="rounded-full border-[1.5px] border-line bg-surface px-[22px] py-[15px] text-[15.5px] font-bold text-brand-deep"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 rounded-full bg-brand px-4 py-[15px] text-[15.5px] font-bold text-white disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
