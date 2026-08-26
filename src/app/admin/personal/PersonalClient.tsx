"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Persona = {
  id: string;
  full_name: string;
  cargo: string;
  access_level: "docente" | "directivo";
  active: boolean;
  email: string | null;
  confirmado: boolean;
  ultimo_ingreso: string | null;
};

type ResultadoLink = { nombre: string; email: string; link: string };

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gestionar-personal`;

type RespuestaFuncion = { ok: boolean; error?: string; link?: string };

async function llamarFuncion(
  accion: string,
  payload: Record<string, unknown>,
): Promise<RespuestaFuncion> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, error: "Tu sesión venció. Recargá la página." };
  }

  try {
    const res = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ accion, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Ocurrió un error." };
    }
    return data as RespuestaFuncion;
  } catch {
    return { ok: false, error: "No se pudo conectar. Probá de nuevo." };
  }
}

function LinkBanner({
  resultado,
  onClose,
}: {
  resultado: ResultadoLink;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resultado.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles — el link sigue seleccionable a mano.
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-eje3 bg-eje3-tint p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-semibold text-eje3-deep">
          Link listo para {resultado.nombre} ({resultado.email})
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-eje3-deep"
        >
          Cerrar
        </button>
      </div>
      <p className="text-xs text-eje3-deep">
        Vence en un tiempo limitado — mandaselo pronto por el canal que
        prefieras. Solo tiene que abrirlo esa persona.
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={resultado.link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 font-mono text-[12px] text-ink"
        />
        <button
          type="button"
          onClick={copiar}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
        >
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function AgregarPersonaForm({
  onCreada,
  onLink,
}: {
  onCreada: (p: Persona) => void;
  onLink: (r: ResultadoLink) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [rol, setRol] = useState<"docente" | "directivo">("docente");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim() || !cargo.trim()) {
      setError("Completá nombre, email y cargo.");
      return;
    }

    setEnviando(true);
    const resultado = await llamarFuncion("crear", {
      full_name: nombre.trim(),
      email: email.trim(),
      cargo: cargo.trim(),
      access_level: rol,
    });
    setEnviando(false);

    if (!resultado.ok || !resultado.link) {
      setError(resultado.error ?? "No se pudo crear la cuenta.");
      return;
    }

    onCreada({
      // El id real lo vamos a tener recién cuando esta persona active su
      // cuenta y aparezca en profiles — mientras tanto un id temporal
      // alcanza para mostrar la fila en la tabla de esta sesión.
      id: `pendiente-${email.trim()}`,
      full_name: nombre.trim(),
      cargo: cargo.trim(),
      access_level: rol,
      active: true,
      email: email.trim(),
      confirmado: false,
      ultimo_ingreso: null,
    });
    onLink({ nombre: nombre.trim(), email: email.trim(), link: resultado.link });

    setNombre("");
    setEmail("");
    setCargo("");
    setRol("docente");
    setAbierto(false);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 self-start rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar persona
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
        />
        <input
          type="text"
          placeholder="Cargo (ej. Docente)"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          className="min-w-[160px] flex-1 rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as "docente" | "directivo")}
          className="rounded-lg border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink"
        >
          <option value="docente">Docente</option>
          <option value="directivo">Directivo</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-eje2-tint px-3.5 py-2.5 text-[13px] font-medium text-eje2-deep">
          {error}
        </p>
      )}

      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-brand-deep px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {enviando ? "Creando…" : "Crear cuenta y generar link"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-ink-faint"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function EstadoChip({ persona }: { persona: Persona }) {
  if (!persona.active) {
    return (
      <span className="rounded-full bg-neutral-chip px-2.5 py-1 text-[11px] font-semibold text-neutral-ink">
        Inactiva
      </span>
    );
  }
  if (persona.email === null) {
    return (
      <span className="rounded-full bg-neutral-chip px-2.5 py-1 text-[11px] font-semibold text-neutral-ink">
        Sin datos
      </span>
    );
  }
  if (!persona.confirmado) {
    return (
      <span className="rounded-full bg-eje4-tint px-2.5 py-1 text-[11px] font-semibold text-eje4-deep">
        Invitación pendiente
      </span>
    );
  }
  return (
    <span className="rounded-full bg-good-tint px-2.5 py-1 text-[11px] font-semibold" style={{ color: "#0a6e0a" }}>
      Activa
    </span>
  );
}

function PersonaRow({
  persona,
  onCambio,
  onLink,
}: {
  persona: Persona;
  onCambio: (p: Persona) => void;
  onLink: (r: ResultadoLink) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(persona.full_name);
  const [email, setEmail] = useState(persona.email ?? "");
  const [cargo, setCargo] = useState(persona.cargo);
  const [rol, setRol] = useState(persona.access_level);
  const [activa, setActiva] = useState(persona.active);
  const [guardando, setGuardando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [error, setError] = useState("");

  const esPendiente = persona.id.startsWith("pendiente-");

  function cancelar() {
    setNombre(persona.full_name);
    setEmail(persona.email ?? "");
    setCargo(persona.cargo);
    setRol(persona.access_level);
    setActiva(persona.active);
    setError("");
    setEditando(false);
  }

  async function guardar() {
    setError("");

    if (!nombre.trim() || !cargo.trim() || !email.trim()) {
      setError("Nombre, email y cargo no pueden quedar vacíos.");
      return;
    }

    setGuardando(true);

    // El email vive en auth.users, no en profiles — si cambió, primero se
    // actualiza vía la Edge Function (necesita permisos de admin).
    if (email.trim() !== (persona.email ?? "")) {
      const r = await llamarFuncion("editar_email", {
        user_id: persona.id,
        nuevo_email: email.trim(),
      });
      if (!r.ok) {
        setGuardando(false);
        setError(r.error ?? "No se pudo cambiar el email.");
        return;
      }
    }

    // El resto (nombre, cargo, rol, activo) vive en profiles y ya lo puede
    // tocar directo un directivo activo, gracias a profiles_update_directivo.
    const cambiosPerfil: {
      full_name?: string;
      cargo?: string;
      access_level?: string;
      active?: boolean;
    } = {};
    if (nombre.trim() !== persona.full_name) cambiosPerfil.full_name = nombre.trim();
    if (cargo.trim() !== persona.cargo) cambiosPerfil.cargo = cargo.trim();
    if (rol !== persona.access_level) cambiosPerfil.access_level = rol;
    if (activa !== persona.active) cambiosPerfil.active = activa;

    if (Object.keys(cambiosPerfil).length > 0) {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update(cambiosPerfil)
        .eq("id", persona.id);

      if (updateError) {
        setGuardando(false);
        setError("No se pudo guardar. Probá de nuevo.");
        return;
      }
    }

    setGuardando(false);
    setEditando(false);
    onCambio({
      ...persona,
      full_name: nombre.trim(),
      cargo: cargo.trim(),
      access_level: rol,
      active: activa,
      email: email.trim(),
    });
  }

  async function reenviarAcceso() {
    if (!persona.email) return;
    setError("");
    setReenviando(true);
    const r = await llamarFuncion("reenviar", { email: persona.email });
    setReenviando(false);

    if (!r.ok || !r.link) {
      setError(r.error ?? "No se pudo generar el link.");
      return;
    }
    onLink({ nombre: persona.full_name, email: persona.email, link: r.link });
  }

  if (editando) {
    return (
      <tr className="border-t border-line bg-brand-tint/40">
        <td className="px-3 py-2.5" colSpan={5}>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              className="min-w-[160px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink"
            />
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo"
              className="min-w-[140px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink"
            />
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as "docente" | "directivo")}
              className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink"
            >
              <option value="docente">Docente</option>
              <option value="directivo">Directivo</option>
            </select>
            <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                checked={activa}
                onChange={(e) => setActiva(e.target.checked)}
              />
              Activa
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="rounded-full bg-brand-deep px-4 py-2 text-[12.5px] font-semibold text-white disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink-faint"
              >
                Cancelar
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-2 rounded-lg bg-eje2-tint px-3 py-2 text-[12.5px] font-medium text-eje2-deep">
              {error}
            </p>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-line">
      <td className="px-3 py-3 text-[13.5px] font-semibold text-ink">
        {persona.full_name}
      </td>
      <td className="px-3 py-3 text-[13px] text-ink-soft">
        {persona.email ?? "—"}
      </td>
      <td className="px-3 py-3 text-[13px] text-ink-soft">{persona.cargo}</td>
      <td className="px-3 py-3">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={
            persona.access_level === "directivo"
              ? { background: "var(--brand-tint)", color: "var(--brand-deep)" }
              : { background: "var(--neutral-chip)", color: "var(--neutral-ink)" }
          }
        >
          {persona.access_level === "directivo" ? "Directivo" : "Docente"}
        </span>
      </td>
      <td className="px-3 py-3">
        <EstadoChip persona={persona} />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-3">
          {error && (
            <span className="text-[11.5px] font-medium text-eje2-deep">{error}</span>
          )}
          <button
            type="button"
            onClick={reenviarAcceso}
            disabled={reenviando || esPendiente || !persona.email}
            title={esPendiente ? "Se puede reenviar una vez que aparezca en el sistema" : undefined}
            className="whitespace-nowrap text-[12.5px] font-semibold text-brand disabled:opacity-40"
          >
            {reenviando ? "Generando…" : "Reenviar acceso"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(true)}
            disabled={esPendiente}
            className="whitespace-nowrap text-[12.5px] font-semibold text-ink-faint disabled:opacity-40"
          >
            Editar
          </button>
        </div>
      </td>
    </tr>
  );
}

export function PersonalClient({
  personasIniciales,
  emailsDisponibles,
}: {
  personasIniciales: Persona[];
  emailsDisponibles: boolean;
}) {
  const [personas, setPersonas] = useState(personasIniciales);
  const [linkActual, setLinkActual] = useState<ResultadoLink | null>(null);

  function actualizarPersona(actualizada: Persona) {
    setPersonas((prev) =>
      prev.map((p) => (p.id === actualizada.id ? actualizada : p)),
    );
  }

  function agregarPersona(nueva: Persona) {
    setPersonas((prev) => [...prev, nueva]);
  }

  const directivos = personas.filter((p) => p.access_level === "directivo");
  const docentes = personas.filter((p) => p.access_level === "docente");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink md:text-[26px]">
          Personal
        </h1>
        <span className="text-sm text-ink-faint">
          {personas.length} persona{personas.length === 1 ? "" : "s"}
        </span>
      </div>

      {!emailsDisponibles && (
        <p className="rounded-lg bg-eje4-tint px-4 py-3 text-[13px] font-medium text-eje4-deep">
          No se pudo cargar el estado de las cuentas por ahora. Podés seguir
          editando cargo y rol; el email de cada persona no se ve hasta que
          se recupere la conexión.
        </p>
      )}

      {linkActual && (
        <LinkBanner resultado={linkActual} onClose={() => setLinkActual(null)} />
      )}

      <AgregarPersonaForm onCreada={agregarPersona} onLink={setLinkActual} />

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              {["Nombre", "Email", "Cargo", "Rol", "Estado", ""].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-ink-faint"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {directivos.map((p) => (
              <PersonaRow
                key={p.id}
                persona={p}
                onCambio={actualizarPersona}
                onLink={setLinkActual}
              />
            ))}
            {docentes.map((p) => (
              <PersonaRow
                key={p.id}
                persona={p}
                onCambio={actualizarPersona}
                onLink={setLinkActual}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
