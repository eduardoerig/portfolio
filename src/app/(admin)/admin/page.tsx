import ProfileForm from "@/components/admin/ProfileForm";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const profile = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
  // Campos nulos viram texto vazio para os inputs.
  const row = Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, typeof v === "boolean" ? v : String(v ?? "")]));
  return (
    <>
      <h1 className="text-xl font-semibold">Perfil</h1>
      <ProfileForm row={row as React.ComponentProps<typeof ProfileForm>["row"]} />
    </>
  );
}
