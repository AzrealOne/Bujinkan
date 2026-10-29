import type { Prisma, Role, Visibility } from "@prisma/client";

type Actor = { id: string; role: Role; dojoId: string | null };
type NoteRef = { authorId: string; dojoId: string | null; visibility: Visibility };

const LEADER_ROLES: Role[] = ["DOJO_LEITER", "DAI_SHIHAN", "ADMIN"];

export const isAdmin = (u: Actor) => u.role === "ADMIN";

/** Darf Notizen und Mitglieder dieses Dojos verwalten. */
export function isLeaderOf(u: Actor, dojoId: string | null) {
  if (isAdmin(u)) return true;
  return !!dojoId && u.dojoId === dojoId && LEADER_ROLES.includes(u.role);
}

/** Darf Inhalte für die ganze Gemeinschaft freigeben. */
export const isCommunityReviewer = (u: Actor) => u.role === "DAI_SHIHAN" || u.role === "ADMIN";

/**
 * Welche Notizen jemand sehen darf, als Datenbank-Filter:
 * eigene, gemeinschaftsweit freigegebene, im eigenen Dojo freigegebene;
 * Dojo-Leiter zusätzlich alle (auch private) Notizen des eigenen Dojos zur Sichtung;
 * Dai-Shihan zusätzlich alle Dojo-Freigaben aller Dojos zur Sichtung.
 */
export function visibleNotesWhere(u: Actor): Prisma.NoteWhereInput {
  const or: Prisma.NoteWhereInput[] = [{ authorId: u.id }, { visibility: "COMMUNITY" }];
  if (u.dojoId) {
    or.push(
      LEADER_ROLES.includes(u.role) ? { dojoId: u.dojoId } : { dojoId: u.dojoId, visibility: "DOJO" },
    );
  }
  if (isCommunityReviewer(u)) or.push({ visibility: "DOJO" });
  return { OR: or };
}

export function canViewNote(u: Actor, n: NoteRef) {
  if (n.authorId === u.id || n.visibility === "COMMUNITY") return true;
  if (n.dojoId && n.dojoId === u.dojoId) {
    if (n.visibility === "DOJO") return true;
    if (LEADER_ROLES.includes(u.role)) return true;
  }
  return n.visibility === "DOJO" && isCommunityReviewer(u);
}

export function canEditNote(u: Actor, n: NoteRef) {
  return n.authorId === u.id || isAdmin(u);
}

/** Freigabestufen, auf die diese Person die Notiz setzen darf (ohne die aktuelle). */
export function allowedVisibilityTargets(u: Actor, n: NoteRef): Visibility[] {
  const targets: Visibility[] = [];
  const leader = isLeaderOf(u, n.dojoId);
  const reviewer = isCommunityReviewer(u);
  const author = n.authorId === u.id;

  switch (n.visibility) {
    case "PRIVATE":
      if (leader && n.dojoId) targets.push("DOJO");
      // Eigene Notizen darf ein Dai-Shihan direkt für alle freigeben.
      if (reviewer && author) targets.push("COMMUNITY");
      break;
    case "DOJO":
      if (leader || author) targets.push("PRIVATE");
      if (reviewer) targets.push("COMMUNITY");
      break;
    case "COMMUNITY":
      if (reviewer) targets.push(n.dojoId ? "DOJO" : "PRIVATE");
      break;
  }
  return targets;
}

/**
 * Höchste Freigabe, die jemand für die eigene Notiz selbst halten darf.
 * Bearbeitet ein Mitglied eine freigegebene Notiz, fällt sie auf diese Stufe zurück
 * und muss neu freigegeben werden.
 */
export function maxSelfVisibility(u: Actor, n: NoteRef): Visibility {
  if (isCommunityReviewer(u)) return "COMMUNITY";
  if (isLeaderOf(u, n.dojoId)) return "DOJO";
  return "PRIVATE";
}

const ORDER: Visibility[] = ["PRIVATE", "DOJO", "COMMUNITY"];
export const visibilityRank = (v: Visibility) => ORDER.indexOf(v);

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PRIVATE: "Privat",
  DOJO: "Dojo",
  COMMUNITY: "Gemeinschaft",
};

export const ROLE_LABEL: Record<Role, string> = {
  MEMBER: "Mitglied",
  DOJO_LEITER: "Dojo-Leiter",
  DAI_SHIHAN: "Dai-Shihan",
  ADMIN: "Admin",
};
