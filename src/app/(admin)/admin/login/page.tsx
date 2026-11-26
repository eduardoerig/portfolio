"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/admin/controls";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundImage:
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <form action={formAction} className="card card-static flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-mono text-xl text-[var(--accent)]">&gt; admin</h1>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        {state.error && <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
