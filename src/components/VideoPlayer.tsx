import { parseVideoUrl } from "@/lib/video";

export function VideoPlayer({ url, title }: { url: string; title?: string | null }) {
  const embed = parseVideoUrl(url);
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
        {title || url}
      </a>
    );
  }
  return (
    <figure className="space-y-1">
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={embed.embedUrl}
          title={title || "Video"}
          className="h-full w-full"
          loading="lazy"
          allow="fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>
      <figcaption className="text-xs text-stone-500">
        {embed.provider === "youtube" ? "YouTube" : "PeerTube"} ·{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          Original öffnen
        </a>
      </figcaption>
    </figure>
  );
}
