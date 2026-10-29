"use client";

import { useActionState } from "react";
import { createDojoAction } from "../actions/admin";
import { FormMessage } from "@/components/FormMessage";

export function DojoForm() {
  const [state, action, pending] = useActionState(createDojoAction, undefined);
  return (
    <form action={action} className="card max-w-md space-y-2">
      <FormMessage state={state} />
      <label className="label" htmlFor="dojo-name">Neues Dojo</label>
      <div className="flex gap-2">
        <input className="input" id="dojo-name" name="name" required placeholder="z. B. Dojo Musterstadt" />
        <button className="btn" disabled={pending}>Anlegen</button>
      </div>
    </form>
  );
}
