import { requireDirectivo } from "@/lib/auth";
import { logout } from "@/app/logout-action";
import { AdminNavDesktop, AdminNavMobile } from "./AdminNav";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireDirectivo();

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] min-w-[240px] flex-col bg-brand-deep p-4 pt-6 md:flex">
        <div className="flex items-center gap-2.5 px-2.5 pb-7 pt-1.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/15">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-semibold text-white">
              Desafíos
            </span>
            <span className="font-mono text-[10px] text-[#8fa9c9]">CSME</span>
          </div>
        </div>

        <AdminNavDesktop />

        <div className="flex-1" />

        <div className="flex items-center gap-2.5 border-t border-white/10 p-3">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#8fa9c9] text-[13px] font-bold text-brand-deep">
            {initials(profile.full_name)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold text-white">
              {profile.full_name}
            </span>
            <span className="text-[11.5px] text-[#8fa9c9]">
              {profile.cargo}
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Salir"
              className="text-[#8fa9c9] hover:text-white"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-brand">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className="font-display text-[15px] font-semibold text-ink">
            Desafíos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-xs font-bold text-brand-deep">
            {initials(profile.full_name)}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs font-semibold text-ink-faint"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden px-5 py-6 pb-24 md:px-12 md:py-10 md:pb-10">
        {children}
      </main>

      <AdminNavMobile />
    </div>
  );
}
