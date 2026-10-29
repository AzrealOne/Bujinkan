"use client";

import { useActionState } from "react";
import { registerAction } from "../actions/auth";
import { FormMessage } from "@/components/FormMessage";

export function RegisterForm({ dojos }: { dojos: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  if (state?.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="card space-y-3">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="email">E-Mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Passwort (mind. 10 Zeichen)</label>
        <input className="input" id="password" name="password" type="password" minLength={10} autoComplete="new-password" required />
      </div>
      <div>
        <label className="label" htmlFor="dojoId">Dojo</label>
        <select className="input" id="dojoId" name="dojoId" required defaultValue="">
          <option value="" disabled>Bitte wählen …</option>
          {dojos.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <button className="btn w-full" disabled={pending}>Registrieren</button>
    </form>
  );
}
