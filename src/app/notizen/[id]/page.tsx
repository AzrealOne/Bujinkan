import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { allowedVisibilityTargets, canEditNote, canViewNote, VISIBILITY_LABEL, visibilityRank } from "@/lib/permissions";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DeleteNoteButton } from "./DeleteNoteButton";
import { setVisibilityAction, deleteNoteAction } from "../../actions/notes";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      dojo: { select: { name: true } },
      category: true,
      videos: { orderBy: { sortOrder: "asc" } },
    },
  });
  // Nicht sichtbare Notizen wie nicht vorhandene behandeln.
  if (!note || !canViewNote(user, note)) notFound();

  const targets = allowedVisibilityTargets(user, note);
  const canEdit = canEditNote(user, note);

  return (
    <article className="max-w-3xl space-y-5">
      <div className="space-y-1">
        <Link href={`/kategorie/${note.category.slug}`} className="text-sm text-stone-500 hover:underline">
          ← {note.category.name}
        </Link>
        <h1>{note.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <VisibilityBadge v={note.visibility} />
          <span>
            {note.author.name}
            {note.dojo ? ` (${note.dojo.name})` : ""} · zuletzt geändert {note.updatedAt.toLocaleString("de-DE")}
          </span>
        </div>
        {(note.dojoReleasedBy || note.communityReleasedBy) && (
          <p className="text-xs text-stone-500">
            {note.dojoReleasedBy && `Für das Dojo freigegeben von ${note.dojoReleasedBy}. `}
            {note.communityReleasedBy && `Für die Gemeinschaft freigegeben von ${note.communityReleasedBy}.`}
          </p>
        )}
      </div>

      {(targets.length > 0 || canEdit) && (
        <div className="flex flex-wrap gap-2">
          {targets.map((t) => (
            <form key={t} action={setVisibilityAction.bind(null, note.id, t)}>
              <button className={visibilityRank(t) > visibilityRank(note.visibility) ? "btn" : "btn-secondary"}>
                {visibilityRank(t) > visibilityRank(note.visibility)
                  ? `Freigeben: ${VISIBILITY_LABEL[t]}`
                  : `Zurückstufen auf ${VISIBILITY_LABEL[t]}`}
              </button>
            </form>
          ))}
          {canEdit && (
            <>
              <Link href={`/notizen/${note.id}/bearbeiten`} className="btn-secondary">Bearbeiten</Link>
              <DeleteNoteButton action={deleteNoteAction.bind(null, note.id)} />
            </>
          )}
        </div>
      )}

      {note.videos.length > 0 && (
        <div className="space-y-4">
          {note.videos.map((v) => (
            <VideoPlayer key={v.id} url={v.url} title={v.title} />
          ))}
        </div>
      )}

      <div className="prose-note card">
        {note.content.trim() ? <Markdown>{note.content}</Markdown> : <p className="text-stone-500">Kein Text.</p>}
      </div>
    </article>
  );
}
