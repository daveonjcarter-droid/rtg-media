import { Link, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <SiteLayout>
      <section className="container-rtg py-24 md:py-32 min-h-[70vh] flex items-center">
        <div className="max-w-xl mx-auto text-center">
          {sessionId ? (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary mb-6" />
              <div className="eyebrow text-primary mb-4">Payment Received</div>
              <h1 className="type-mega text-4xl md:text-6xl mb-6">Thank you.</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Your payment is confirmed. If you purchased RTG Plus, your access unlocks immediately.
                For bookings and ad placements, our team will follow up shortly.
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-10">
                Reference: {sessionId.slice(0, 24)}…
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                  <Link to="/">Back to RTG</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                  <Link to="/membership">View Membership</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="type-mega text-3xl md:text-5xl mb-6">No session found.</h1>
              <Button asChild className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                <Link to="/">Back to RTG</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
