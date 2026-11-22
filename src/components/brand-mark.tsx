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
  { glyph: string; word: string; sub: string; gap: string; subMargin: string }
> = {
  sm: {
    glyph: "h-10 w-10 md:h-12 md:w-12",
    word: "text-[24px] md:text-[32px]",
    sub: "text-[9.5px] tracking-[0.28em] md:text-[11.5px] md:tracking-[0.42em]",
    gap: "gap-2.5 md:gap-3.5",
    subMargin: "mt-1.5 md:mt-2",
  },
  md: {
    glyph: "h-12 w-12 md:h-14 md:w-14",
    word: "text-3xl md:text-[40px]",
    sub: "text-[11px] tracking-[0.38em] md:text-[13px] md:tracking-[0.5em]",
    gap: "gap-3 md:gap-4",
    subMargin: "mt-2",
  },
  lg: {
    glyph: "h-16 w-16 md:h-20 md:w-20",
    word: "text-5xl md:text-6xl",
    sub: "text-sm tracking-[0.45em] md:text-[17px] md:tracking-[0.55em]",
    gap: "gap-3 md:gap-5",
    subMargin: "mt-2.5 md:mt-3.5",
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
            "block font-sans font-medium uppercase",
            s.sub,
            s.subMargin,
            onPrimary ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          Psychotherapy
        </span>
      </span>
    </span>
  );
}
