// Estado de una situación reportada al EOE: Pendiente, En seguimiento o
// Cerrada. Un solo lugar para los tres colores — se usa en la vista del
// docente, la mesa de trabajo del EOE y el panel directivo.
const ESTILOS: Record<string, { background: string; color: string }> = {
  Pendiente: { background: "var(--eje4-tint)", color: "var(--eje4-deep)" },
  "En seguimiento": { background: "var(--brand-tint)", color: "var(--brand-deep)" },
  Cerrada: { background: "var(--good-tint)", color: "#0a6e0a" },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const estilo = ESTILOS[estado] ?? {
    background: "var(--neutral-chip)",
    color: "var(--neutral-ink)",
  };
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={estilo}
    >
      {estado}
    </span>
  );
}
