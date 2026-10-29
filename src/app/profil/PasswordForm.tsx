"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../actions/auth";
import { FormMessage } from "@/components/FormMessage";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="card space-y-3">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="current">Aktuelles Passwort</label>
        <input className="input" id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <label className="label" htmlFor="next">Neues Passwort (mind. 10 Zeichen)</label>
        <input className="input" id="next" name="next" type="password" minLength={10} autoComplete="new-password" required />
      </div>
      <button className="btn" disabled={pending}>Speichern</button>
    </form>
  );
}
