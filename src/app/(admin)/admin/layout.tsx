import { cookies } from "next/headers";
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

  const [profile, projetos, experiencias, competencias, formacao] = await Promise.all([
    db.profile.findUnique({ where: { id: 1 }, select: { name: true, photoPath: true } }),
    db.project.count(),
    db.experience.count(),
    db.skill.count(),
    db.education.count(),
  ]);

  return (
    <AdminStatusProvider>
      <div className="flex min-h-screen flex-col">
        <AdminHeader name={profile?.name ?? "Admin"} photoPath={profile?.photoPath ?? null} />
        <div className="flex flex-1">
          <Sidebar counts={{ projetos, experiencias, competencias, formacao }} />
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">{children}</main>
        </div>
      </div>
      <Toast />
    </AdminStatusProvider>
  );
}
