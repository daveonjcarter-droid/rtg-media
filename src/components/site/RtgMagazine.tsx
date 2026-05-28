import { ReactNode, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import EmptyState from "./EmptyState";

/* ============================================================================
   RTG MAGAZINE — shared primitives for the Articles experience.
   ========================================================================= */

export type MagArticle = {
  id: string;
  slug?: string | null;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  body?: string | null;
  body_blocks?: any[] | null;
  cover_image_url?: string | null;
  published_at?: string | null;
  tags?: string[] | null;
  writer_name?: string | null;
  article_type?: string | null;
};

/* ---------- helpers ---------- */

const PAD = (n: number) => String(n).padStart(3, "0");

export const articleNo = (a: MagArticle, fallback = 1) => {
  // derive a stable 3-digit number from id (or fallback index)
  const seed = (a.id || "").replace(/\D/g, "").slice(-3);
  const n = seed ? parseInt(seed, 10) : fallback;
  return PAD(((n - 1) % 999) + 1);
};

export const formatMagDate = (d?: string | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).toUpperCase();
  } catch {
    return "";
  }
};

export const readTime = (a: MagArticle) => {
  let words = 0;
  if (a.body) words += a.body.trim().split(/\s+/).length;
  if (Array.isArray(a.body_blocks)) {
    for (const b of a.body_blocks) {
      if (typeof b?.text === "string") words += b.text.trim().split(/\s+/).length;
    }
  }
  if (!a.body && !a.body_blocks?.length && a.excerpt) {
    words += a.excerpt.trim().split(/\s+/).length * 4;
  }
  const min = Math.max(1, Math.round(words / 220));
  return `${min} MIN`;
};

/** Split a title into top/out (cream / red outline) on a word boundary near the middle. */
export const splitTitle = (title: string): { top: string; out: string } => {
  const words = (title || "").trim().split(/\s+/);
  if (words.length <= 1) return { top: title || "", out: "" };
  if (words.length === 2) return { top: words[0], out: words[1] };
  const mid = Math.ceil(words.length / 2);
  return { top: words.slice(0, mid).join(" "), out: words.slice(mid).join(" ") };
};

/** Parse inline **bold**, *italic*, ==highlight==. */
export const renderInline = (text: string): ReactNode[] => {
  if (!text) return [];
  const tokens: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      tokens.push(<strong key={i++} className="text-cream">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("==")) {
      tokens.push(<span key={i++} className="rtg-mark">{tok.slice(2, -2)}</span>);
    } else {
      tokens.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
};

/* ---------- presentational primitives ---------- */

/** L-shaped corner brackets in all 4 corners of a relatively-positioned parent. */
export const CornerFrame = ({ tone = "cream" }: { tone?: "cream" | "primary" }) => {
  const color = tone === "primary" ? "border-primary" : "border-cream/60";
  return (
    <>
      {[
        "top-2 left-2 border-l border-t",
        "top-2 right-2 border-r border-t",
        "bottom-2 left-2 border-l border-b",
        "bottom-2 right-2 border-r border-b",
      ].map((p) => (
        <span key={p} aria-hidden className={`pointer-events-none absolute h-3.5 w-3.5 ${p} ${color}`} />
      ))}
    </>
  );
};

export const FlagTag = ({ children, size = "md" }: { children: ReactNode; size?: "sm" | "md" }) => (
  <span className={`rtg-flag ${size === "sm" ? "rtg-flag--sm" : ""}`}>{children}</span>
);

export const IssueRule = ({ children = "Issue 001 · Spring 2026" }: { children?: ReactNode }) => (
  <div className="rtg-issue-rule">{children}</div>
);

/* ---------- ticker ---------- */

const TICKER_WORDS = [
  "ENTERTAINMENT", "SPORTS", "ANIME", "STREETWEAR",
  "CULTURE", "MUSIC", "FILM", "FASHION",
];

export const AsteriskTicker = () => (
  <div className="overflow-hidden border-y border-border bg-ink/60 py-3">
    <div className="rtg-ticker">
      {[0, 1].map((dup) => (
        <div key={dup} className="flex shrink-0 items-center gap-6 pr-6" aria-hidden={dup === 1}>
          {TICKER_WORDS.map((w) => (
            <span key={`${dup}-${w}`} className="flex items-center gap-6">
              <span className="font-condensed text-muted-foreground tracking-[0.32em] text-sm">{w}</span>
              <span className="text-primary text-lg leading-none">✳</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/* ---------- the article card ---------- */

export const MagCard = ({
  a,
  index = 0,
  featured = false,
}: {
  a: MagArticle;
  index?: number;
  featured?: boolean;
}) => {
  const no = articleNo(a, index + 1);
  const { top, out } = splitTitle(a.title);
  const cat = (a.category || "RTG").toUpperCase();
  const date = formatMagDate(a.published_at);
  const onKey = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter") (e.currentTarget as HTMLAnchorElement).click();
  };

  if (featured) {
    return (
      <Link
        to={`/articles/${a.slug || a.id}`}
        onKeyDown={onKey}
        className="group relative block border border-border bg-card transition-all duration-500 hover:border-primary/60 hover:shadow-[0_28px_60px_-22px_hsl(var(--primary)/0.55)] focus-visible:outline-none focus-visible:border-primary"
        aria-label={a.title}
      >
        <div className="grid md:grid-cols-5">
          {/* BLEED HERO */}
          <div className="relative md:col-span-3 rtg-photo-wrap aspect-[16/10] md:aspect-auto md:min-h-[420px] bg-ink overflow-hidden">
            {a.cover_image_url ? (
              <img
                src={a.cover_image_url}
                alt={a.title}
                className="rtg-photo h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink via-background to-surface">
                <span className="font-gothic text-7xl text-primary/40">RTG</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent z-[2]" />
            <div className="absolute left-4 top-4 z-[3]">
              <FlagTag>{cat}</FlagTag>
            </div>
            <CornerFrame />
          </div>

          {/* COPY */}
          <div className="relative md:col-span-2 overflow-hidden p-7 md:p-10 flex flex-col justify-between">
            <span className="rtg-ghost -top-6 right-2 text-[12rem] md:text-[16rem]">{no}</span>
            <div className="relative">
              <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                The Cover · Issue 001 · No. {no}
              </div>
              <h2 className="font-condensed uppercase leading-[0.9] text-4xl md:text-[3.25rem] -mt-1">
                <span className="block text-cream">{top}</span>
                {out && <span className="block text-hollow-primary">{out}</span>}
              </h2>
              {a.excerpt && (
                <p className="mt-5 line-clamp-4 font-editorial text-base md:text-lg text-muted-foreground leading-relaxed">
                  {a.excerpt}
                </p>
              )}
            </div>
            <div className="relative mt-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground border-t border-border pt-4">
              {a.writer_name && <span className="text-foreground/80">By {a.writer_name}</span>}
              {a.writer_name && <span className="text-primary">✳</span>}
              {date && <span>{date}</span>}
              <span className="text-primary">✳</span>
              <span>{readTime(a)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/articles/${a.slug || a.id}`}
      onKeyDown={onKey}
      className="group relative block border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.55)] focus-visible:outline-none focus-visible:border-primary"
      aria-label={a.title}
    >
      {/* THUMB */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink rtg-photo-wrap">
        {a.cover_image_url ? (
          <img
            src={a.cover_image_url}
            alt={a.title}
            loading="lazy"
            className="rtg-photo h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink via-background to-surface">
            <span className="font-gothic text-5xl text-primary/40">RTG</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent z-[2]" />
        <div className="absolute left-3 top-3 z-[3]">
          <FlagTag size="sm">{cat}</FlagTag>
        </div>
        <CornerFrame />
      </div>

      {/* META + TITLE */}
      <div className="relative overflow-hidden p-5 md:p-6">
        <span className="rtg-ghost right-3 top-2 text-[7rem]">{no}</span>
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Issue 001 · No. {no}
          </div>
          <h3 className="font-condensed uppercase leading-[0.92] text-3xl md:text-[2rem]">
            <span className="block text-cream">{top}</span>
            {out && <span className="block text-hollow-primary">{out}</span>}
          </h3>
          {a.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {a.writer_name && <span className="text-foreground/80">{a.writer_name}</span>}
            {a.writer_name && <span className="text-primary">✳</span>}
            {date && <span>{date}</span>}
            <span className="text-primary">✳</span>
            <span>{readTime(a)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};


/* ---------- "MORE FROM ISSUE 001" related strip ---------- */

export const RtgMagRelated = ({
  related,
  eyebrow = "More From Issue 001",
  title = "Keep Reading",
}: {
  related: MagArticle[];
  eyebrow?: string;
  title?: string;
}) => {
  if (!related.length) return null;
  const shown = related.slice(0, 2);
  return (
    <section className="border-t border-border bg-ink py-16 md:py-24">
      <div className="container-rtg">
        <div className="mb-10">
          <IssueRule>End · Issue 001 · Spring 2026</IssueRule>
        </div>
        <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.32em] text-primary">{eyebrow}</div>
            <h2 className="rtg-period font-condensed text-3xl uppercase md:text-4xl">{title}</h2>
          </div>
          <Link
            to="/articles"
            className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-primary"
          >
            All Stories →
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {shown.map((r, i) => <MagCard key={r.id} a={r} index={i} />)}
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   ARTICLE PAGE — magazine view (standard article).
   ========================================================================= */

type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "panel"; label: string; text: string }
  | { type: "figure"; src: string; cap?: string }
  | { type: "list"; items: string[] }
  | { type: "break" };

/** Map the project's stored body_blocks (or plain body) onto the magazine block schema. */
const toMagBlocks = (a: MagArticle): Block[] => {
  if (Array.isArray(a.body_blocks) && a.body_blocks.length) {
    const out: Block[] = [];
    for (const b of a.body_blocks) {
      if (!b || typeof b !== "object") continue;
      const kind = (b as any).kind;
      const text = (b as any).text ?? "";
      const speaker = (b as any).speaker;
      switch (kind) {
        case "paragraph":
          if (text) out.push({ type: "p", text });
          break;
        case "heading":
          if (text) out.push({ type: "h2", text });
          break;
        case "quote":
        case "pull_quote":
        case "highlight_quote":
          if (text) out.push({ type: "quote", text, by: speaker });
          break;
        case "image":
          if ((b as any).url) out.push({ type: "figure", src: (b as any).url, cap: (b as any).caption });
          break;
        case "spoiler":
          if (text) out.push({ type: "panel", label: (b as any).warning || "Spoiler", text });
          break;
        case "verdict":
          if (text || (b as any).headline)
            out.push({ type: "panel", label: "Verdict", text: `${(b as any).headline ? (b as any).headline + " — " : ""}${text}` });
          break;
        default:
          break;
      }
    }
    return out;
  }
  if (a.body) {
    return a.body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map<Block>((p) => ({ type: "p", text: p }));
  }
  return [];
};

const Frame = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`relative border border-border/80 bg-card/40 ${className}`}>
    <CornerFrame />
    {children}
  </div>
);

const BlockRenderer = ({ block, first }: { block: Block; first: boolean }) => {
  switch (block.type) {
    case "p":
      return (
        <p
          className={`font-editorial text-lg md:text-xl leading-[1.85] text-foreground/90 ${
            first ? "rtg-dropcap" : ""
          }`}
        >
          {renderInline(block.text)}
        </p>
      );
    case "h2":
      return (
        <h2 className="rtg-period mt-6 font-condensed text-2xl uppercase tracking-tight text-cream md:text-3xl">
          {block.text}
        </h2>
      );
    case "quote":
      return (
        <Frame className="my-6 px-8 py-10 md:px-12 md:py-12">
          <blockquote className="text-center">
            <p className="font-condensed text-2xl uppercase leading-[1.05] text-cream md:text-4xl">
              "{block.text}"
            </p>
            {block.by && (
              <footer className="mt-5 text-[10px] uppercase tracking-[0.32em] text-primary">— {block.by}</footer>
            )}
          </blockquote>
        </Frame>
      );
    case "panel":
      return (
        <div className="relative my-6 border border-border bg-card/60 p-6 md:p-7">
          <div className="absolute -top-3 left-5">
            <FlagTag size="sm">{block.label}</FlagTag>
          </div>
          <p className="mt-2 font-editorial text-base leading-[1.8] text-foreground/90 md:text-lg">
            {renderInline(block.text)}
          </p>
        </div>
      );
    case "figure":
      return (
        <figure className="my-8">
          <Frame className="p-2">
            <img src={block.src} alt={block.cap || ""} className="w-full" />
          </Frame>
          {block.cap && (
            <figcaption className="mt-3 text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              {block.cap}
            </figcaption>
          )}
        </figure>
      );
    case "list":
      return (
        <ul className="my-4 space-y-2">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 font-editorial text-base text-foreground/90 md:text-lg">
              <span className="mt-1 text-primary" aria-hidden>✳</span>
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );
    case "break":
      return (
        <div className="my-10 text-center text-primary tracking-[0.6em]" aria-hidden>
          ✳ ✳ ✳
        </div>
      );
  }
};

/* ---------- main magazine article view ---------- */

export const RtgMagazineArticle = ({
  article,
  related,
}: {
  article: MagArticle;
  related: MagArticle[];
}) => {
  const { top, out } = splitTitle(article.title);
  const no = articleNo(article);
  const blocks = toMagBlocks(article);
  const cat = (article.category || "RTG").toUpperCase();
  const date = formatMagDate(article.published_at);
  const author = article.writer_name || "RTG Editors";
  const initial = author.trim().charAt(0).toUpperCase();

  return (
    <div className="rtg-stage grain-heavy">
      {/* HEADER STRIP */}
      <div className="border-b border-border">
        <div className="container-rtg flex items-center justify-between py-5">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 font-condensed text-sm uppercase tracking-[0.3em] text-primary hover:text-cream"
          >
            ← All Stories
          </Link>
          <span className="hidden text-[10px] uppercase tracking-[0.32em] text-muted-foreground md:inline">
            Issue 001 · No. {no}
          </span>
        </div>
      </div>

      {/* HEADLINE */}
      <header className="container-rtg pt-12 pb-8 md:pt-20 md:pb-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-cream">{cat}</span>
            <span className="text-border">/</span>
            <span>Issue 001</span>
          </div>
          <h1 className="font-condensed uppercase leading-[0.88] text-5xl md:text-7xl lg:text-[6rem]">
            <span className="block text-cream">{top}</span>
            {out && <span className="block text-hollow-primary">{out}</span>}
          </h1>
          {article.excerpt && (
            <p className="mt-7 max-w-2xl font-editorial text-lg md:text-xl text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* BYLINE BAR */}
          <div className="mt-10 flex items-center justify-between gap-4 border-y border-border py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center border border-primary font-condensed text-sm text-primary">
                {initial}
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/80">
                By {author}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {date && <span>{date}</span>}
              <span className="text-primary">✳</span>
              <span>{readTime(article)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO IMAGE */}
      {article.cover_image_url && (
        <section className="container-rtg pb-12 md:pb-16">
          <div className="relative mx-auto max-w-5xl">
            <span className="rtg-ghost -top-12 -right-2 text-[10rem] md:text-[16rem]" aria-hidden>
              {no}
            </span>
            <Frame className="relative p-2">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </Frame>
          </div>
        </section>
      )}

      {/* BODY */}
      <article className="container-rtg pb-20">
        <div className="mx-auto max-w-2xl space-y-7">
          {blocks.length ? (
            blocks.map((b, i) => <BlockRenderer key={i} block={b} first={i === 0 && b.type === "p"} />)
          ) : (
            <EmptyState
              eyebrow="The Magazine"
              title="This story is being typeset."
              description="Check back soon — the issue is still being finished."
              icon={Newspaper}
              tone="dark"
            />
          )}
        </div>

        {/* END RULE */}
        <div className="mx-auto mt-16 max-w-2xl">
          <IssueRule>End · Issue 001 · Spring 2026</IssueRule>
        </div>
      </article>

      <RtgMagRelated related={related} />
    </div>
  );
};
