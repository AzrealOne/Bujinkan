"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";

export type FormState = { error?: string; success?: string } | undefined;

// Wird verglichen, wenn es die E-Mail nicht gibt, damit die Antwortzeit nichts verrät.
const DUMMY_HASH = bcrypt.hashSync("kein-benutzer", 12);

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "E-Mail oder Passwort ist falsch." };
  if (user.status === "PENDING")
    return { error: "Dein Zugang wurde noch nicht freigeschaltet. Bitte wende dich an deinen Dojo-Leiter." };
  if (user.status === "DISABLED") return { error: "Dein Zugang ist gesperrt." };
  await createSession(user.id);
  redirect("/");
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Bitte gib deinen Namen an.").max(100),
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail an."),
  password: z.string().min(10, "Das Passwort muss mindestens 10 Zeichen haben.").max(200),
  dojoId: z.string().min(1, "Bitte wähle dein Dojo."),
});

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, dojoId } = parsed.data;

  const dojo = await prisma.dojo.findUnique({ where: { id: dojoId } });
  if (!dojo) return { error: "Dieses Dojo gibt es nicht." };
  if (await prisma.user.findUnique({ where: { email } }))
    return { error: "Für diese E-Mail gibt es schon einen Zugang." };

  await prisma.user.create({
    data: { name, email, dojoId, passwordHash: await bcrypt.hash(password, 12) },
  });
  return {
    success: `Danke! Dein Zugang wartet auf Freischaltung durch die Leitung von „${dojo.name}“.`,
  };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const pwSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(10, "Das neue Passwort muss mindestens 10 Zeichen haben.").max(200),
});

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = pwSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash)))
    return { error: "Das aktuelle Passwort stimmt nicht." };
  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) },
  });
  // Alle anderen Sitzungen abmelden und neu anmelden.
  await prisma.session.deleteMany({ where: { userId: me.id } });
  await createSession(me.id);
  return { success: "Passwort geändert." };
}
