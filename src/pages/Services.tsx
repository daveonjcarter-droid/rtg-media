import { Link } from "react-router-dom";
import { Camera, Video, Music, Film, Scissors, Sparkles, Mic, Radio, ArrowRight } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import servicesStudio from "@/assets/services-studio.jpg";

const SERVICES = [
  { icon: Camera, name: "Photography", desc: "Editorial, portrait, event and brand photography with a cinematic eye." },
  { icon: Video, name: "Videography", desc: "From short-form social to long-form documentary — captured at the highest level." },
  { icon: Music, name: "Music Videos", desc: "Concept, treatment, direction and post — full-stack music video production." },
  { icon: Film, name: "Film Production", desc: "Narrative shorts, docs and commercial productions, end to end." },
  { icon: Scissors, name: "Editing", desc: "Color, sound, and edit suites built for cinematic storytelling." },
  { icon: Sparkles, name: "Live Events", desc: "Multi-cam coverage and real-time content for activations and shows." },
  { icon: Mic, name: "Podcast / Audio", desc: "Studio recording, mixing and full audio production." },
  { icon: Radio, name: "Brand Content", desc: "Social-first campaigns crafted for culture-driven brands." },
];

const Services = () => (
  <SiteLayout>
    <section className="relative h-[55vh] overflow-hidden grain">
      <img src={servicesStudio} alt="RTG Media production studio" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="container-rtg relative h-full flex items-end pb-12">
        <div>
          <div className="eyebrow text-cream/80 mb-3">Production Services</div>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">Crafted For<br />The Culture.</h1>
        </div>
      </div>
    </section>

    <section className="container-rtg py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
        {SERVICES.map((s) => (
          <div key={s.name} className="bg-background p-8 md:p-10 hover:bg-surface transition-colors group">
            <s.icon className="h-7 w-7 text-primary mb-5" />
            <h3 className="font-display text-3xl uppercase">{s.name}</h3>
            <p className="text-muted-foreground mt-3 leading-relaxed">{s.desc}</p>
            <Link to="/book" className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
              Inquire <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="font-display text-4xl md:text-5xl uppercase">Let's build something cinematic.</h2>
        <Button asChild size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-xs h-12 px-8">
          <Link to="/book">Start a Project</Link>
        </Button>
      </div>
    </section>
  </SiteLayout>
);

export default Services;
