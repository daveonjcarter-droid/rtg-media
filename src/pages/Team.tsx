import SiteLayout from "@/components/site/SiteLayout";

const ROLES = [
  { role: "Founder / Creative Director", names: ["Daveon J. Carter"] },
  { role: "Co-CEO / Operations", names: ["Brendan Shields"] },
  { role: "Journalists", names: ["Open Position", "Open Position", "Open Position"] },
  { role: "Editors", names: ["Open Position", "Open Position"] },
  { role: "Photographers", names: ["Open Position", "Open Position"] },
  { role: "Videographers", names: ["Open Position", "Open Position"] },
  { role: "Social Team", names: ["Open Position", "Open Position"] },
  { role: "Producers", names: ["Open Position"] },
];

const Team = () => (
  <SiteLayout>
    <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
      <div className="eyebrow mb-3">The People Behind The Brand</div>
      <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">The Team</h1>
      <p className="mt-5 max-w-xl text-muted-foreground">A collective of writers, directors, photographers, and producers building the next great cultural media brand out of Chicago.</p>
    </section>

    <section className="container-rtg py-16 space-y-12">
      {ROLES.map((group) => (
        <div key={group.role}>
          <div className="flex items-baseline justify-between border-b border-border pb-3 mb-6">
            <h2 className="font-display text-2xl md:text-3xl uppercase">{group.role}</h2>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{group.names.length} {group.names.length === 1 ? "Member" : "Members"}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {group.names.map((n, i) => (
              <div key={i} className="bg-surface/40 border border-border p-5 hover-lift">
                <div className="aspect-square mb-4 bg-gradient-to-br from-primary/20 via-surface to-ink flex items-center justify-center font-display text-4xl text-foreground/50">
                  {n.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="font-display text-lg uppercase leading-tight">{n}</div>
                <div className="text-xs text-muted-foreground mt-1">{group.role}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  </SiteLayout>
);

export default Team;
