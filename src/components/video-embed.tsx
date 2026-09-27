import { toVideoEmbedUrl } from "@/lib/video";

export function VideoEmbed({ url, title }: { url: string | null; title: string }) {
  const src = toVideoEmbedUrl(url);
  if (!src) return null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
