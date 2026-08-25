import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EjeChip } from "@/components/EjeChip";
import { formatDate } from "@/lib/format";

export default async function MisEncuentrosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: encuentros } = await supabase
    .from("encounters")
    .select(
      "id, fecha_encuentro, courses(display_name), axes(numero, nombre), products(nombre)",
    )
    .eq("user_id", profile.id)
    .order("fecha_encuentro", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="relative flex flex-col gap-4 pb-16">
      <h1 className="font-display text-[21px] font-semibold text-ink">
        Mis Encuentros
      </h1>

      {(!encuentros || encuentros.length === 0) && (
        <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
          <p className="text-[14.5px] text-ink-soft">
            Todavía no registraste ningún encuentro.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {encuentros?.map((enc) => (
          <div
            key={enc.id}
            className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface px-4 py-[15px]"
          >
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
              <div className="text-[13.5px] text-ink-soft">
                {enc.products.nombre}
              </div>
            )}
          </div>
        ))}
      </div>

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
    </div>
  );
}
