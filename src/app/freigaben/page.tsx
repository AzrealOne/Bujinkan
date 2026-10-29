import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isCommunityReviewer } from "@/lib/permissions";
import { NoteList } from "@/components/NoteList";

const include = {
  author: { select: { name: true } },
  dojo: { select: { name: true } },
  category: { select: { name: true } },
  _count: { select: { videos: true } },
} as const;

export default async function ReviewPage() {
  const user = await requireUser();
  const leader = user.role !== "MEMBER";
  if (!leader) notFound();

  // Dojo-Leiter: private Notizen anderer Mitglieder des eigenen Dojos.
  const dojoQueue =
    user.dojoId || isAdmin(user)
      ? await prisma.note.findMany({
          where: {
            visibility: "PRIVATE",
            authorId: { not: user.id },
            ...(isAdmin(user) ? { dojoId: { not: null } } : { dojoId: user.dojoId }),
          },
          orderBy: { updatedAt: "desc" },
          take: 200,
          include,
        })
      : [];

  // Dai-Shihan: Dojo-Freigaben aller Dojos, die noch nicht gemeinschaftsweit sind.
  const communityQueue = isCommunityReviewer(user)
    ? await prisma.note.findMany({
        where: { visibility: "DOJO" },
        orderBy: { dojoReleasedAt: "desc" },
        take: 200,
        include,
      })
    : [];

  return (
    <div className="space-y-8">
      <h1>Freigaben</h1>
      <section className="space-y-2">
        <h2>Private Notizen {isAdmin(user) ? "aller Dojos" : "deines Dojos"}</h2>
        <p className="text-sm text-stone-600">Öffne eine Notiz, um sie für das Dojo freizugeben.</p>
        <NoteList notes={dojoQueue} empty="Keine privaten Notizen zum Sichten." />
      </section>
      {isCommunityReviewer(user) && (
        <section className="space-y-2">
          <h2>Dojo-Freigaben – Kandidaten für die Gemeinschaft</h2>
          <p className="text-sm text-stone-600">Diese Notizen sind in ihrem Dojo freigegeben und können für alle Dojos freigegeben werden.</p>
          <NoteList notes={communityQueue} empty="Keine Dojo-Freigaben offen." />
        </section>
      )}
    </div>
  );
}
