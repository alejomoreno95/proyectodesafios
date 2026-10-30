"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Mismos literales que Role/Alcance en @/lib/auth — se redeclaran acá en
// vez de importarlos porque ese módulo es "server-only" y este componente
// corre en el cliente.
type Role = "docente" | "directivo" | "eoe" | "administrador" | "preceptor" | "capellan";
type Alcance = "Primaria" | "Secundaria" | "Total";

const TODOS_LOS_ROLES: Role[] = [
  "docente",
  "preceptor",
  "directivo",
  "eoe",
  "capellan",
  "administrador",
];

const ROLE_LABELS: Record<Role, string> = {
  docente: "Docente",
  preceptor: "Preceptor",
  directivo: "Directivo",
  eoe: "EOE",
  capellan: "Capellán",
  administrador: "Administrador",
};

const ROLE_STYLES: Record<Role, { background: string; color: string }> = {
  docente: { background: "var(--neutral-chip)", color: "var(--neutral-ink)" },
  preceptor: { background: "var(--eje1-tint)", color: "var(--eje1-deep)" },
  directivo: { background: "var(--brand-tint)", color: "var(--brand-deep)" },
  eoe: { background: "var(--eje3-tint)", color: "var(--eje3-deep)" },
  capellan: { background: "var(--eje5-tint)", color: "var(--eje5-deep)" },
  administrador: { background: "var(--eje2-tint)", color: "var(--eje2-deep)" },
};

export type Persona = {
  id: string;
  full_name: string;
  cargo: string;
  access_level: "docente" | "directivo";
  active: boolean;
  email: string | null;
  confirmado: boolean;
  ultimo_ingreso: string | null;
  roles: Role[];
  alcance: Alcance;
  ver_situaciones_eoe: boolean;
  ver_notas_eoe: boolean;
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
      // Mismos valores por defecto que pone el trigger handle_new_user()
      // al crear la cuenta — se pueden ajustar después editando la fila.
      roles: rol === "directivo" ? ["docente", "directivo"] : ["docente"],
      alcance: "Total",
      ver_situaciones_eoe: false,
      ver_notas_eoe: false,
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

      <p className="text-[12px] text-ink-faint">
        Después de crearla podés sumarle rol de EOE, administrador, el
        alcance (Primaria/Secundaria/Total) y los permisos sobre
        situaciones, editando la fila en la tabla.
      </p>

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

function RolesChips({ roles }: { roles: Role[] }) {
  if (roles.length === 0) {
    return <span className="text-[12px] text-ink-faint">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={ROLE_STYLES[r]}
        >
          {ROLE_LABELS[r]}
        </span>
      ))}
    </div>
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
  const [activa, setActiva] = useState(persona.active);
  const [roles, setRoles] = useState<Role[]>(persona.roles);
  const [alcance, setAlcance] = useState<Alcance>(persona.alcance);
  const [verSituaciones, setVerSituaciones] = useState(persona.ver_situaciones_eoe);
  const [verNotas, setVerNotas] = useState(persona.ver_notas_eoe);
  const [guardando, setGuardando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [error, setError] = useState("");

  const esPendiente = persona.id.startsWith("pendiente-");

  function cancelar() {
    setNombre(persona.full_name);
    setEmail(persona.email ?? "");
    setCargo(persona.cargo);
    setActiva(persona.active);
    setRoles(persona.roles);
    setAlcance(persona.alcance);
    setVerSituaciones(persona.ver_situaciones_eoe);
    setVerNotas(persona.ver_notas_eoe);
    setError("");
    setEditando(false);
  }

  function toggleRole(r: Role) {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
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

    // access_level sigue siendo el campo legado que usa /admin para dejar
    // entrar — se mantiene en sincronía con roles acá mismo, igual que lo
    // hace el trigger handle_new_user() al crear la cuenta.
    const nuevoAccessLevel: "docente" | "directivo" = roles.includes("directivo")
      ? "directivo"
      : "docente";
    const rolesClave = (arr: Role[]) => [...arr].sort().join(",");

    // El resto (nombre, cargo, roles, alcance, permisos, activo) vive en
    // profiles y ya lo puede tocar directo un directivo activo, gracias a
    // profiles_update_directivo.
    const cambiosPerfil: {
      full_name?: string;
      cargo?: string;
      access_level?: string;
      active?: boolean;
      roles?: Role[];
      alcance?: Alcance;
      ver_situaciones_eoe?: boolean;
      ver_notas_eoe?: boolean;
    } = {};
    if (nombre.trim() !== persona.full_name) cambiosPerfil.full_name = nombre.trim();
    if (cargo.trim() !== persona.cargo) cambiosPerfil.cargo = cargo.trim();
    if (activa !== persona.active) cambiosPerfil.active = activa;
    if (rolesClave(roles) !== rolesClave(persona.roles)) cambiosPerfil.roles = roles;
    if (nuevoAccessLevel !== persona.access_level) cambiosPerfil.access_level = nuevoAccessLevel;
    if (alcance !== persona.alcance) cambiosPerfil.alcance = alcance;
    if (verSituaciones !== persona.ver_situaciones_eoe) cambiosPerfil.ver_situaciones_eoe = verSituaciones;
    if (verNotas !== persona.ver_notas_eoe) cambiosPerfil.ver_notas_eoe = verNotas;

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
      access_level: nuevoAccessLevel,
      active: activa,
      email: email.trim(),
      roles,
      alcance,
      ver_situaciones_eoe: verSituaciones,
      ver_notas_eoe: verNotas,
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
        <td className="px-3 py-3" colSpan={7}>
          <div className="flex flex-col gap-3">
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
              <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                />
                Activa
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-line/60 pt-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Roles
                </span>
                {TODOS_LOS_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                    <input
                      type="checkbox"
                      checked={roles.includes(r)}
                      onChange={() => toggleRole(r)}
                    />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Alcance
                </span>
                <select
                  value={alcance}
                  onChange={(e) => setAlcance(e.target.value as Alcance)}
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink"
                >
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Total">Total</option>
                </select>
              </label>

              {roles.includes("directivo") && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                    Permisos EOE
                  </span>
                  <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                    <input
                      type="checkbox"
                      checked={verSituaciones}
                      onChange={(e) => setVerSituaciones(e.target.checked)}
                    />
                    Ver situaciones
                  </label>
                  <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                    <input
                      type="checkbox"
                      checked={verNotas}
                      onChange={(e) => setVerNotas(e.target.checked)}
                    />
                    Ver notas
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="self-start rounded-full bg-brand-deep px-4 py-2 text-[12.5px] font-semibold text-white disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="self-start rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink-faint"
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
        <RolesChips roles={persona.roles} />
      </td>
      <td className="px-3 py-3 text-[13px] text-ink-soft">{persona.alcance}</td>
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
        <table className="w-full min-w-[840px] border-collapse">
          <thead>
            <tr>
              {["Nombre", "Email", "Cargo", "Roles", "Alcance", "Estado", ""].map((h) => (
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
