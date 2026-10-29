import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1>Anmelden</h1>
      <LoginForm />
      <p className="text-sm text-stone-600">
        Noch kein Zugang?{" "}
        <Link href="/registrieren" className="text-accent underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}
