import { useParams, Link } from "react-router-dom";
import { Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import ArticleCard from "@/components/site/ArticleCard";
import { STORIES } from "@/data/stories";

const ArticleDetail = () => {
  const { id } = useParams();
  const story = STORIES.find((s) => s.id === id) ?? STORIES[0];
  const related = STORIES.filter((s) => s.id !== story.id).slice(0, 3);

  return (
    <SiteLayout>
      <article>
        <div className="relative h-[60vh] md:h-[75vh] overflow-hidden">
          <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/40" />
          <div className="container-rtg absolute inset-0 flex items-end pb-12">
            <div className="max-w-3xl">
              <span className="bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-sm">
                {story.category}
              </span>
              <h1 className="font-display text-4xl md:text-7xl uppercase leading-[0.95] mt-5">{story.title}</h1>
              <div className="mt-5 text-sm text-muted-foreground tracking-wider uppercase">
                By {story.author} · {story.date}
              </div>
            </div>
          </div>
        </div>

        <div className="container-rtg py-16 grid lg:grid-cols-[1fr_640px_1fr] gap-10">
          <aside className="hidden lg:flex flex-col gap-3 sticky top-24 self-start">
            <div className="eyebrow">Share</div>
            {[Twitter, Facebook, Linkedin, LinkIcon].map((Icon, i) => (
              <button key={i} className="h-10 w-10 border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors rounded-sm">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </aside>
          <div className="prose-rtg max-w-none lg:col-start-2">
            <p className="text-xl leading-relaxed text-foreground/90 mb-8">{story.excerpt}</p>
            <p className="text-base leading-loose text-foreground/80 mb-6">
              In a city that has always pulsed with sound and movement, a new generation of creatives is rewriting what it means to be from here. They aren't waiting for permission. They aren't waiting for an audience. They're building both.
            </p>
            <p className="text-base leading-loose text-foreground/80 mb-6">
              At RTG Media, we believe culture isn't something you observe — it's something you participate in. Every photograph, every frame, every story is a chance to put the people and moments shaping our generation on the record.
            </p>
            <h2 className="font-display text-3xl uppercase mt-12 mb-4">A new sound</h2>
            <p className="text-base leading-loose text-foreground/80 mb-6">
              The artists pushing this wave forward share a refusal to flatten themselves into easy categories. They sample broadly, collaborate freely, and treat visual identity with the same rigor as the music itself.
            </p>
            <blockquote className="border-l-2 border-primary pl-6 my-10 text-2xl font-display uppercase leading-tight text-foreground">
              "We're not chasing a trend. We're building a legacy."
            </blockquote>
            <p className="text-base leading-loose text-foreground/80">
              That's the throughline — and it's why we keep showing up with cameras, with notebooks, with platforms. Because the story of culture deserves to be told by the people inside it.
            </p>
          </div>
        </div>

        <section className="border-t border-border bg-surface/40 py-20">
          <div className="container-rtg">
            <div className="flex items-end justify-between border-b border-border pb-4 mb-10">
              <h2 className="font-display text-3xl md:text-4xl uppercase">Related Stories</h2>
              <Link to="/articles" className="text-xs uppercase tracking-widest text-primary">All Articles</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((s) => <ArticleCard key={s.id} story={s} />)}
            </div>
          </div>
        </section>
      </article>
    </SiteLayout>
  );
};

export default ArticleDetail;
