import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleNotesWhere } from "@/lib/permissions";
import { NoteList } from "@/components/NoteList";

const FILTERS = {
  alle: "Alle",
  meine: "Meine",
  dojo: "Mein Dojo",
  gemeinschaft: "Gemeinschaft",
} as const;
type Filter = keyof typeof FILTERS;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ansicht?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const sp = await searchParams;
  const filter: Filter = sp.ansicht && sp.ansicht in FILTERS ? (sp.ansicht as Filter) : "alle";
  const q = sp.q?.trim().slice(0, 100) ?? "";

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const and: Prisma.NoteWhereInput[] = [visibleNotesWhere(user), { categoryId: category.id }];
  if (filter === "meine") and.push({ authorId: user.id });
  if (filter === "dojo") and.push({ dojoId: user.dojoId ?? "__none__" });
  if (filter === "gemeinschaft") and.push({ visibility: "COMMUNITY" });
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const notes = await prisma.note.findMany({
    where: { AND: and },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      author: { select: { name: true } },
      dojo: { select: { name: true } },
      _count: { select: { videos: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-stone-500">{category.kind === "RYUHA" ? "Ryūha" : "Waffe"}</p>
          <h1>{category.name}</h1>
        </div>
        <Link href={`/notizen/neu?kategorie=${category.slug}`} className="btn">+ Notiz in dieser Kategorie</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <Link
            key={f}
            href={`?ansicht=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={f === filter ? "btn" : "btn-secondary"}
          >
            {FILTERS[f]}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="ansicht" value={filter} />
          <input className="input" name="q" placeholder="Suchen …" defaultValue={q} />
        </form>
      </div>

      <NoteList notes={notes} empty="Hier gibt es noch keine Notizen für dich." />
    </div>
  );
}
