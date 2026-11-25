"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearFailures, clientIp, registerAttempt } from "@/lib/loginLimit";
import { createSession, hasPasswordConfigured, hasSessionSecret, SESSION_COOKIE, SESSION_SECONDS, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!hasPasswordConfigured()) return { error: "Senha do painel não configurada" };
  if (!hasSessionSecret()) return { error: "Segredo de sessão não configurado" };

  // A tentativa conta antes de conferir a senha (pedidos em paralelo também contam).
  // Mais de 5 em 15 min pelo mesmo IP: nem confere a senha.
  const ip = clientIp(await headers());
  if (await registerAttempt(ip)) return { error: "Muitas tentativas. Tente de novo em alguns minutos." };

  if (!(await verifyPassword(String(formData.get("password") ?? "")))) {
    await new Promise((resolve) => setTimeout(resolve, 500)); // freia tentativas em massa
    return { error: "Senha incorreta" };
  }
  await clearFailures(ip);

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
