import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/logout-action";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <Link href="/docente" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className="font-mono text-xs font-semibold text-ink-faint">CSME</span>
        </Link>
        <div className="flex items-center gap-3">
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
      <main className="mx-auto max-w-md px-5 pb-16 pt-6">{children}</main>
    </div>
  );
}
