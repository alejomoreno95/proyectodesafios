"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

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

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-ink-soft">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-[10px] border border-line bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-brand"
              placeholder="nombre@csme.edu.ar"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-ink-soft">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-[10px] border border-line bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-brand"
              placeholder="••••••••••"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-eje2-tint px-4 py-3 text-sm font-medium text-eje2-deep">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>

      <p className="relative mt-10 text-center text-xs text-ink-faint">
        Acceso exclusivo para el personal de CSME
      </p>
    </div>
  );
}
