import { requireDirectivo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function ultimosNMeses(n: number, hasta: Date): { clave: string; etiqueta: string }[] {
  const meses: { clave: string; etiqueta: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hasta.getFullYear(), hasta.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({ clave, etiqueta: MESES[d.getMonth()] });
  }
  return meses;
}

export default async function EstadisticasPage() {
  await requireDirectivo();
  const supabase = await createClient();

  const { data: encuentros } = await supabase
    .from("encounters")
    .select(
      "id, fecha_encuentro, docente, course_id, product_id, axis_id, compartido_familia, courses(nivel, display_name), axes(numero, nombre), products(nombre)",
    );

  const { data: ejes } = await supabase
    .from("axes")
    .select("id, numero, nombre")
    .order("sort_order");
  const { data: productosCatalogo } = await supabase
    .from("products")
    .select("id, nombre")
    .order("sort_order");

  const filas = encuentros ?? [];
  const total = filas.length;
  const cursosParticipantes = new Set(filas.map((e) => e.course_id)).size;
  const docentesParticipantes = new Set(filas.map((e) => e.docente)).size;
  const productosDistintos = new Set(
    filas.map((e) => e.product_id).filter(Boolean),
  ).size;

  // Por eje
  const porEje = new Map<string, number>();
  for (const e of filas) {
    if (e.axis_id) porEje.set(e.axis_id, (porEje.get(e.axis_id) ?? 0) + 1);
  }
  const maxEje = Math.max(1, ...(ejes ?? []).map((e) => porEje.get(e.id) ?? 0));

  // Por nivel
  const porNivel = new Map<string, number>();
  for (const e of filas) {
    const nivel = e.courses?.nivel;
    if (nivel) porNivel.set(nivel, (porNivel.get(nivel) ?? 0) + 1);
  }
  const maxNivel = Math.max(1, ...Array.from(porNivel.values()));

  // Compartido con familias
  const compartidos = filas.filter((e) => e.compartido_familia).length;
  const noCompartidos = total - compartidos;
  const pctCompartido = total > 0 ? Math.round((compartidos / total) * 100) : 0;
  const anilloGrados = total > 0 ? (compartidos / total) * 360 : 0;

  // Productos más usados
  const porProducto = new Map<string, number>();
  for (const e of filas) {
    if (e.product_id) porProducto.set(e.product_id, (porProducto.get(e.product_id) ?? 0) + 1);
  }
  const rankingProductos = (productosCatalogo ?? [])
    .map((p) => ({ nombre: p.nombre, n: porProducto.get(p.id) ?? 0 }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const maxProducto = Math.max(1, ...rankingProductos.map((p) => p.n));

  // Evolución en el tiempo — últimos 6 meses
  const ahora = new Date();
  const meses = ultimosNMeses(6, ahora);
  const porMes = new Map<string, number>();
  for (const e of filas) {
    const clave = e.fecha_encuentro.slice(0, 7);
    porMes.set(clave, (porMes.get(clave) ?? 0) + 1);
  }
  const serie = meses.map((m) => ({ ...m, n: porMes.get(m.clave) ?? 0 }));
  const maxSerie = Math.max(1, ...serie.map((p) => p.n));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink md:text-[26px]">
          Estadísticas
        </h1>
        <p className="text-sm text-ink-faint">
          Un vistazo al avance institucional del proyecto
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KpiCard num={total} lbl="Encuentros" />
        <KpiCard num={cursosParticipantes} lbl="Cursos participantes" />
        <KpiCard num={docentesParticipantes} lbl="Docentes participantes" />
        <KpiCard num={productosDistintos} lbl="Productos distintos" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <Card titulo="Encuentros por eje">
          {total === 0 ? (
            <SinDatos />
          ) : (
            <div className="flex items-end gap-4 px-1 pt-2" style={{ height: 160 }}>
              {(ejes ?? []).map((e) => {
                const n = porEje.get(e.id) ?? 0;
                const alto = Math.round((n / maxEje) * 110) + (n > 0 ? 10 : 0);
                return (
                  <div key={e.id} className="flex flex-1 flex-col items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink">
                      {n}
                    </span>
                    <div
                      className="w-full max-w-[52px] rounded-t-[6px] rounded-b-[2px]"
                      style={{
                        height: alto,
                        background: `var(--eje${e.numero})`,
                      }}
                    />
                    <span className="text-center text-[11.5px] text-ink-soft">
                      {e.nombre.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card titulo="Compartido con familias" centrado>
          {total === 0 ? (
            <SinDatos />
          ) : (
            <>
              <div
                className="flex h-[150px] w-[150px] items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--good) 0deg ${anilloGrados}deg, var(--neutral-chip) ${anilloGrados}deg 360deg)`,
                }}
              >
                <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-surface">
                  <span className="font-mono text-2xl font-semibold text-ink">
                    {pctCompartido}%
                  </span>
                  <span className="text-[10.5px] text-ink-faint">compartido</span>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <span
                    className="h-[9px] w-[9px] rounded-full"
                    style={{ background: "var(--good)" }}
                  />
                  Sí ({compartidos})
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <span
                    className="h-[9px] w-[9px] rounded-full border-[1.5px]"
                    style={{
                      background: "var(--neutral-chip)",
                      borderColor: "var(--ink-faint)",
                    }}
                  />
                  No ({noCompartidos})
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr]">
        <Card titulo="Encuentros por nivel">
          {total === 0 ? (
            <SinDatos />
          ) : (
            <div className="flex flex-col gap-4 pt-1.5">
              {["Primaria", "Secundaria"].map((nivel) => {
                const n = porNivel.get(nivel) ?? 0;
                return (
                  <div key={nivel} className="flex items-center gap-3">
                    <span className="w-[78px] shrink-0 text-[13px] text-ink-soft">
                      {nivel}
                    </span>
                    <div className="h-[14px] flex-1 overflow-hidden rounded-[7px] bg-surface-2">
                      <div
                        className="h-full rounded-[7px]"
                        style={{
                          width: `${(n / maxNivel) * 100}%`,
                          background: nivel === "Primaria" ? "var(--brand)" : "#6f9bd0",
                        }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right font-mono text-[12.5px] text-ink">
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card titulo="Evolución de encuentros">
          {total === 0 ? (
            <SinDatos />
          ) : (
            <SerieMensual serie={serie} maxSerie={maxSerie} />
          )}
        </Card>
      </div>

      <Card titulo="Productos más utilizados">
        {rankingProductos.length === 0 ? (
          <SinDatos />
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {rankingProductos.map((p) => (
              <div key={p.nombre} className="flex items-center gap-3.5">
                <span className="w-[150px] shrink-0 truncate text-[13px] text-ink-soft md:w-[170px]">
                  {p.nombre}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface-2">
                  <div
                    className="h-full rounded bg-brand"
                    style={{ width: `${(p.n / maxProducto) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-[12.5px] text-ink">
                  {p.n}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiCard({ num, lbl }: { num: number; lbl: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface px-4 py-3.5 md:px-5 md:py-4">
      <span className="font-display text-xl font-semibold text-brand-deep md:text-[26px]">
        {num}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint md:text-[11.5px]">
        {lbl}
      </span>
    </div>
  );
}

function Card({
  titulo,
  centrado,
  children,
}: {
  titulo: string;
  centrado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5 md:p-[26px] ${
        centrado ? "items-center" : ""
      }`}
    >
      <span className={`text-[15px] font-bold text-ink ${centrado ? "self-start" : ""}`}>
        {titulo}
      </span>
      {children}
    </div>
  );
}

function SinDatos() {
  return (
    <p className="py-6 text-center text-sm text-ink-soft">
      Todavía no hay datos para mostrar.
    </p>
  );
}

function SerieMensual({
  serie,
  maxSerie,
}: {
  serie: { clave: string; etiqueta: string; n: number }[];
  maxSerie: number;
}) {
  const w = 560;
  const h = 180;
  const padTop = 20;
  const padBottom = 40;
  const plotH = h - padTop - padBottom;
  const step = serie.length > 1 ? (w - 40) / (serie.length - 1) : 0;

  const puntos = serie.map((p, i) => {
    const x = 20 + step * i;
    const y = padTop + plotH - (p.n / maxSerie) * plotH;
    return { x, y, n: p.n, etiqueta: p.etiqueta };
  });

  const lineaPuntos = puntos.map((p) => `${p.x},${p.y}`).join(" L");
  const area = `M${puntos[0].x},${padTop + plotH} L${lineaPuntos} L${puntos[puntos.length - 1].x},${padTop + plotH} Z`;

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Evolución de encuentros por mes: ${serie
        .map((s) => `${s.etiqueta} ${s.n}`)
        .join(", ")}`}
    >
      {[0, 1, 2, 3].map((i) => {
        const y = padTop + (plotH / 3) * i;
        return (
          <line
            key={i}
            x1={20}
            y1={y}
            x2={w - 20}
            y2={y}
            stroke="var(--line)"
            strokeWidth={1}
          />
        );
      })}
      <path d={area} fill="var(--brand-tint)" opacity={0.7} />
      <polyline
        points={puntos.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {puntos.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === puntos.length - 1 ? 5.5 : 3.5}
          fill="var(--brand)"
          stroke={i === puntos.length - 1 ? "#fff" : undefined}
          strokeWidth={i === puntos.length - 1 ? 2 : undefined}
        />
      ))}
      {puntos.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fontWeight={600}
          fill="var(--brand-deep)"
        >
          {p.n}
        </text>
      ))}
      {puntos.map((p, i) => (
        <text
          key={`lbl-${i}`}
          x={p.x}
          y={h - 8}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize="11.5"
          fill="var(--ink-faint)"
        >
          {p.etiqueta}
        </text>
      ))}
    </svg>
  );
}
