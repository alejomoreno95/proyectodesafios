import Link from "next/link";
import { requireCapellan } from "@/lib/auth";
import { logout } from "@/app/logout-action";
import { obtenerNotificaciones } from "@/lib/notificaciones";
import { NotificationBell } from "@/components/NotificationBell";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function CapellanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireCapellan();
  const notificaciones = await obtenerNotificaciones(profile.id);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "var(--eje5)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-semibold text-ink">
              Bandeja del Capellán
            </span>
            <span className="font-mono text-[10px] text-ink-faint">
              Privada — solo vos la ves
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docente"
            className="hidden text-xs font-semibold text-ink-faint hover:text-ink-soft sm:inline"
          >
            Volver al panel
          </Link>
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
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 md:px-10">
        {children}
      </main>
    </div>
  );
}
