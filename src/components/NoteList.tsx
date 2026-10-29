import Link from "next/link";
import type { Visibility } from "@prisma/client";
import { VisibilityBadge } from "./VisibilityBadge";

export type NoteListItem = {
  id: string;
  title: string;
  visibility: Visibility;
  updatedAt: Date;
  author: { name: string };
  dojo: { name: string } | null;
  category?: { name: string };
  _count?: { videos: number };
};

export function NoteList({ notes, empty }: { notes: NoteListItem[]; empty: string }) {
  if (notes.length === 0) return <p className="text-sm text-stone-500">{empty}</p>;
  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {notes.map((n) => (
        <li key={n.id}>
          <Link href={`/notizen/${n.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-stone-50">
            <span className="font-medium">{n.title}</span>
            <VisibilityBadge v={n.visibility} />
            {!!n._count?.videos && <span className="text-xs text-stone-500">▶ {n._count.videos}</span>}
            <span className="ml-auto text-xs text-stone-500">
              {n.category ? `${n.category.name} · ` : ""}
              {n.author.name}
              {n.dojo ? ` (${n.dojo.name})` : ""} · {n.updatedAt.toLocaleDateString("de-DE")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
