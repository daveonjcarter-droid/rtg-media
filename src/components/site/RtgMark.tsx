import { cn } from "@/lib/utils";

/**
 * RtgMark renders the "RTG" brand stamp in the gothic/blackletter face,
 * paired inline with a sibling word in the current sans-serif heading face.
 *
 * Usage:
 *   <RtgMark>Breakdown</RtgMark>            -> RTG Breakdown
 *   <RtgMark word="Picks" />                -> RTG Picks
 *   <RtgMark only />                        -> RTG (just the stamp)
 *
 * The component keeps both halves on the same baseline and matches the
 * cap-height of the surrounding heading. Use inside an existing heading
 * (h1/h2/h3) so it inherits the size.
 */
interface RtgMarkProps {
  /** The word(s) to render after RTG, in the heading sans face. */
  children?: React.ReactNode;
  /** Alt to children. */
  word?: React.ReactNode;
  /** Render only the gothic RTG stamp. */
  only?: boolean;
  /** Optional className applied to the wrapping span. */
  className?: string;
  /** Override the sans face used for the trailing word. */
  wordClassName?: string;
  /** Override the gothic mark className (e.g. color tweaks). */
  markClassName?: string;
}

const RtgMark = ({
  children,
  word,
  only = false,
  className,
  wordClassName,
  markClassName,
}: RtgMarkProps) => {
  const trailing = children ?? word;
  return (
    <span className={cn("inline-flex items-baseline gap-[0.18em] whitespace-nowrap", className)}>
      <span
        className={cn(
          "font-gothic leading-[0.85] tracking-[0.02em]",
          markClassName,
        )}
        style={{ fontSize: "1.18em" }}
        aria-label="RTG"
      >
        RTG
      </span>
      {!only && trailing != null && (
        <span className={cn("font-display tracking-wide", wordClassName)}>{trailing === "Media" ? "\n" : trailing}</span>
      )}
    </span>
  );
};

export default RtgMark;
