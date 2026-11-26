import { cookies } from "next/headers";
import { fileUrl } from "@/lib/fileUrl";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminStatusProvider } from "@/components/admin/AdminStatus";
import Sidebar from "@/components/admin/Sidebar";
import Toast from "@/components/admin/Toast";
import { db } from "@/lib/db";
import { readSession, SESSION_COOKIE } from "@/lib/session";

// A página de login também mora em /admin: sem sessão, não mostra o painel.
export default async function AdminChrome({ children }: { children: React.ReactNode }) {
  const logged = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!logged) return children;

  const [profile, projetos, experiencias, competencias, formacao, idiomas] = await Promise.all([
    db.profile.findUnique({ where: { id: 1 }, select: { name: true, photoPath: true } }),
    db.project.count(),
    db.experience.count(),
    db.skill.count(),
    db.education.count(),
    db.language.count(),
  ]);

  return (
    <AdminStatusProvider>
      <div className="flex min-h-screen flex-col">
        <AdminHeader name={profile?.name ?? "Admin"} photoPath={fileUrl(profile?.photoPath)} />
        <div className="flex flex-1">
          <Sidebar counts={{ projetos, experiencias, competencias, formacao, idiomas }} />
          <main id="conteudo" tabIndex={-1} className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 p-4 outline-none md:p-6">{children}</main>
        </div>
      </div>
      <Toast />
    </AdminStatusProvider>
  );
}
