import { Link } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import PageSeo from "@/components/site/PageSeo";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-videographer.jpg";

const VALUES = [
  { t: "Authenticity", d: "We tell stories from the inside out — not from the sidelines." },
  { t: "Craft", d: "Cinematic. Considered. Every frame intentional." },
  { t: "Community", d: "Built in Chicago, for the culture, by the culture." },
];

const About = () => (
  <SiteLayout>
    <PageSeo title="About RTG Media — Our Mission & Story" description="The story behind Runners To Greatness: a Chicago-born cultural media brand and production studio documenting film, music, sport, and style." path="/about" />
    <section className="relative h-[60vh] overflow-hidden grain">
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="container-rtg relative h-full flex items-end pb-12 bg-muted">
        <div>
          <div className="eyebrow text-cream/80 mb-3">About RTG Media</div>
          <h1 className="font-display text-5xl md:text-8xl uppercase leading-none">Built In<br /><span className="text-primary">Chicago.</span></h1>
        </div>
      </div>
    </section>

    <section className="container-rtg py-20 grid lg:grid-cols-2 gap-12">
      <div>
        <div className="eyebrow mb-4">Our Story</div>
        <p className="text-2xl md:text-3xl font-display uppercase leading-tight">
          RTG Media is a Chicago media company built by young creatives — documenting culture and creating visual stories that last.
        </p>
      </div>
      <div className="space-y-5 text-muted-foreground leading-relaxed">
        <p>Founded in 2024 by Daveon J. Carter with Co-CEO BRENDYN SHIELDS, RTG — Runners To Greatness — was born from a refusal to wait for permission. We saw a generation of voices, artists, and stories the mainstream wasn't covering with the depth they deserved. So we picked up the cameras, the pens, and the platforms.</p>
        <p>Today, RTG Media operates as both a publication and a full-service production company — covering culture across music, film, fashion, sports, and entertainment, while building cinematic content for brands and artists who want to move differently.</p>
      </div>
    </section>

    <section className="border-y border-border bg-surface/40">
      <div className="container-rtg py-20 grid md:grid-cols-3 gap-px bg-border">
        {[
          { t: "Mission", d: "Document the culture. Elevate the voices. Build the legacy." },
          { t: "Vision", d: "To stand alongside the world's most respected media companies as the cultural lens of a new generation." },
          { t: "What We Do", d: "Editorial. Production. Breakdown. Live events. A full creative ecosystem." },
        ].map((b) => (
          <div key={b.t} className="bg-background p-10">
            <div className="eyebrow text-primary mb-3">{b.t}</div>
            <p className="font-display text-2xl uppercase leading-tight">{b.d}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="container-rtg py-20">
      <div className="eyebrow mb-3">Leadership</div>
      <h2 className="font-display text-4xl md:text-5xl uppercase mb-10">Founders</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <FounderCard name="Daveon J. Carter" role="Founder · Creative Director" bio="Daveon founded RTG Media to give Chicago creatives a platform built by people who actually live the culture." />
        <FounderCard name="BRENDYN SHIELDS" role="Co-CEO · Operations" bio="Brendyn leads operations and partnerships, making sure the vision scales without losing its soul." />
      </div>
    </section>

    <section className="container-rtg py-16">
      <div className="eyebrow mb-3">Our DNA</div>
      <h2 className="font-display text-4xl md:text-5xl uppercase mb-10">Values</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {VALUES.map((v) => (
          <div key={v.t} className="border border-border p-8">
            <div className="font-display text-2xl uppercase">{v.t}</div>
            <p className="text-muted-foreground mt-3">{v.d}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-16">
        <Button asChild className="rounded-sm uppercase tracking-widest text-xs h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/team">Meet the Team</Link>
        </Button>
      </div>
    </section>
  </SiteLayout>
);

const FounderCard = ({ name, role, bio }: { name: string; role: string; bio: string }) => (
  <div className="border border-border p-8 md:p-10 bg-surface/30">
    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-ink mb-5 flex items-center justify-center font-display text-2xl">
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
    <h3 className="font-display text-3xl uppercase">{name}</h3>
    <div className="text-xs uppercase tracking-widest text-primary mt-1">{role}</div>
    <p className="text-muted-foreground mt-4 leading-relaxed">{bio}</p>
  </div>
);

export default About;