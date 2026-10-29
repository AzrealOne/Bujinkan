"use client";

import { useActionState } from "react";
import { loginAction } from "../actions/auth";
import { FormMessage } from "@/components/FormMessage";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="card space-y-3">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">E-Mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Passwort</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn w-full" disabled={pending}>Anmelden</button>
    </form>
  );
}
