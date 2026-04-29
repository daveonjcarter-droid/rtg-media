import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Music, Film, Mic, Sparkles, Instagram, Youtube, Twitter as X } from "lucide-react";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

const features = [
  { icon: Music, label: "Live Performances", desc: "Headliners and rising artists." },
  { icon: Film, label: "Film Screenings", desc: "Premieres, shorts, and docs." },
  { icon: Mic, label: "Panels & Talks", desc: "Creators in conversation." },
  { icon: Sparkles, label: "Pop-ups & Activations", desc: "Culture you can step into." },
];

const Fest = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name: name || undefined, email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name ?? null,
      email: parsed.data.email,
      source: "rtg-fest",
    } as any);
    setBusy(false);
    if (error && !/duplicate/i.test(error.message)) { toast.error(error.message); return; }
    toast.success("You're on the list. See you at RTG Fest.");
    setName(""); setEmail("");
  };

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-ink text-cream">
        <div aria-hidden className="absolute inset-0 grain opacity-60" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 30%, hsl(355 78% 56% / 0.25), transparent 65%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(355 78% 56% / 0.15), transparent 70%)",
          }}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink" />

        <div className="relative container-rtg text-center py-24">
          <div className="eyebrow text-primary mb-6">Chicago · 2026</div>
          <h1 className="font-gothic leading-[0.85] tracking-[0.01em] text-[22vw] md:text-[14vw] lg:text-[12rem]">
            RTG <span className="text-primary">FEST</span>
          </h1>
          <p className="mt-8 text-lg md:text-2xl uppercase tracking-[0.3em] text-cream/80">
            Chicago. Culture. Live.
          </p>
          <p className="mt-4 text-sm md:text-base text-cream/60">
            A new cultural experience is coming.
          </p>

          <div className="mt-16 flex flex-col items-center gap-3">
            <div className="h-12 w-px bg-cream/30" />
            <span className="text-xs uppercase tracking-widest text-cream/50">Scroll</span>
          </div>
        </div>
      </section>

      {/* MAIN TEXT */}
      <section className="relative bg-ink text-cream py-24 md:py-32 border-t border-cream/10">
        <div className="container-rtg max-w-3xl text-center">
          <p className="font-display text-2xl md:text-4xl leading-snug">
            RTG Fest is where film, music, fashion, and culture collide.
          </p>
          <p className="mt-6 text-base md:text-lg text-cream/70 leading-relaxed">
            Live events, screenings, performances, and experiences built for the next generation of creators.
          </p>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="relative bg-ink text-cream py-24 md:py-32 overflow-hidden border-t border-cream/10">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 50%, hsl(355 78% 56% / 0.18), transparent 70%)",
          }}
        />
        <div className="relative container-rtg text-center">
          <h2 className="font-gothic text-[18vw] md:text-[10vw] lg:text-[9rem] leading-[0.9] tracking-tight">
            COMING <span className="text-primary">SOON</span>
          </h2>
          <p className="mt-6 text-sm md:text-base uppercase tracking-[0.3em] text-cream/60">
            First event drops soon.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative bg-ink text-cream py-24 md:py-32 border-t border-cream/10">
        <div className="container-rtg">
          <div className="text-center mb-16">
            <div className="eyebrow text-primary mb-3">What to expect</div>
            <h3 className="font-display text-3xl md:text-5xl uppercase">The experience</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.label}
                className="group border border-cream/10 bg-cream/[0.02] p-8 hover:border-primary/60 hover:bg-primary/5 transition-all"
              >
                <f.icon className="h-8 w-8 text-primary mb-6" />
                <div className="font-display text-xl uppercase tracking-wide">{f.label}</div>
                <p className="mt-2 text-sm text-cream/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EARLY ACCESS */}
      <section className="relative bg-ink text-cream py-24 md:py-32 border-t border-cream/10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent, hsl(355 78% 56% / 0.08) 50%, transparent)",
          }}
        />
        <div className="relative container-rtg max-w-2xl">
          <div className="text-center mb-10">
            <div className="eyebrow text-primary mb-3">Early access</div>
            <h3 className="font-display text-4xl md:text-6xl uppercase leading-none">
              Get on the list
            </h3>
            <p className="mt-4 text-sm md:text-base text-cream/60">
              Be the first to know when RTG Fest launches.
            </p>
          </div>

          <form onSubmit={onSubmit} className="bg-cream/[0.03] border border-cream/15 p-8 md:p-10 backdrop-blur">
            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 bg-ink border-cream/20 text-cream rounded-sm placeholder:text-cream/40"
              />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Email address"
                className="h-12 bg-ink border-cream/20 text-cream rounded-sm placeholder:text-cream/40"
              />
              <Button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy ? "Joining…" : "Join the List"}
              </Button>
            </div>
            <p className="mt-4 text-xs text-cream/50 text-center">
              No spam. Just drops, lineups, and first-access tickets.
            </p>
          </form>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="relative bg-ink text-cream py-20 border-t border-cream/10">
        <div className="container-rtg text-center">
          <div className="eyebrow text-primary mb-6">Follow for updates</div>
          <div className="flex items-center justify-center gap-8 text-cream/70">
            <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors">
              <Instagram className="h-7 w-7" />
            </a>
            <a href="#" aria-label="Twitter / X" className="hover:text-primary transition-colors">
              <X className="h-7 w-7" />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-primary transition-colors">
              <Youtube className="h-7 w-7" />
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Fest;
