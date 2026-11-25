import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "./login/actions";
import { readSession, SESSION_COOKIE } from "@/lib/session";

const links = [
  ["/admin", "Perfil"],
  ["/admin/projetos", "Projetos"],
  ["/admin/experiencias", "Experiências"],
  ["/admin/competencias", "Competências"],
  ["/admin/formacao", "Formação"],
];

// A página de login também mora em /admin: sem sessão, não mostra o menu.
export default async function AdminChrome({ children }: { children: React.ReactNode }) {
  const logged = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!logged) return children;

  return (
    <>
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-6 pt-6 text-sm">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="btn">{label}</Link>
        ))}
        <a href="/" target="_blank" className="btn">Ver site</a>
        <form action={logout} className="ml-auto"><button type="submit" className="btn">Sair</button></form>
      </nav>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">{children}</main>
    </>
  );
}
