import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, ROLE_LABEL } from "@/lib/permissions";
import { setUserStatusAction, updateUserAction } from "../actions/admin";
import { DojoForm } from "./DojoForm";

const STATUS_LABEL = { PENDING: "Wartet", ACTIVE: "Aktiv", DISABLED: "Gesperrt" } as const;

export default async function AdminPage() {
  const me = await requireUser();
  if (me.role === "MEMBER") notFound();
  const admin = isAdmin(me);
  if (!admin && !me.dojoId) {
    return <p>Du bist keinem Dojo zugeordnet. Bitte wende dich an den Admin.</p>;
  }

  const [users, dojos] = await Promise.all([
    prisma.user.findMany({
      where: admin ? {} : { dojoId: me.dojoId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, status: true, dojoId: true, dojo: { select: { name: true } } },
    }),
    prisma.dojo.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { users: true } } } }),
  ]);
  const pending = users.filter((u) => u.status === "PENDING");
  const canManage = (u: (typeof users)[number]) => u.id !== me.id && (admin || u.role === "MEMBER");

  return (
    <div className="space-y-8">
      <h1>Verwaltung</h1>

      <section className="space-y-2">
        <h2>Wartende Registrierungen ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-stone-500">Niemand wartet auf Freischaltung.</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className="font-medium">{u.name}</span>
                <span className="text-sm text-stone-500">{u.email} · {u.dojo?.name ?? "kein Dojo"}</span>
                {canManage(u) && (
                  <span className="ml-auto flex gap-2">
                    <form action={setUserStatusAction.bind(null, u.id, "ACTIVE")}>
                      <button className="btn">Freischalten</button>
                    </form>
                    <form action={setUserStatusAction.bind(null, u.id, "DISABLED")}>
                      <button className="btn-secondary">Ablehnen</button>
                    </form>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2>Mitglieder{admin ? "" : ` – ${me.dojo?.name}`}</h2>
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">{admin ? "Rolle / Dojo" : "Rolle"}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {users.filter((u) => u.status !== "PENDING").map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2">
                    {u.name}
                    <div className="text-xs text-stone-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-2">{STATUS_LABEL[u.status]}</td>
                  <td className="px-3 py-2">
                    {admin && u.id !== me.id ? (
                      <form action={updateUserAction.bind(null, u.id)} className="flex flex-wrap gap-2">
                        <select name="role" defaultValue={u.role} className="input w-auto py-1">
                          {Object.entries(ROLE_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <select name="dojoId" defaultValue={u.dojoId ?? ""} className="input w-auto py-1">
                          <option value="">kein Dojo</option>
                          {dojos.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <button className="btn-secondary py-1">Speichern</button>
                      </form>
                    ) : (
                      <>
                        {ROLE_LABEL[u.role]}
                        {admin && u.dojo ? ` · ${u.dojo.name}` : ""}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canManage(u) &&
                      (u.status === "ACTIVE" ? (
                        <form action={setUserStatusAction.bind(null, u.id, "DISABLED")}>
                          <button className="btn-secondary py-1 text-red-700">Sperren</button>
                        </form>
                      ) : (
                        <form action={setUserStatusAction.bind(null, u.id, "ACTIVE")}>
                          <button className="btn-secondary py-1">Entsperren</button>
                        </form>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {admin && (
        <section className="space-y-2">
          <h2>Dojos</h2>
          <ul className="text-sm">
            {dojos.map((d) => (
              <li key={d.id}>{d.name} <span className="text-stone-500">({d._count.users} Mitglieder)</span></li>
            ))}
          </ul>
          <DojoForm />
        </section>
      )}
    </div>
  );
}
