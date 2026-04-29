import { Link } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-videographer.jpg";

const VALUES = [
  { t: "Authenticity", d: "We tell stories from the inside out — not from the sidelines." },
  { t: "Craft", d: "Cinematic. Considered. Every frame intentional." },
  { t: "Community", d: "Built in Chicago, for the culture, by the culture." },
];

const About = () => (
  <SiteLayout>
    <section className="relative h-[60vh] overflow-hidden grain">
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="container-rtg relative h-full flex items-end pb-12 bg-muted">
...
        <p>Founded in 2024 by Daveon J. Carter with Co-CEO BRENDYN SHIELDS, RTG — Runners To Greatness — was born from a refusal to wait for permission. We saw a generation of voices, artists, and stories the mainstream wasn't covering with the depth they deserved. So we picked up the cameras, the pens, and the platforms.</p>
...
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
