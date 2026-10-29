"use client";

export function DeleteNoteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Notiz wirklich löschen?")) e.preventDefault();
      }}
    >
      <button className="btn-secondary text-red-700">Löschen</button>
    </form>
  );
}
