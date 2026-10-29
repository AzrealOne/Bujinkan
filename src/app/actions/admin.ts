"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import type { FormState } from "./auth";

async function loadManageable(userId: string) {
  const actor = await requireUser();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.id === actor.id) throw new Error("Nicht erlaubt.");
  // Dojo-Leiter verwalten nur einfache Mitglieder des eigenen Dojos, Admins alle.
  const ok = isAdmin(actor) || (isLeaderOf(actor, target.dojoId) && target.role === "MEMBER");
  if (!ok) throw new Error("Keine Berechtigung.");
  return { actor, target };
}

export async function setUserStatusAction(userId: string, status: UserStatus) {
  await loadManageable(userId);
  await prisma.user.update({ where: { id: userId }, data: { status } });
  if (status !== "ACTIVE") await prisma.session.deleteMany({ where: { userId } });
  revalidatePath("/verwaltung");
}

const ROLES: Role[] = ["MEMBER", "DOJO_LEITER", "DAI_SHIHAN", "ADMIN"];

export async function updateUserAction(userId: string, fd: FormData) {
  const { actor } = await loadManageable(userId);
  if (!isAdmin(actor)) throw new Error("Nur Admins dürfen Rollen und Dojos ändern.");
  const role = String(fd.get("role")) as Role;
  const dojoId = String(fd.get("dojoId") ?? "") || null;
  if (!ROLES.includes(role)) throw new Error("Unbekannte Rolle.");
  if (dojoId && !(await prisma.dojo.findUnique({ where: { id: dojoId } })))
    throw new Error("Unbekanntes Dojo.");
  await prisma.user.update({ where: { id: userId }, data: { role, dojoId } });
  revalidatePath("/verwaltung");
}

const dojoSchema = z.object({ name: z.string().trim().min(2, "Name zu kurz.").max(100) });

export async function createDojoAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser();
  if (!isAdmin(actor)) return { error: "Nur Admins dürfen Dojos anlegen." };
  const parsed = dojoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await prisma.dojo.findUnique({ where: { name: parsed.data.name } }))
    return { error: "Dieses Dojo gibt es schon." };
  await prisma.dojo.create({ data: { name: parsed.data.name } });
  revalidatePath("/verwaltung");
  return { success: `Dojo „${parsed.data.name}“ angelegt.` };
}
