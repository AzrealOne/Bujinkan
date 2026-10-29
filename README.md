# Bujinkan Wissen

Interne Wissenssammlung für Bujinkan-Dojos: Notizen und Videos zu den 7 Ryūha und den Waffen.
Nur für registrierte und freigeschaltete Mitglieder nutzbar.

## Rollen und Freigaben

Jede Notiz hat eine Freigabestufe: **Privat → Dojo → Gemeinschaft**.

| Rolle | Darf |
|---|---|
| Mitglied | eigene Notizen schreiben (zuerst privat) |
| Dojo-Leiter | alle Notizen des eigenen Dojos sehen und fürs Dojo freigeben, Mitglieder des Dojos freischalten und sperren |
| Dai-Shihan | wie Dojo-Leiter, zusätzlich Dojo-Freigaben aller Dojos für die ganze Gemeinschaft freigeben |
| Admin | Dojos anlegen, Rollen und Dojo-Zuordnung vergeben, alle Mitglieder verwalten |

- Neue Registrierungen warten, bis die Dojo-Leitung oder ein Admin sie freischaltet.
- Bearbeitet jemand eine Notiz, deren Freigabe er nicht selbst vergeben darf, wird sie wieder privat und muss neu freigegeben werden.

## Videos

Pro Notiz können YouTube- und PeerTube-Links eingetragen werden (ein Link pro Zeile). Sie werden direkt auf der Seite abgespielt.
YouTube läuft über `youtube-nocookie.com`. Mit `PEERTUBE_HOSTS` lassen sich die erlaubten PeerTube-Server festlegen.

## Lokal starten

Voraussetzungen: Node.js 20+ und eine Postgres-Datenbank (z. B. per `docker compose up -d`).

```bash
cp .env.example .env      # Werte anpassen, v. a. das Admin-Passwort
npm install
npm run db:migrate        # Tabellen anlegen
npm run db:seed           # Kategorien und ersten Admin anlegen
npm run dev               # http://localhost:3000
```

Danach als Admin anmelden, unter **Verwaltung** die Dojos anlegen und die ersten Dojo-Leiter festlegen.

## Produktion

```bash
npm run build
npm run db:deploy
npm run db:seed
npm start
```

Die Seite unbedingt nur über HTTPS betreiben (Sitzungs-Cookies sind in Produktion auf `secure` gesetzt).

## Technik

Next.js 15 (App Router, Server Actions), Prisma 6 mit PostgreSQL, Tailwind CSS 4.
Anmeldung über eigene Sitzungen in der Datenbank (bcrypt-Passwörter, httpOnly-Cookie).
Rechte-Logik zentral in `src/lib/permissions.ts`.
