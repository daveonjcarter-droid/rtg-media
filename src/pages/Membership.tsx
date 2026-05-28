import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowUpRight } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import PageSeo from "@/components/site/PageSeo";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

type PlanKey = "monthly" | "yearly";

const PLANS: Record<PlanKey, { priceId: string; price: string; cadence: string; note?: string }> = {
  monthly: { priceId: "rtg_plus_monthly", price: "$9", cadence: "per month" },
  yearly:  { priceId: "rtg_plus_yearly",  price: "$90", cadence: "per year", note: "Save $18" },
};

const PERKS = [
  "Premium articles + long-form essays",
  "Early access to MADMEN breakdown drops",
  "Member-only RTG Picks deep cuts",
  "Issue PDFs and printable colophon",
  "Discount on RTG merch + event tickets",
];

const ONE_TIME = [
  { priceId: "booking_deposit_100", name: "Booking Deposit", price: "$100", desc: "Confirm a shoot or production booking. Remainder invoiced." },
];

export default function Membership() {
  const { user } = useAuth();
  const { isPlus, subscription, loading } = useSubscription(user?.id);
  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [activeCheckout, setActiveCheckout] = useState<string | null>(null);

  const selected = PLANS[plan];

  return (
    <SiteLayout>
      <PageSeo title="RTG Plus — Membership & Subscriber Perks | RTG Media" description="Join RTG Plus for member-only stories, early access, and behind-the-scenes drops from RTG Media. Monthly or yearly." path="/membership" />
      <section className="relative bg-ink text-cream py-20 md:py-28 grain-heavy border-b border-border">
        <div className="container-rtg">
          <div className="eyebrow text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-3 w-3" /> Memberships
          </div>
          <h1 className="type-mega text-5xl md:text-7xl text-cream max-w-3xl">
            RTG <span className="text-hollow-primary">Plus.</span>
          </h1>
          <p className="mt-6 max-w-xl text-cream/75 text-lg leading-relaxed">
            Support independent culture coverage from Chicago. Unlock the full archive,
            member-only drops, and early access to everything we make.
          </p>
        </div>
      </section>

      <section className="container-rtg py-16 md:py-24">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : isPlus ? (
          <div className="border border-border bg-surface p-8 md:p-12 max-w-2xl">
            <div className="eyebrow text-primary mb-3">Active Member</div>
            <h2 className="type-mega text-3xl md:text-4xl mb-3">You're in.</h2>
            <p className="text-muted-foreground mb-6">
              Your RTG Plus membership is active
              {subscription?.current_period_end && (
                <> through {new Date(subscription.current_period_end).toLocaleDateString()}</>
              )}
              {subscription?.cancel_at_period_end && " (canceled — access until period end)"}.
            </p>
            <Button asChild variant="outline" className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
              <Link to="/dashboard">Go to dashboard <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        ) : !user ? (
          <div className="border border-border p-8 md:p-12 max-w-2xl">
            <h2 className="type-mega text-2xl md:text-3xl mb-3">Sign in to subscribe.</h2>
            <p className="text-muted-foreground mb-6">Create an account or log in so we can link the membership to your profile.</p>
            <div className="flex gap-3">
              <Button asChild className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                <Link to="/signup">Sign Up</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </div>
        ) : activeCheckout ? (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="eyebrow text-primary">Checkout</div>
              <button onClick={() => setActiveCheckout(null)} className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </div>
            <StripeEmbeddedCheckout
              priceId={activeCheckout}
              customerEmail={user.email ?? undefined}
              userId={user.id}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="border border-border p-8 md:p-10 bg-surface">
              <div className="eyebrow text-primary mb-3">RTG Plus</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="type-mega text-5xl md:text-6xl">{selected.price}</span>
                <span className="text-muted-foreground text-sm uppercase tracking-[0.2em]">{selected.cadence}</span>
              </div>
              {selected.note && <div className="text-xs uppercase tracking-[0.25em] text-primary mb-4">{selected.note}</div>}

              <div className="flex gap-2 mt-6 mb-8">
                {(Object.keys(PLANS) as PlanKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setPlan(k)}
                    className={`flex-1 px-4 py-3 border text-[10px] uppercase tracking-[0.25em] font-bold transition ${
                      plan === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <ul className="space-y-3 mb-8">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm leading-relaxed">
                    <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => setActiveCheckout(selected.priceId)}
                size="lg"
                className="w-full rounded-none uppercase tracking-[0.25em] text-xs h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Subscribe — {selected.price} {selected.cadence}
              </Button>
              <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                Cancel any time. Access continues through the end of your billing period.
              </p>
            </div>

            <div>
              <div className="eyebrow text-primary mb-3">One-time</div>
              <h3 className="type-mega text-3xl md:text-4xl mb-6">Pay as you go.</h3>
              <div className="space-y-4">
                {ONE_TIME.map((item) => (
                  <div key={item.priceId} className="border border-border p-6 flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="font-bold uppercase tracking-[0.15em] text-sm mb-1">{item.name}</div>
                      <div className="text-muted-foreground text-sm">{item.desc}</div>
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="type-mega text-2xl">{item.price}</div>
                      <Button
                        onClick={() => setActiveCheckout(item.priceId)}
                        size="sm"
                        variant="outline"
                        className="rounded-none uppercase tracking-[0.25em] text-[10px] h-9 px-4"
                      >
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
                Need a custom quote for photography, video, or ad placements?{" "}
                <Link to="/book" className="text-primary underline">Request a booking</Link>.
              </p>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
