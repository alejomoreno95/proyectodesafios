import Link from "next/link";
import { hasRole, requireEOE } from "@/lib/auth";
import { logout } from "@/app/logout-action";
import { obtenerNotificaciones } from "@/lib/notificaciones";
import { NotificationBell } from "@/components/NotificationBell";
import { EoeNav } from "./EoeNav";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function EoeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireEOE();
  const notificaciones = await obtenerNotificaciones(profile.id);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-semibold text-ink">
              Mesa EOE
            </span>
            <span className="font-mono text-[10px] text-ink-faint">
              Alcance: {profile.alcance}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasRole(profile, "docente") && (
            <Link
              href="/docente"
              className="hidden text-xs font-semibold text-ink-faint hover:text-ink-soft sm:inline"
            >
              Cargar encuentro
            </Link>
          )}
          <NotificationBell inicial={notificaciones} />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-tint text-[13px] font-bold text-brand-deep">
            {initials(profile.full_name)}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs font-semibold text-ink-faint hover:text-ink-soft"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <EoeNav />
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-10">
        {children}
      </main>
    </div>
  );
}
