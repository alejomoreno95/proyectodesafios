"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { crearEncuentro } from "./actions";

type Curso = {
  id: string;
  nivel: string;
  display_name: string;
  sort_order: number;
};

type Eje = { id: string; numero: number; nombre: string };
type Producto = { id: string; nombre: string; sort_order: number };

const TOTAL_PASOS = 8;

const EJE_ICON_PATHS: Record<number, string> = {
  1: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  2: '<path d="M20.8 8.6c0 4.4-8.8 10.4-8.8 10.4S3.2 13 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8z"/><path d="M7 12h2l1.2-2.4L12 14l1.4-2h2.6"/>',
  3: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
  4: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
  5: '<path d="M5 19c9-1 13-6 14-14-8 0-13 4-14 14z"/><path d="M6 18c2.5-3 5-6 12-11.5"/>',
};

// Ejes 1-2 read fine with white icon strokes on their base color; 3-5 need
// the deeper variant for contrast (matches the fix applied in the design
// canvas review).
const EJE_ICON_BG: Record<number, "base" | "deep"> = {
  1: "base",
  2: "base",
  3: "deep",
  4: "deep",
  5: "deep",
};

function EjeIcon({ numero }: { numero: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: EJE_ICON_PATHS[numero] ?? "" }}
    />
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function stepTitle(step: number): { titulo: string; subtitulo: string } {
  switch (step) {
    case 1:
      return {
        titulo: "¿Cuándo fue el encuentro?",
        subtitulo: "Elegí la fecha en la que se realizó",
      };
    case 2:
      return {
        titulo: "¿Con qué curso fue?",
        subtitulo: "Elegí el nivel y después el curso",
      };
    case 3:
      return {
        titulo: "¿Qué eje trabajaste?",
        subtitulo: "Elegí el que mejor represente el encuentro",
      };
    case 4:
      return {
        titulo: "¿Quién estuvo a cargo?",
        subtitulo: "Prellenado con tu nombre — editalo si hace falta",
      };
    case 5:
      return {
        titulo: "¿Qué contenidos trabajaron?",
        subtitulo: "Describí brevemente los contenidos temáticos",
      };
    case 6:
      return {
        titulo: "¿Qué actividades hicieron?",
        subtitulo: "Describí brevemente las actividades realizadas",
      };
    case 7:
      return {
        titulo: "¿Qué producto elaboraron?",
        subtitulo: "Elegí la opción que mejor represente lo realizado",
      };
    case 8:
      return {
        titulo: "¿Se compartió con la familia?",
        subtitulo: "Contanos si lo que hicieron llegó a las familias",
      };
    default:
      return { titulo: "", subtitulo: "" };
  }
}

export function EncuentroWizard({
  cursos,
  ejes,
  productos,
  nombreDocente,
}: {
  cursos: Curso[];
  ejes: Eje[];
  productos: Producto[];
  nombreDocente: string;
}) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [confirmado, setConfirmado] = useState(false);

  const [fecha, setFecha] = useState(todayISO());
  const [nivel, setNivel] = useState<string>("");
  const [courseId, setCourseId] = useState("");
  const [axisId, setAxisId] = useState("");
  const [docente, setDocente] = useState(nombreDocente);
  const [contenidos, setContenidos] = useState("");
  const [actividades, setActividades] = useState("");
  const [productId, setProductId] = useState("");
  const [compartido, setCompartido] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const niveles = useMemo(
    () => Array.from(new Set(cursos.map((c) => c.nivel))),
    [cursos],
  );
  const cursosDelNivel = useMemo(
    () => cursos.filter((c) => c.nivel === nivel),
    [cursos, nivel],
  );

  const curso = cursos.find((c) => c.id === courseId);
  const eje = ejes.find((e) => e.id === axisId);

  function puedeAvanzar(): boolean {
    switch (step) {
      case 1:
        return fecha.trim().length > 0 && fecha <= todayISO();
      case 2:
        return courseId.length > 0;
      case 3:
        return axisId.length > 0;
      case 4:
        return docente.trim().length > 0;
      case 5:
        return contenidos.trim().length > 0;
      case 6:
        return actividades.trim().length > 0;
      case 7:
        return productId.length > 0;
      case 8:
        return compartido !== null;
      default:
        return false;
    }
  }

  function irAtras() {
    setError(null);
    if (step === 1) {
      router.push("/docente");
      return;
    }
    setStep((s) => s - 1);
  }

  async function irAdelante() {
    if (!puedeAvanzar()) return;
    setError(null);
    if (step < TOTAL_PASOS) {
      setStep((s) => s + 1);
      return;
    }
    await guardar();
  }

  async function guardar() {
    if (compartido === null) return;
    setSubmitting(true);
    setError(null);
    const resultado = await crearEncuentro({
      fecha_encuentro: fecha,
      course_id: courseId,
      axis_id: axisId,
      docente: docente.trim(),
      contenidos: contenidos.trim(),
      actividades: actividades.trim(),
      product_id: productId,
      compartido_familia: compartido,
    });
    setSubmitting(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setConfirmado(true);
  }

  function registrarOtro() {
    setFecha(todayISO());
    setNivel("");
    setCourseId("");
    setAxisId("");
    setDocente(nombreDocente);
    setContenidos("");
    setActividades("");
    setProductId("");
    setCompartido(null);
    setError(null);
    setConfirmado(false);
    setStep(1);
  }

  if (confirmado) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-1 text-center">
        <div className="mb-7 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-good-tint">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a6e0a"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2.5 font-display text-[26px] font-semibold leading-tight text-ink">
          ¡Encuentro registrado correctamente!
        </h1>
        <p className="mb-6 text-[14.5px] text-ink-soft">
          Gracias por compartir lo que trabajaron.
        </p>

        <div className="mb-9 flex w-full flex-col gap-2.5 rounded-2xl bg-bg px-5 py-[18px]">
          <div className="flex justify-between">
            <span className="text-[13.5px] text-ink-faint">Fecha</span>
            <span className="font-mono text-[13.5px] font-semibold text-ink">
              {formatDate(fecha)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[13.5px] text-ink-faint">Curso</span>
            <span className="text-[13.5px] font-semibold text-ink">
              {curso?.display_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-ink-faint">Eje</span>
            {eje && (
              <span
                className="rounded-full px-3 py-1 text-[12.5px] font-semibold"
                style={{
                  background: `var(--eje${eje.numero}-tint)`,
                  color: `var(--eje${eje.numero}-deep)`,
                }}
              >
                {eje.nombre}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-1">
          <button
            type="button"
            onClick={registrarOtro}
            className="w-full rounded-full bg-brand px-4 py-4 text-[16px] font-bold text-white"
          >
            Registrar otro encuentro
          </button>
          <Link
            href="/docente"
            className="w-full rounded-full px-4 py-3 text-center text-[15px] font-bold text-brand-deep"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const { titulo, subtitulo } = stepTitle(step);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={irAtras}
            aria-label="Atrás"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="font-mono text-xs font-semibold text-ink-faint">
            PASO {step} DE {TOTAL_PASOS}
          </span>
        </div>
        <div className="flex gap-[5px]">
          {Array.from({ length: TOTAL_PASOS }, (_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded"
              style={{
                background: i < step ? "var(--brand)" : "var(--line)",
              }}
            />
          ))}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {titulo}
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-soft">{subtitulo}</p>
        </div>
      </div>

      <div className="min-h-[280px]">
        {step === 1 && (
          <input
            type="date"
            value={fecha}
            max={todayISO()}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          />
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {niveles.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setNivel(n);
                    setCourseId("");
                  }}
                  className="flex-1 rounded-full px-4 py-3 text-sm font-semibold"
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
              className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink disabled:opacity-50"
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
        )}

        {step === 3 && (
          <div className="flex flex-col gap-2.5">
            {ejes.map((e) => {
              const selected = axisId === e.id;
              const iconBg =
                EJE_ICON_BG[e.numero] === "deep"
                  ? `var(--eje${e.numero}-deep)`
                  : `var(--eje${e.numero})`;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setAxisId(e.id)}
                  className="relative flex items-center gap-3.5 rounded-2xl p-4 text-left"
                  style={{
                    background: `var(--eje${e.numero}-tint)`,
                    border: selected
                      ? `1.5px solid var(--eje${e.numero})`
                      : "1.5px solid transparent",
                  }}
                >
                  <div
                    className="flex h-[42px] w-[42px] min-w-[42px] items-center justify-center rounded-full"
                    style={{ background: iconBg }}
                  >
                    <EjeIcon numero={e.numero} />
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-mono text-[10.5px] opacity-80"
                      style={{ color: `var(--eje${e.numero}-deep)` }}
                    >
                      EJE {e.numero}
                    </div>
                    <div
                      className="font-display text-[16.5px] font-semibold"
                      style={{ color: `var(--eje${e.numero}-deep)` }}
                    >
                      {e.nombre}
                    </div>
                  </div>
                  {selected && (
                    <div
                      className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
                      style={{ background: `var(--eje${e.numero}-deep)` }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <input
            type="text"
            value={docente}
            onChange={(e) => setDocente(e.target.value)}
            placeholder="Nombre del docente a cargo"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          />
        )}

        {step === 5 && (
          <textarea
            value={contenidos}
            onChange={(e) => setContenidos(e.target.value)}
            placeholder="Ej: Cuidado del medio ambiente, reciclaje..."
            rows={7}
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          />
        )}

        {step === 6 && (
          <textarea
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
            placeholder="Ej: Armamos afiches en grupos y los presentamos..."
            rows={7}
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          />
        )}

        {step === 7 && (
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] text-ink"
          >
            <option value="">Elegí un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        )}

        {step === 8 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCompartido(true)}
              className="flex-1 rounded-2xl px-4 py-6 text-center text-[16px] font-bold"
              style={
                compartido === true
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
              className="flex-1 rounded-2xl px-4 py-6 text-center text-[16px] font-bold"
              style={
                compartido === false
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
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-eje2-tint px-4 py-3 text-sm text-eje2-deep">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={irAtras}
          className="rounded-full border-[1.5px] border-line bg-surface px-[22px] py-[15px] text-[15.5px] font-bold text-brand-deep"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={irAdelante}
          disabled={!puedeAvanzar() || submitting}
          className="flex-1 rounded-full bg-brand px-4 py-[15px] text-[15.5px] font-bold text-white disabled:opacity-40"
        >
          {step < TOTAL_PASOS
            ? "Siguiente"
            : submitting
              ? "Guardando…"
              : "Guardar encuentro"}
        </button>
      </div>
    </div>
  );
}
