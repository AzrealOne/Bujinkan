"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Visibility } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  allowedVisibilityTargets,
  canEditNote,
  maxSelfVisibility,
  visibilityRank,
} from "@/lib/permissions";
import { parseVideoUrl } from "@/lib/video";
import type { FormState } from "./auth";

const noteSchema = z.object({
  title: z.string().trim().min(1, "Bitte gib einen Titel an.").max(200),
  content: z.string().max(50_000, "Der Text ist zu lang."),
  categoryId: z.string().min(1, "Bitte wähle eine Kategorie."),
  videos: z.string().max(5_000).optional().default(""),
});

function parseForm(fd: FormData) {
  const parsed = noteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const lines = parsed.data.videos
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 20) return { error: "Höchstens 20 Videos pro Notiz." } as const;
  const bad = lines.find((l) => !parseVideoUrl(l));
  if (bad) return { error: `Kein gültiger YouTube- oder PeerTube-Link: ${bad}` } as const;
  return { data: { ...parsed.data, videos: lines } } as const;
}

export async function createNoteAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const res = parseForm(fd);
  if ("error" in res) return { error: res.error };
  const { title, content, categoryId, videos } = res.data;
  if (!(await prisma.category.findUnique({ where: { id: categoryId } })))
    return { error: "Unbekannte Kategorie." };

  const note = await prisma.note.create({
    data: {
      title,
      content,
      categoryId,
      authorId: user.id,
      dojoId: user.dojoId,
      videos: { create: videos.map((url, i) => ({ url, sortOrder: i })) },
    },
  });
  redirect(`/notizen/${note.id}`);
}

export async function updateNoteAction(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || !canEditNote(user, note)) notFound();
  const res = parseForm(fd);
  if ("error" in res) return { error: res.error };
  const { title, content, categoryId, videos } = res.data;
  if (!(await prisma.category.findUnique({ where: { id: categoryId } })))
    return { error: "Unbekannte Kategorie." };

  // Geänderte Inhalte müssen neu freigegeben werden, wenn der Autor die Stufe nicht selbst vergeben darf.
  const max = maxSelfVisibility(user, note);
  const visibility: Visibility =
    visibilityRank(note.visibility) > visibilityRank(max) ? max : note.visibility;

  await prisma.$transaction([
    prisma.video.deleteMany({ where: { noteId: id } }),
    prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        categoryId,
        visibility,
        videos: { create: videos.map((url, i) => ({ url, sortOrder: i })) },
      },
    }),
  ]);
  revalidatePath("/", "layout");
  redirect(`/notizen/${id}`);
}

export async function deleteNoteAction(id: string) {
  const user = await requireUser();
  const note = await prisma.note.findUnique({ where: { id }, include: { category: true } });
  if (!note || !canEditNote(user, note)) notFound();
  await prisma.note.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect(`/kategorie/${note.category.slug}`);
}

export async function setVisibilityAction(id: string, target: Visibility) {
  const user = await requireUser();
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) notFound();
  if (!allowedVisibilityTargets(user, note).includes(target)) {
    throw new Error("Keine Berechtigung für diese Freigabe.");
  }
  const now = new Date();
  await prisma.note.update({
    where: { id },
    data: {
      visibility: target,
      ...(target === "DOJO" && note.visibility === "PRIVATE"
        ? { dojoReleasedAt: now, dojoReleasedBy: user.name }
        : {}),
      ...(target === "COMMUNITY" ? { communityReleasedAt: now, communityReleasedBy: user.name } : {}),
    },
  });
  revalidatePath("/", "layout");
}
