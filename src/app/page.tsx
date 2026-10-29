import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleNotesWhere } from "@/lib/permissions";
import { NoteList } from "@/components/NoteList";

export default async function Home() {
  const user = await requireUser();
  const where = visibleNotesWhere(user);

  const [categories, counts, recent] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] }),
    prisma.note.groupBy({ by: ["categoryId"], where, _count: true }),
    prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        author: { select: { name: true } },
        dojo: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { videos: true } },
      },
    }),
  ]);
  const countOf = new Map(counts.map((c) => [c.categoryId, c._count]));

  const section = (kind: "RYUHA" | "WAFFE", title: string) => (
    <section className="space-y-2">
      <h2>{title}</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <Link key={c.id} href={`/kategorie/${c.slug}`} className="card flex items-center justify-between hover:border-accent">
              <span>{c.name}</span>
              <span className="text-sm text-stone-500">{countOf.get(c.id) ?? 0}</span>
            </Link>
          ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1>Übersicht</h1>
        <Link href="/notizen/neu" className="btn">+ Neue Notiz</Link>
      </div>
      {section("RYUHA", "Die 7 Ryūha")}
      {section("WAFFE", "Waffen (Bukiwaza)")}
      <section className="space-y-2">
        <h2>Zuletzt bearbeitet</h2>
        <NoteList notes={recent} empty="Noch keine Notizen sichtbar. Leg die erste an!" />
      </section>
    </div>
  );
}
