import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { NoteForm } from "@/components/NoteForm";
import { createNoteAction } from "../../actions/notes";

export default async function NewNotePage({ searchParams }: { searchParams: Promise<{ kategorie?: string }> }) {
  await requireUser();
  const { kategorie } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true, kind: true, slug: true },
  });
  const preset = categories.find((c) => c.slug === kategorie)?.id ?? "";
  return (
    <div className="max-w-3xl space-y-4">
      <h1>Neue Notiz</h1>
      <p className="text-sm text-stone-600">
        Neue Notizen sind zuerst privat. Die Leitung deines Dojos kann sie für das Dojo freigeben.
      </p>
      <NoteForm
        action={createNoteAction}
        categories={categories}
        initial={{ title: "", content: "", categoryId: preset, videos: "" }}
        submitLabel="Speichern"
      />
    </div>
  );
}
