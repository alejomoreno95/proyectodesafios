"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/eoe", label: "Situaciones" },
  { href: "/eoe/tareas", label: "Tareas" },
  { href: "/eoe/encuentros", label: "Encuentros" },
];

export function EoeNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 border-b border-line bg-surface px-5 pt-1 md:px-10">
      {ITEMS.map((item) => {
        const active =
          item.href === "/eoe" ? pathname === "/eoe" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative px-3 py-3 text-[13.5px] font-semibold"
            style={{ color: active ? "var(--brand-deep)" : "var(--ink-faint)" }}
          >
            {item.label}
            {active && (
              <span
                className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full"
                style={{ background: "var(--brand)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
