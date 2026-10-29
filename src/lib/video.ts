export type VideoEmbed = { provider: "youtube" | "peertube"; embedUrl: string };

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);
const YT_ID = /^[\w-]{11}$/;

/** "90", "90s", "1m30s", "1h2m3s" -> Sekunden */
function parseStart(raw: string | null): number | null {
  if (!raw) return null;
  if (/^\d+s?$/.test(raw)) return parseInt(raw, 10);
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || !raw) return null;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + +(m[3] ?? 0) || null;
}

/** Optional: PEERTUBE_HOSTS="tube.example.de,framatube.org" beschränkt PeerTube auf diese Server. */
function isAllowedPeertubeHost(host: string) {
  const list = process.env.PEERTUBE_HOSTS?.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return !list?.length || list.includes(host.toLowerCase());
}

/**
 * Erkennt YouTube- und PeerTube-Links und liefert die passende Embed-URL.
 * PeerTube läuft auf beliebigen Servern, daher wird es am Pfad erkannt
 * (/w/<id>, /videos/watch/<id>, /videos/embed/<id>).
 */
export function parseVideoUrl(raw: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start"));

  if (YT_HOSTS.has(url.hostname)) {
    let id: string | null = null;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/);
      id = m?.[1] ?? null;
    }
    if (!id || !YT_ID.test(id)) return null;
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    embed.searchParams.set("rel", "0");
    if (start) embed.searchParams.set("start", String(start));
    return { provider: "youtube", embedUrl: embed.toString() };
  }

  const m = url.pathname.match(/^\/(?:w|videos\/watch|videos\/embed)\/([\w-]+)\/?$/);
  if (m && isAllowedPeertubeHost(url.hostname)) {
    const embed = new URL(`${url.origin}/videos/embed/${m[1]}`);
    if (start) embed.searchParams.set("start", `${start}s`);
    return { provider: "peertube", embedUrl: embed.toString() };
  }
  return null;
}
