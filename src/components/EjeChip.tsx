// Renders a small pill in the axis's own color. Colors come from CSS custom
// properties (--eje1..--eje5 / -tint / -deep, defined in globals.css) rather
// than Tailwind utility classes, since the axis number is only known at
// render time and Tailwind can't see a dynamically-built class name.
export function EjeChip({
  numero,
  nombre,
  size = "md",
}: {
  numero: number;
  nombre: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        size === "sm"
          ? "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          : "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
      }
      style={{
        background: `var(--eje${numero}-tint)`,
        color: `var(--eje${numero}-deep)`,
      }}
    >
      {nombre}
    </span>
  );
}

export function FamiliaBadge({ compartido }: { compartido: boolean }) {
  return (
    <span
      className={
        "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold " +
        (compartido ? "bg-good-tint text-[#0a6e0a]" : "bg-neutral-chip text-neutral-ink")
      }
    >
      {compartido ? "Sí" : "No"}
    </span>
  );
}
