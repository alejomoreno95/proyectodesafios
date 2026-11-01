"use client";

import { useEffect, useRef, useState } from "react";

export type CursoOpcion = { id: string; display_name: string };

/**
 * Desplegable de selección múltiple: muestra un botón cerrado con un
 * resumen de lo elegido y, al tocarlo, abre un panel con casillas. Se
 * cierra al tocar afuera o al volver a tocar el botón — elegir un curso no
 * lo cierra, porque normalmente se eligen varios seguidos.
 */
export function CursoMultiSelect({
  cursos,
  selectedIds,
  onToggle,
  placeholder = "Elegí uno o más cursos",
}: {
  cursos: CursoOpcion[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alTocarAfuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alTocarAfuera);
    return () => document.removeEventListener("mousedown", alTocarAfuera);
  }, []);

  const seleccionados = cursos.filter((c) => selectedIds.includes(c.id));
  const resumen =
    seleccionados.length === 0
      ? placeholder
      : seleccionados.map((c) => c.display_name).join(", ");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-bg px-3.5 py-3 text-left text-[14.5px]"
      >
        <span
          className={
            seleccionados.length === 0
              ? "truncate text-ink-faint"
              : "truncate text-ink"
          }
        >
          {resumen}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-ink-faint"
          style={{ transform: abierto ? "rotate(180deg)" : undefined }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          {cursos.length === 0 ? (
            <p className="px-2 py-2 text-[13px] text-ink-faint">No hay cursos disponibles.</p>
          ) : (
            cursos.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[14px] text-ink hover:bg-bg"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => onToggle(c.id)}
                  className="h-4 w-4"
                />
                {c.display_name}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
