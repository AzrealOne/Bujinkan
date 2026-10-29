import Link from "next/link";
import { prisma } from "@/lib/db";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const dojos = await prisma.dojo.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1>Registrieren</h1>
      <p className="text-sm text-stone-600">
        Nach der Registrierung schaltet dich die Leitung deines Dojos frei.
      </p>
      {dojos.length === 0 ? (
        <p className="card text-sm">Es sind noch keine Dojos angelegt. Bitte wende dich an den Admin.</p>
      ) : (
        <RegisterForm dojos={dojos} />
      )}
      <p className="text-sm text-stone-600">
        Schon registriert?{" "}
        <Link href="/login" className="text-accent underline">Anmelden</Link>
      </p>
    </div>
  );
}
