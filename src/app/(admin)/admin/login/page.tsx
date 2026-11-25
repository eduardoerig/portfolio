"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="card flex w-full max-w-sm flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Painel</h1>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className="rounded-md border border-current/20 bg-transparent px-3 py-2"
          />
        </label>
        {state.error && <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
