/** Converts a YouTube or Vimeo link into a safe embed URL, or null if unsupported. */
export function toVideoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const idOk = (id: string | null | undefined) => (id && /^[\w-]{6,20}$/.test(id) ? id : null);

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id =
      idOk(url.searchParams.get("v")) ??
      idOk(url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = idOk(url.pathname.slice(1));
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,12})/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
