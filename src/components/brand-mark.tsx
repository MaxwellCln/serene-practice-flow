import { site } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The practice wordmark: a small harbour glyph (a "cuan" — a sheltered arc over
 * water) beside the name. Used in the header, footer, booking pages and the
 * identity band on the home page so clients always know whose practice this is.
 */

type BrandSize = "sm" | "md" | "lg";
type BrandTone = "default" | "onPrimary";

const sizes: Record<
  BrandSize,
  { glyph: string; word: string; sub: string; gap: string }
> = {
  sm: {
    glyph: "h-9 w-9",
    word: "text-2xl",
    sub: "text-[10px] tracking-[0.3em]",
    gap: "gap-2.5",
  },
  md: {
    glyph: "h-11 w-11",
    word: "text-3xl",
    sub: "text-[11px] tracking-[0.34em]",
    gap: "gap-3",
  },
  lg: {
    glyph: "h-14 w-14 md:h-16 md:w-16",
    word: "text-4xl md:text-5xl",
    sub: "text-[11px] md:text-sm tracking-[0.4em] md:tracking-[0.45em]",
    gap: "gap-4",
  },
};

export function HarbourGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 21.5a12.5 12.5 0 0 1 25 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.5 25.5c2-1.9 4-1.9 6 0s4 1.9 6 0 4-1.9 6 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="16" cy="6.6" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({
  size = "sm",
  tone = "default",
  className,
}: {
  size?: BrandSize;
  tone?: BrandTone;
  className?: string;
}) {
  const s = sizes[size];
  const onPrimary = tone === "onPrimary";

  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <HarbourGlyph
        className={cn("shrink-0", s.glyph, onPrimary ? "text-primary-foreground" : "text-primary")}
      />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display leading-none font-semibold tracking-tight",
            s.word,
            onPrimary ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {site.shortName}
        </span>
        <span
          className={cn(
            "mt-1.5 block font-sans font-medium uppercase",
            s.sub,
            onPrimary ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          Psychotherapy
        </span>
      </span>
    </span>
  );
}
