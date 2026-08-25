"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
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
];

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

export function AdminNavDesktop() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-[3px]">
      {ITEMS.map((item) => {
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

export function AdminNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface px-6 pb-6 pt-3 md:hidden">
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 text-[10.5px] font-semibold"
            style={{ color: active ? "var(--brand)" : "var(--ink-faint)" }}
          >
            <Icon path={item.icon} rect={item.rect} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
