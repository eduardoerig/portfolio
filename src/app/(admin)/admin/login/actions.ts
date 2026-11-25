"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, hasPasswordConfigured, hasSessionSecret, SESSION_COOKIE, SESSION_SECONDS, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!hasPasswordConfigured()) return { error: "Senha do painel não configurada" };
  if (!hasSessionSecret()) return { error: "Segredo de sessão não configurado" };

  if (!(await verifyPassword(String(formData.get("password") ?? "")))) {
    await new Promise((resolve) => setTimeout(resolve, 500)); // freia tentativas em massa
    return { error: "Senha incorreta" };
  }

  (await cookies()).set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
