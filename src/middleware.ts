import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/registrieren"];

// Grobe Vorabprüfung: ohne Sitzungs-Cookie direkt zum Login.
// Die eigentliche Prüfung (gültige Sitzung, aktiver Benutzer, Rechte) passiert serverseitig in jeder Seite.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.has("bjk_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
