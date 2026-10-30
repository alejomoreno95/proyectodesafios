"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarLeida, marcarTodasLeidas } from "@/app/notificaciones/actions";
import type { NotificacionFila } from "@/lib/notificaciones";

// A dónde navega cada tipo de notificación:
// - "actualizacion": el estado de MI situación cambió -> mis reportes.
// - "nueva_situacion" / "asignacion": algo para la mesa EOE -> el detalle ahí.
function hrefPara(n: NotificacionFila): string | null {
  if (!n.situacion_id) return null;
  if (n.tipo === "actualizacion") return "/docente/reportar";
  return `/eoe?id=${n.situacion_id}`;
}

function tiempoRelativo(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} d`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function NotificationBell({ inicial }: { inicial: NotificacionFila[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState(inicial);
  const [, startTransition] = useTransition();

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  function marcar(id: string) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n)),
    );
    startTransition(() => {
      void marcarLeida(id);
    });
  }

  function marcarTodas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
    startTransition(() => {
      void marcarTodasLeidas();
    });
  }

  function alHacerClick(n: NotificacionFila) {
    if (!n.leido) marcar(n.id);
    const href = hrefPara(n);
    setAbierto(false);
    if (href) router.push(href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-neutral-chip hover:text-ink-soft"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--brand)" }}
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[13px] font-semibold text-ink">
                Notificaciones
              </span>
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="text-[11.5px] font-semibold text-brand-deep hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
                  No tenés notificaciones.
                </p>
              ) : (
                notificaciones.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => alHacerClick(n)}
                    className="flex w-full flex-col gap-0.5 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-neutral-chip"
                    style={{ background: n.leido ? "transparent" : "var(--brand-tint)" }}
                  >
                    <span className="text-[13px] leading-snug text-ink">
                      {n.mensaje}
                    </span>
                    <span className="text-[11px] text-ink-faint">
                      {tiempoRelativo(n.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
