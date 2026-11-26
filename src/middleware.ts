import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

// Só roda em /admin/*: o site público (/ e /en) não passa por aqui.
export const config = { matcher: "/admin/:path*" };

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  // Server Action: cada uma confere a sessão (requireAdmin). Redirecionar aqui levaria o painel para o login
  // no meio de uma gravação e o texto digitado se perderia.
  if (request.method === "POST" && request.headers.has("next-action")) return NextResponse.next();
  if (await readSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
