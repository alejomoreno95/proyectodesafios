export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const EJE_COLOR_VARS: Record<number, string> = {
  1: "eje1",
  2: "eje2",
  3: "eje3",
  4: "eje4",
  5: "eje5",
};

export function ejeColorSlug(numero: number): string {
  return EJE_COLOR_VARS[numero] ?? "eje1";
}
