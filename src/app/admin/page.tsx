import Link from "next/link";
import { requireDirectivo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EjeChip } from "@/components/EjeChip";
import { formatDate } from "@/lib/format";

function todayLabel() {
  const label = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function AdminInicioPage() {
  const profile = await requireDirectivo();
  const supabase = await createClient();

  const [{ data: encuentros }, { data: ejes }] = await Promise.all([
    supabase
      .from("encounters")
      .select(
        "id, fecha_encuentro, docente, course_id, product_id, axis_id, created_at, courses(display_name), axes(numero, nombre)",
      )
      .order("fecha_encuentro", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("axes").select("id, numero, nombre").order("sort_order"),
  ]);

  const filas = encuentros ?? [];

  const cursosParticipantes = new Set(filas.map((e) => e.course_id)).size;
  const docentesParticipantes = new Set(filas.map((e) => e.docente)).size;
  const productosDistintos = new Set(
    filas.map((e) => e.product_id).filter(Boolean),
  ).size;

  const conteoPorEje = new Map<string, number>();
  for (const e of filas) {
    if (e.axis_id) {
      conteoPorEje.set(e.axis_id, (conteoPorEje.get(e.axis_id) ?? 0) + 1);
    }
  }
  const maxEje = Math.max(1, ...(ejes ?? []).map((e) => conteoPorEje.get(e.id) ?? 0));

  const ultimos = filas.slice(0, 6);

  return (
    <div className="flex flex-col gap-7">
      <div>
        <span className="font-mono text-xs font-semibold text-ink-faint">
          {todayLabel().toUpperCase()}
        </span>
        <h1 className="mt-1 font-display text-[26px] font-semibold text-ink md:text-[30px]">
          Hola, {profile.full_name.split(" ")[0]}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-4 py-4 md:px-[22px] md:py-5">
          <span className="font-display text-[22px] font-semibold text-brand-deep md:text-[34px]">
            {filas.length}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint md:text-xs">
            Encuentros registrados
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-4 py-4 md:px-[22px] md:py-5">
          <span className="font-display text-[22px] font-semibold text-brand-deep md:text-[34px]">
            {cursosParticipantes}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint md:text-xs">
            Cursos participantes
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-4 py-4 md:px-[22px] md:py-5">
          <span className="font-display text-[22px] font-semibold text-brand-deep md:text-[34px]">
            {docentesParticipantes}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint md:text-xs">
            Docentes participantes
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-4 py-4 md:px-[22px] md:py-5">
          <span className="font-display text-[22px] font-semibold text-brand-deep md:text-[34px]">
            {productosDistintos}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint md:text-xs">
            Productos distintos
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5 md:p-[26px]">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Últimos encuentros
            </h2>
            <Link
              href="/admin/encuentros"
              className="text-[13px] font-semibold text-brand"
            >
              Ver todos →
            </Link>
          </div>

          {ultimos.length === 0 ? (
            <p className="py-4 text-sm text-ink-soft">
              Todavía no hay encuentros registrados.
            </p>
          ) : (
            <div className="flex flex-col">
              {ultimos.map((e, i) => (
                <div
                  key={e.id}
                  className={`flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:gap-3.5 ${
                    i < ultimos.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <span className="font-mono text-[12.5px] text-ink-faint sm:w-[78px]">
                    {formatDate(e.fecha_encuentro)}
                  </span>
                  <span className="text-sm font-semibold text-ink sm:w-[130px]">
                    {e.courses?.display_name}
                  </span>
                  <span className="text-[13px] text-ink-soft sm:flex-1">
                    {e.docente}
                  </span>
                  {e.axes && (
                    <EjeChip
                      numero={e.axes.numero}
                      nombre={e.axes.nombre}
                      size="sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[18px] rounded-[18px] border border-line bg-surface p-5 md:p-[26px]">
          <h2 className="font-display text-lg font-semibold text-ink">
            Encuentros por eje
          </h2>
          <div className="flex flex-col gap-3">
            {(ejes ?? []).map((e) => {
              const n = conteoPorEje.get(e.id) ?? 0;
              return (
                <div key={e.id} className="flex items-center gap-2.5">
                  <span className="w-[74px] shrink-0 text-[12.5px] text-ink-soft">
                    {e.nombre.split(" ")[0]}
                  </span>
                  <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(n / maxEje) * 100}%`,
                        background: `var(--eje${e.numero})`,
                      }}
                    />
                  </div>
                  <span className="w-[22px] shrink-0 text-right font-mono text-xs text-ink-faint">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex-1" />
          <Link
            href="/admin/estadisticas"
            className="flex items-center justify-between rounded-xl bg-brand-tint px-4 py-3.5"
          >
            <span className="text-[13px] font-semibold text-brand-deep">
              Ver estadísticas completas
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--brand-deep)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
