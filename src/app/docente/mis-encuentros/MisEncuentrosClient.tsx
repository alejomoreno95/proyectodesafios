"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EjeChip } from "@/components/EjeChip";
import { formatDate } from "@/lib/format";
import { eliminarEncuentro, restaurarEncuentro } from "./actions";

export type Encuentro = {
  id: string;
  fecha_encuentro: string;
  contenidos: string;
  actividades: string;
  docente: string;
  compartido_familia: boolean;
  course_id: string;
  axis_id: string;
  product_id: string;
  deleted_at: string | null;
  courses: { display_name: string } | null;
  axes: { numero: number; nombre: string } | null;
  products: { nombre: string } | null;
};

type Tab = "activos" | "papelera";

function EncuentroRow({ enc, tab }: { enc: Encuentro; tab: Tab }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function confirmarEliminar() {
    setProcesando(true);
    setError("");
    const resultado = await eliminarEncuentro(enc.id);
    setProcesando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  async function restaurar() {
    setProcesando(true);
    setError("");
    const resultado = await restaurarEncuentro(enc.id);
    setProcesando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface px-4 py-[15px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] text-ink-faint">
          {formatDate(enc.fecha_encuentro)}
        </span>
        {enc.axes && (
          <EjeChip numero={enc.axes.numero} nombre={enc.axes.nombre} size="sm" />
        )}
      </div>
      <div className="text-[15px] font-semibold text-ink">
        {enc.courses?.display_name}
      </div>
      {enc.products?.nombre && (
        <div className="text-[13.5px] text-ink-soft">{enc.products.nombre}</div>
      )}

      {tab === "papelera" && enc.deleted_at && (
        <div className="text-[12px] text-ink-faint">
          Eliminado el {formatDate(enc.deleted_at.slice(0, 10))}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-eje2-tint px-3 py-2 text-[12.5px] font-medium text-eje2-deep">
          {error}
        </p>
      )}

      {tab === "activos" && !confirmando && (
        <div className="mt-1 flex items-center gap-4">
          <Link
            href={`/docente/mis-encuentros/${enc.id}/editar`}
            className="text-[12.5px] font-semibold text-brand"
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-[12.5px] font-semibold text-eje2-deep"
          >
            Eliminar
          </button>
        </div>
      )}

      {tab === "activos" && confirmando && (
        <div className="mt-1 flex flex-col gap-2 rounded-xl bg-eje2-tint p-3">
          <p className="text-[12.5px] font-medium text-eje2-deep">
            ¿Eliminar el encuentro del {formatDate(enc.fecha_encuentro)} en{" "}
            {enc.courses?.display_name}? Vas a poder recuperarlo después desde
            la papelera.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={confirmarEliminar}
              disabled={procesando}
              className="rounded-full bg-eje2-deep px-4 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-60"
            >
              {procesando ? "Eliminando…" : "Sí, eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={procesando}
              className="rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-eje2-deep"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {tab === "papelera" && (
        <div className="mt-1">
          <button
            type="button"
            onClick={restaurar}
            disabled={procesando}
            className="text-[12.5px] font-semibold text-brand disabled:opacity-50"
          >
            {procesando ? "Restaurando…" : "Restaurar"}
          </button>
        </div>
      )}
    </div>
  );
}

export function MisEncuentrosClient({
  encuentros,
  tab,
}: {
  encuentros: Encuentro[];
  tab: Tab;
}) {
  return (
    <div className="relative flex flex-col gap-4 pb-16">
      <h1 className="font-display text-[21px] font-semibold text-ink">
        Mis Encuentros
      </h1>

      <div className="flex gap-2">
        <Link
          href="/docente/mis-encuentros"
          className="flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold"
          style={
            tab === "activos"
              ? { background: "var(--brand)", color: "#fff" }
              : {
                  background: "var(--surface)",
                  color: "var(--ink-soft)",
                  border: "1px solid var(--line)",
                }
          }
        >
          Activos
        </Link>
        <Link
          href="/docente/mis-encuentros?tab=papelera"
          className="flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold"
          style={
            tab === "papelera"
              ? { background: "var(--brand)", color: "#fff" }
              : {
                  background: "var(--surface)",
                  color: "var(--ink-soft)",
                  border: "1px solid var(--line)",
                }
          }
        >
          Papelera
        </Link>
      </div>

      {encuentros.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
          <p className="text-[14.5px] text-ink-soft">
            {tab === "papelera"
              ? "No hay encuentros eliminados."
              : "Todavía no registraste ningún encuentro."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {encuentros.map((enc) => (
          <EncuentroRow key={enc.id} enc={enc} tab={tab} />
        ))}
      </div>

      {tab === "activos" && (
        <Link
          href="/docente/nuevo"
          aria-label="Nuevo encuentro"
          className="fixed bottom-7 right-6 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-brand shadow-[0_8px_20px_-6px_rgba(27,77,140,0.55)]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      )}
    </div>
  );
}
