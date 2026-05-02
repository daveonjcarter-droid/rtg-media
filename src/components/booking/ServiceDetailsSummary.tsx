import { getServiceSpec, type ServiceTypeId } from "@/lib/serviceTypes";

type Props = {
  serviceType: string | null | undefined;
  details: Record<string, unknown> | null | undefined;
  compact?: boolean;
};

// Renders a service_details JSON object as a typed, human-readable summary.
// Used by admin booking cards.
export const ServiceDetailsSummary = ({ serviceType, details, compact }: Props) => {
  const spec = getServiceSpec(serviceType);
  if (!spec || !details || Object.keys(details).length === 0) return null;

  const rows = spec.fields
    .map((f) => {
      const raw = details[f.key];
      if (raw === undefined || raw === null || raw === "" || raw === false) return null;
      let display: string;
      if (f.type === "yesno" || f.type === "toggle") {
        display = raw === true ? "Yes" : "No";
      } else if (f.type === "select" && f.options) {
        display = f.options.find((o) => o.value === raw)?.label ?? String(raw);
      } else {
        display = String(raw);
      }
      return { label: f.label, value: display, isExtra: f.group === "extras" };
    })
    .filter(Boolean) as { label: string; value: string; isExtra: boolean }[];

  if (rows.length === 0) return null;

  // Surface extras as a single chip strip (e.g. "Drone, Actors")
  const extraChips = rows.filter((r) => r.isExtra && r.value === "Yes").map((r) => r.label);
  const main = rows.filter((r) => !(r.isExtra && r.value !== "Yes"));

  return (
    <div className={compact ? "text-xs space-y-1" : "text-sm space-y-1.5"}>
      {main.map((r) => (
        <div key={r.label} className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground min-w-[100px]">{r.label}</span>
          <span className="text-foreground/90 break-words">{r.value}</span>
        </div>
      ))}
      {extraChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {extraChips.map((c) => (
            <span key={c} className="text-[9px] uppercase tracking-widest border border-primary/40 text-primary rounded-sm px-1.5 py-0.5">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const ServiceTypeBadge = ({ serviceType }: { serviceType: string | null | undefined }) => {
  const spec = getServiceSpec(serviceType as ServiceTypeId);
  if (!spec) return null;
  const Icon = spec.icon;
  return (
    <span className={`text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-0.5 inline-flex items-center gap-1 ${spec.badgeColor}`}>
      <Icon className="h-2.5 w-2.5" />
      {spec.label}
    </span>
  );
};
