import ContentTools from "@/components/admin/ContentTools";
import ProfileEditor from "@/components/admin/ProfileEditor";
import StorageCleanup from "@/components/admin/StorageCleanup";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const profile = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
  return (
    <>
      <h1 className="text-xl font-semibold">Perfil</h1>
      <ProfileEditor row={profile} />
      <ContentTools />
      <StorageCleanup />
    </>
  );
}
