"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Estado =
  | "cargando"
  | "confirmar"
  | "confirmando"
  | "listo"
  | "invalido"
  | "guardando"
  | "hecho";

const MENSAJES_ERROR: Record<string, string> = {
  otp_expired: "Este link de invitación venció. Pedile a la escuela que te reenvíe uno nuevo.",
  access_denied: "Este link ya fue usado o no es válido. Pedile a la escuela que te reenvíe la invitación.",
};

const MENSAJE_GENERICO = "Este link no es válido o venció. Pedile a la escuela que te reenvíe la invitación.";

// Un link vencido o ya usado vuelve con el error en el hash en vez de una
// sesión. Se lee una sola vez, sincrónicamente, para el estado inicial —
// nunca en un efecto — así no hay un parpadeo de "cargando" de por medio.
function leerErrorDelHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hashError = hash.get("error_code") ?? hash.get("error");
  if (!hashError) return null;
  return MENSAJES_ERROR[hashError] ?? MENSAJE_GENERICO;
}

// El link del mail apunta a esta página con ?token_hash=...&type=invite en
// vez de directo al endpoint de Supabase — así la verificación (que
// consume el link, de un solo uso) sólo pasa cuando la persona hace clic
// en "Activar mi cuenta" acá adentro, nunca por un rastreador de emails
// que abre el link solo para escanearlo antes de que lo veas vos.
function leerTokenDeQuery(): { tokenHash: string; type: EmailOtpType } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  if (!tokenHash || !type) return null;
  return { tokenHash, type };
}

export default function AceptarInvitacionPage() {
  const router = useRouter();
  const errorInicial = leerErrorDelHash();
  const tokenInicial = leerTokenDeQuery();
  const [estado, setEstado] = useState<Estado>(() => {
    if (errorInicial) return "invalido";
    if (tokenInicial) return "confirmar";
    return "cargando";
  });
  const [error, setError] = useState<string>(errorInicial ?? "");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // Si ya hay una sesión activa (por ejemplo, un link viejo de otro
    // formato que el cliente ya procesó solo) saltamos directo al
    // formulario de contraseña. Si no hay token en la URL ni sesión,
    // el link está roto.
    if (errorInicial || tokenInicial) return;

    const supabase = createClient();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        window.history.replaceState(null, "", window.location.pathname);
        setEstado("listo");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.history.replaceState(null, "", window.location.pathname);
        setEstado("listo");
      }
    });

    const timeout = setTimeout(() => {
      setEstado((actual) => {
        if (actual !== "cargando") return actual;
        setError(MENSAJE_GENERICO);
        return "invalido";
      });
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleActivar() {
    if (!tokenInicial) return;
    setEstado("confirmando");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenInicial.tokenHash,
      type: tokenInicial.type,
    });

    if (verifyError) {
      window.history.replaceState(null, "", window.location.pathname);
      setError(
        verifyError.message.toLowerCase().includes("expired")
          ? MENSAJES_ERROR.otp_expired
          : MENSAJE_GENERICO,
      );
      setEstado("invalido");
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
    setEstado("listo");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (password.length < 8) {
      setFormError("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setEstado("guardando");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setFormError("No pudimos guardar la contraseña. Probá de nuevo.");
      setEstado("listo");
      return;
    }

    setEstado("hecho");
    setTimeout(() => router.push("/"), 1200);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-6 py-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-tint" />
      <div className="pointer-events-none absolute left-[-70px] top-24 h-32 w-32 rounded-full bg-brand-tint opacity-70" />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
            Proyecto Desafíos
          </h1>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-brand-tint px-2.5 py-1 font-mono text-xs font-semibold text-brand">
              CSME
            </span>
            <span className="text-sm text-ink-soft">Libro de temas digital</span>
          </div>
        </div>

        {estado === "cargando" && (
          <p className="text-sm text-ink-soft">Verificando tu invitación…</p>
        )}

        {estado === "invalido" && (
          <div className="flex flex-col gap-4">
            <p className="rounded-lg bg-eje2-tint px-4 py-3 text-sm font-medium text-eje2-deep">
              {error}
            </p>
          </div>
        )}

        {(estado === "confirmar" || estado === "confirmando") && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              ¡Bienvenido/a a Proyecto Desafíos! Tocá el botón para activar tu cuenta.
            </p>
            <button
              type="button"
              onClick={handleActivar}
              disabled={estado === "confirmando"}
              className="mt-2 rounded-full bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
            >
              {estado === "confirmando" ? "Activando…" : "Activar mi cuenta"}
            </button>
          </div>
        )}

        {(estado === "listo" || estado === "guardando") && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              ¡Bienvenido/a! Elegí una contraseña para tu cuenta.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-ink-soft">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[10px] border border-line bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-brand"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmar" className="text-sm font-semibold text-ink-soft">
                Confirmar contraseña
              </label>
              <input
                id="confirmar"
                name="confirmar"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="rounded-[10px] border border-line bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-brand"
                placeholder="••••••••••"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-eje2-tint px-4 py-3 text-sm font-medium text-eje2-deep">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={estado === "guardando"}
              className="mt-2 rounded-full bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
            >
              {estado === "guardando" ? "Guardando…" : "Crear contraseña e ingresar"}
            </button>
          </form>
        )}

        {estado === "hecho" && (
          <p className="rounded-lg bg-eje3-tint px-4 py-3 text-sm font-medium text-eje3-deep">
            ¡Listo! Te llevamos a tu cuenta…
          </p>
        )}
      </div>

      <p className="relative mt-10 text-center text-xs text-ink-faint">
        Acceso exclusivo para el personal de CSME
      </p>
    </div>
  );
}
