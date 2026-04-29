export type CrewPackageId = "videographer_only" | "photographer_only" | "small_crew" | "full_crew";

export type CrewPackage = {
  id: CrewPackageId;
  label: string;
  bestFor: string[];
  includes: string[];
  priceModifier: number; // added on top of service base price
  scale: string;
  qualityLabel: string;
  defaultSlots: string[]; // role labels admin can pre-populate
};

export const CREW_PACKAGES: Record<CrewPackageId, CrewPackage> = {
  videographer_only: {
    id: "videographer_only",
    label: "Videographer Only",
    bestFor: ["Run-and-gun music videos", "Simple event coverage", "Quick social media shoots"],
    includes: ["1 videographer", "Basic camera setup", "Simple coverage"],
    priceModifier: 0,
    scale: "Solo",
    qualityLabel: "Standard",
    defaultSlots: ["Videographer"],
  },
  photographer_only: {
    id: "photographer_only",
    label: "Photographer Only",
    bestFor: ["Photoshoots", "Portraits", "Brand shoots", "Event photos"],
    includes: ["1 photographer", "Basic lighting", "Edited stills"],
    priceModifier: 0,
    scale: "Solo",
    qualityLabel: "Standard",
    defaultSlots: ["Photographer"],
  },
  small_crew: {
    id: "small_crew",
    label: "Small Crew",
    bestFor: ["Music videos", "Interviews", "Short branded content", "Live event recap videos"],
    includes: ["Videographer", "Assistant / PA", "Optional photo or audio"],
    priceModifier: 500,
    scale: "Team of 2–3",
    qualityLabel: "Elevated",
    defaultSlots: ["Videographer", "Production Assistant"],
  },
  full_crew: {
    id: "full_crew",
    label: "Full Crew",
    bestFor: ["High-quality productions", "Films", "Commercials", "Larger music videos", "Multi-location shoots"],
    includes: ["Director / Producer", "Videographer(s)", "Photographer", "Audio", "Lighting / Grip", "PA", "Editor"],
    priceModifier: 2000,
    scale: "Team of 5+",
    qualityLabel: "Cinematic",
    defaultSlots: ["Director", "Videographer", "Videographer 2", "Audio Engineer", "Grip / Lighting", "Production Assistant", "Editor"],
  },
};

export const CREW_PACKAGE_ORDER: CrewPackageId[] = [
  "videographer_only",
  "photographer_only",
  "small_crew",
  "full_crew",
];

export const CREW_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  replaced: "Replaced",
} as const;

export const CREW_STATUS_STYLES: Record<keyof typeof CREW_STATUS_LABELS, string> = {
  pending: "border-gold/40 text-gold",
  confirmed: "border-emerald-500/40 text-emerald-400",
  declined: "border-destructive/40 text-destructive",
  replaced: "border-border text-muted-foreground",
};
