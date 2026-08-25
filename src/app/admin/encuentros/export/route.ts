import { NextRequest, NextResponse } from "next/server";
import { requireDirectivo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { consultaEncuentros, leerFiltros } from "@/lib/admin-encuentros";
import { formatDate } from "@/lib/format";

function csvCell(value: string): string {
  const v = value ?? "";
  if (/[",\n;]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET(request: NextRequest) {
  // requireDirectivo redirects on failure, which is the right behavior for
  // a page but not for a file download — a directivo-only route handler
  // still needs the same check, so an unauthenticated/non-directivo caller
  // simply gets redirected to /login (or /docente) instead of a CSV.
  await requireDirectivo();

  const filtros = leerFiltros(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  const supabase = await createClient();
  const { data: encuentros, error } = await consultaEncuentros(
    supabase,
    filtros,
  );

  if (error) {
    return NextResponse.json(
      { error: "No se pudo generar la exportación." },
      { status: 500 },
    );
  }

  const encabezado = [
    "Fecha",
    "Nivel",
    "Curso",
    "Docente",
    "Eje",
    "Contenidos",
    "Actividades",
    "Producto",
    "Compartido con familias",
    "Registrado el",
  ];

  const filas = (encuentros ?? []).map((e) =>
    [
      formatDate(e.fecha_encuentro),
      e.courses?.nivel ?? "",
      e.courses?.display_name ?? "",
      e.docente,
      e.axes?.nombre ?? "",
      e.contenidos,
      e.actividades,
      e.products?.nombre ?? "",
      e.compartido_familia ? "Sí" : "No",
      formatDate(e.created_at.slice(0, 10)),
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = "﻿" + [encabezado.join(","), ...filas].join("\r\n");

  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="encuentros-csme-${fecha}.csv"`,
    },
  });
}
