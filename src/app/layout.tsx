import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "./actions/auth";
import { isCommunityReviewer, ROLE_LABEL } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Bujinkan Wissen",
  description: "Interne Wissenssammlung",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isLeader = user && user.role !== "MEMBER";

  return (
    <html lang="de">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="font-semibold text-accent">
              武神館 Bujinkan Wissen
            </Link>
            {user && (
              <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <Link href="/">Übersicht</Link>
                <Link href="/notizen/neu">Neue Notiz</Link>
                {(isLeader || (user && isCommunityReviewer(user))) && <Link href="/freigaben">Freigaben</Link>}
                {isLeader && <Link href="/verwaltung">Verwaltung</Link>}
                <span className="ml-auto text-stone-500">
                  <Link href="/profil" className="hover:underline">
                    {user.name}
                  </Link>{" "}
                  · {ROLE_LABEL[user.role]}
                  {user.dojo ? ` · ${user.dojo.name}` : ""}
                </span>
                <form action={logoutAction}>
                  <button className="text-stone-500 hover:text-ink">Abmelden</button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
