"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/logout-action";

type NavItem = { href: string; label: string; icon: string; rect?: boolean };

const ITEMS_BASE: NavItem[] = [
  {
    href: "/admin",
    label: "Inicio",
    icon: "M3 11l9-7 9 7M5 10v10h14V10",
  },
  {
    href: "/admin/encuentros",
    label: "Encuentros",
    icon: "M3.5 9.5h17M8 4v-.5M16 4v-.5",
    rect: true,
  },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    icon: "M4 20V10M12 20V4M20 20v-7",
  },
  {
    href: "/admin/personal",
    label: "Personal",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20.5a7.5 7.5 0 0115 0",
  },
];

const ITEM_SITUACIONES: NavItem = {
  href: "/admin/situaciones",
  label: "Situaciones",
  icon: "M12 9v4M12 16.5h.01M10.3 3.9L2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
};

const ITEM_CARGAR_ENCUENTRO: NavItem = {
  // Para directivos que también dan clase: acceso directo a la vista de
  // docente para cargar sus propios encuentros. Vive fuera de /admin, así
  // que al navegar acá se sale por completo de este layout (es esperado).
  href: "/docente",
  label: "Cargar encuentro",
  icon: "M12 5v14M5 12h14",
};

function construirItems(mostrarSituaciones: boolean): NavItem[] {
  return [
    ...ITEMS_BASE,
    ...(mostrarSituaciones ? [ITEM_SITUACIONES] : []),
    ITEM_CARGAR_ENCUENTRO,
  ];
}

function Icon({ path, rect }: { path: string; rect?: boolean }) {
  return (
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
      {rect && <rect x="3.5" y="4" width="17" height="17" rx="2.5" />}
      <path d={path} />
    </svg>
  );
}

export function AdminNavDesktop({ mostrarSituaciones }: { mostrarSituaciones: boolean }) {
  const pathname = usePathname();
  const items = construirItems(mostrarSituaciones);
  return (
    <nav className="flex flex-col gap-[3px]">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-[10px] px-4 py-[11px] text-[14.5px] font-semibold"
            style={{
              background: active ? "rgba(255,255,255,0.10)" : "transparent",
              color: active ? "#fff" : "#c7d6ec",
            }}
          >
            <Icon path={item.icon} rect={item.rect} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Reemplaza la barra inferior fija de antes: en mobile el menú vive detrás
// de un botón de hamburguesa y se abre como un panel desde la izquierda,
// con las mismas opciones que el sidebar de escritorio (según el rol de
// quien mira). Se cierra al elegir una opción, al tocar afuera o con la X.
export function AdminNavMobile({
  mostrarSituaciones,
  fullName,
  cargo,
}: {
  mostrarSituaciones: boolean;
  fullName: string;
  cargo: string;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const items = construirItems(mostrarSituaciones);

  const iniciales = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft md:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
        </svg>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[260px] max-w-[80vw] flex-col bg-brand-deep p-4 pt-6 shadow-2xl">
            <div className="flex items-center justify-between pb-6 pl-1 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-[15px] font-semibold text-white">Desafíos</span>
                  <span className="font-mono text-[10px] text-[#8fa9c9]">CSME</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#c7d6ec] hover:bg-white/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-[3px]">
              {items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className="flex items-center gap-3 rounded-[10px] px-4 py-[11px] text-[14.5px] font-semibold"
                    style={{
                      background: active ? "rgba(255,255,255,0.10)" : "transparent",
                      color: active ? "#fff" : "#c7d6ec",
                    }}
                  >
                    <Icon path={item.icon} rect={item.rect} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1" />

            <div className="flex items-center gap-2.5 border-t border-white/10 p-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#8fa9c9] text-[13px] font-bold text-brand-deep">
                {iniciales}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-white">{fullName}</span>
                <span className="text-[11.5px] text-[#8fa9c9]">{cargo}</span>
              </div>
              <form action={logout}>
                <button type="submit" aria-label="Salir" className="text-[#8fa9c9] hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
