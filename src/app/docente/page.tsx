import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EjeChip } from "@/components/EjeChip";
import { formatDate } from "@/lib/format";

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function todayLabel() {
  const label = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.toUpperCase();
}

export default async function DocenteInicioPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${firstOfNextMonth.getFullYear()}-${String(firstOfNextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ count: encuentrosEsteMes }, { data: ultimo }] = await Promise.all([
    supabase
      .from("encounters")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("fecha_encuentro", monthStart)
      .lt("fecha_encuentro", monthEnd),
    supabase
      .from("encounters")
      .select("fecha_encuentro, courses(display_name), axes(numero, nombre)")
      .eq("user_id", profile.id)
      .order("fecha_encuentro", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="font-mono text-[11.5px] font-semibold tracking-wide text-ink-faint">
          {todayLabel()}
        </span>
        <h1 className="mt-1 font-display text-[28px] font-semibold text-ink">
          Hola, {firstName(profile.full_name)}
        </h1>
      </div>

      <Link
        href="/docente/nuevo"
        className="flex flex-col gap-4 rounded-[20px] bg-brand px-6 py-6 text-white transition-transform active:scale-[0.98]"
      >
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-white/15">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div>
          <div className="font-display text-[21px] font-semibold">
            Nuevo Encuentro
          </div>
          <div className="mt-0.5 text-[13.5px] text-[#c7d9f2]">
            Registrá lo que trabajaste hoy — 1 a 2 minutos
          </div>
        </div>
      </Link>

      <Link
        href="/docente/mis-encuentros"
        className="flex items-center justify-between rounded-[18px] border border-line bg-surface px-[22px] py-5"
      >
        <div>
          <div className="text-[15.5px] font-bold text-ink">Mis Encuentros</div>
          <div className="mt-0.5 text-[13px] text-ink-soft">
            {encuentrosEsteMes ?? 0} registrados este mes
          </div>
        </div>
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink-faint)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {ultimo && (
        <div className="flex flex-col gap-2">
          <span className="pl-0.5 text-xs font-semibold tracking-wide text-ink-faint">
            ÚLTIMO REGISTRADO
          </span>
          <div className="flex items-center justify-between rounded-[14px] border border-line bg-surface px-4 py-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">
                {ultimo.courses?.display_name}
              </span>
              <span className="font-mono text-xs text-ink-faint">
                {formatDate(ultimo.fecha_encuentro)}
              </span>
            </div>
            {ultimo.axes && (
              <EjeChip
                numero={ultimo.axes.numero}
                nombre={ultimo.axes.nombre}
                size="sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
