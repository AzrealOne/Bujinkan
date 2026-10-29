import { requireUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import { PasswordForm } from "./PasswordForm";

export default async function ProfilPage() {
  const user = await requireUser();
  return (
    <div className="max-w-md space-y-4">
      <h1>Profil</h1>
      <dl className="card grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-stone-500">Name</dt><dd>{user.name}</dd>
        <dt className="text-stone-500">E-Mail</dt><dd>{user.email}</dd>
        <dt className="text-stone-500">Rolle</dt><dd>{ROLE_LABEL[user.role]}</dd>
        <dt className="text-stone-500">Dojo</dt><dd>{user.dojo?.name ?? "–"}</dd>
      </dl>
      <h2>Passwort ändern</h2>
      <PasswordForm />
    </div>
  );
}
