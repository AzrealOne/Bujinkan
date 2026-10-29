"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { FormMessage } from "./FormMessage";

type Category = { id: string; name: string; kind: "RYUHA" | "WAFFE" };

export function NoteForm({
  action,
  categories,
  initial,
  submitLabel,
  warning,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  categories: Category[];
  initial?: { title: string; content: string; categoryId: string; videos: string };
  submitLabel: string;
  warning?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      {warning && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{warning}</p>}
      <div>
        <label className="label" htmlFor="title">Titel</label>
        <input className="input" id="title" name="title" required maxLength={200} defaultValue={initial?.title} />
      </div>
      <div>
        <label className="label" htmlFor="categoryId">Kategorie</label>
        <select className="input" id="categoryId" name="categoryId" required defaultValue={initial?.categoryId ?? ""}>
          <option value="" disabled>Bitte wählen …</option>
          <optgroup label="Ryūha">
            {categories.filter((c) => c.kind === "RYUHA").map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </optgroup>
          <optgroup label="Waffen">
            {categories.filter((c) => c.kind === "WAFFE").map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </optgroup>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="content">Notiz (Markdown möglich: **fett**, # Überschrift, - Liste)</label>
        <textarea className="input min-h-64 font-mono" id="content" name="content" defaultValue={initial?.content} />
      </div>
      <div>
        <label className="label" htmlFor="videos">Videos – ein YouTube- oder PeerTube-Link pro Zeile</label>
        <textarea
          className="input min-h-24 font-mono"
          id="videos"
          name="videos"
          placeholder={"https://www.youtube.com/watch?v=...\nhttps://peertube.example/w/..."}
          defaultValue={initial?.videos}
        />
      </div>
      <button className="btn" disabled={pending}>{submitLabel}</button>
    </form>
  );
}
