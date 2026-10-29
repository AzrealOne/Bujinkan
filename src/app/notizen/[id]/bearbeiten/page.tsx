import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditNote, maxSelfVisibility, VISIBILITY_LABEL, visibilityRank } from "@/lib/permissions";
import { NoteForm } from "@/components/NoteForm";
import { updateNoteAction } from "../../../actions/notes";

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: { videos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!note || !canEditNote(user, note)) notFound();

  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true, kind: true },
  });
  const max = maxSelfVisibility(user, note);
  const warning =
    visibilityRank(note.visibility) > visibilityRank(max)
      ? `Diese Notiz ist freigegeben (${VISIBILITY_LABEL[note.visibility]}). Nach dem Speichern ist sie wieder „${VISIBILITY_LABEL[max]}“ und muss neu freigegeben werden.`
      : undefined;

  return (
    <div className="max-w-3xl space-y-4">
      <h1>Notiz bearbeiten</h1>
      <NoteForm
        action={updateNoteAction.bind(null, note.id)}
        categories={categories}
        initial={{
          title: note.title,
          content: note.content,
          categoryId: note.categoryId,
          videos: note.videos.map((v) => v.url).join("\n"),
        }}
        submitLabel="Änderungen speichern"
        warning={warning}
      />
    </div>
  );
}
