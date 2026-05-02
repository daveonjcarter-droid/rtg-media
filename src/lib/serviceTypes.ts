// Catalog of bookable service types and their dynamic field schemas.
// Drives: /book service picker, dynamic form, admin summary cards, crew suggestions.

import {
  Music, Camera, Film, Scissors, Mic2, Sparkles, Wand2,
  type LucideIcon,
} from "lucide-react";

export type ServiceTypeId =
  | "music_video"
  | "photography"
  | "film_production"
  | "editing"
  | "event_coverage"
  | "creative_direction"
  | "custom";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "toggle"
  | "yesno"
  | "multiselect";

export type ServiceField = {
  key: string;          // stored under service_details[key]
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  group?: "main" | "extras";
  helper?: string;
};

export type ServiceTypeSpec = {
  id: ServiceTypeId;
  label: string;
  short: string;          // tagline shown on picker
  icon: LucideIcon;
  badgeColor: string;     // tailwind class fragment for badge tint
  defaultCrewSlots: string[]; // crew roles auto-suggested for this service
  fields: ServiceField[];
};

const BUDGET_OPTIONS = [
  { value: "$300 – $700", label: "$300 – $700" },
  { value: "$700 – $1,500", label: "$700 – $1,500" },
  { value: "$1,500 – $3,000", label: "$1,500 – $3,000" },
  { value: "$3,000 – $7,500", label: "$3,000 – $7,500" },
  { value: "$7,500+", label: "$7,500+" },
];

export const SERVICE_TYPES: Record<ServiceTypeId, ServiceTypeSpec> = {
  music_video: {
    id: "music_video",
    label: "Music Video",
    short: "Concept-driven visuals for an artist or song.",
    icon: Music,
    badgeColor: "border-primary/40 text-primary",
    defaultCrewSlots: ["Director", "Videographer", "Lighting / Grip", "Production Assistant"],
    fields: [
      { key: "artist_name", label: "Artist Name", type: "text", required: true, placeholder: "e.g. Saba" },
      { key: "song_name", label: "Song Name", type: "text", required: true, placeholder: "Track title" },
      { key: "concept", label: "Concept / Treatment", type: "textarea", required: true, placeholder: "Story, mood, references, key moments…" },
      { key: "locations", label: "Location(s)", type: "text", placeholder: "Where you envision shooting" },
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
      // Extras
      { key: "drone", label: "Drone footage", type: "toggle", group: "extras" },
      { key: "actors", label: "Actors needed", type: "toggle", group: "extras" },
      { key: "story_based", label: "Story-based video", type: "toggle", group: "extras" },
      { key: "performance_based", label: "Performance-based", type: "toggle", group: "extras" },
    ],
  },

  photography: {
    id: "photography",
    label: "Photography Shoot",
    short: "Portraits, fashion, product, or event photography.",
    icon: Camera,
    badgeColor: "border-emerald-400/40 text-emerald-400",
    defaultCrewSlots: ["Photographer", "Assistant"],
    fields: [
      {
        key: "shoot_subtype", label: "Shoot Type", type: "select", required: true,
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "fashion", label: "Fashion" },
          { value: "event", label: "Event" },
          { value: "product", label: "Product" },
        ],
      },
      { key: "location", label: "Location", type: "text", required: true, placeholder: "Studio, on-location, address…" },
      { key: "people_count", label: "Number of People", type: "number", placeholder: "1" },
      { key: "outfit_changes", label: "Outfit Changes", type: "number", placeholder: "0" },
      { key: "duration", label: "Duration", type: "select", options: [
        { value: "1h", label: "1 hour" }, { value: "2h", label: "2 hours" },
        { value: "half_day", label: "Half day" }, { value: "full_day", label: "Full day" },
      ]},
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
      { key: "editing_needed", label: "Editing / retouching needed", type: "yesno", group: "extras" },
    ],
  },

  film_production: {
    id: "film_production",
    label: "Short Film / Production",
    short: "Narrative shorts, commercials, or branded films.",
    icon: Film,
    badgeColor: "border-gold/40 text-gold",
    defaultCrewSlots: ["Director", "Producer", "DP / Videographer", "Audio", "Lighting / Grip", "Production Assistant"],
    fields: [
      { key: "project_title", label: "Project Title", type: "text", required: true },
      { key: "script_ready", label: "Script ready?", type: "yesno", required: true },
      { key: "shoot_days", label: "Shooting Days", type: "number", placeholder: "1", required: true },
      { key: "cast_size", label: "Cast Size", type: "number", placeholder: "0" },
      { key: "crew_size", label: "Crew Size Needed", type: "number", placeholder: "5" },
      { key: "locations", label: "Location(s)", type: "textarea", placeholder: "Single location? Multi-location? Studio?" },
      { key: "production_level", label: "Production Level", type: "select", required: true, options: [
        { value: "indie", label: "Indie" }, { value: "studio", label: "Studio-style" },
      ]},
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
    ],
  },

  editing: {
    id: "editing",
    label: "Editing / Post Production",
    short: "Cut, color, sound, motion graphics — no shoot.",
    icon: Scissors,
    badgeColor: "border-violet-400/40 text-violet-400",
    defaultCrewSlots: ["Editor", "Colorist"],
    fields: [
      { key: "footage_length", label: "Footage Length", type: "text", required: true, placeholder: "e.g. 4 hours of raw" },
      { key: "edit_type", label: "Type", type: "select", required: true, options: [
        { value: "music_video", label: "Music Video" },
        { value: "film", label: "Film" },
        { value: "social", label: "Social Content" },
        { value: "commercial", label: "Commercial" },
      ]},
      { key: "effects_needed", label: "Effects / Motion Graphics", type: "yesno", group: "extras" },
      { key: "color_grading", label: "Color Grading", type: "yesno", group: "extras" },
      { key: "turnaround", label: "Turnaround Time", type: "select", required: true, options: [
        { value: "rush_48h", label: "Rush — 48 hours" },
        { value: "1_week", label: "1 week" },
        { value: "2_weeks", label: "2 weeks" },
        { value: "flexible", label: "Flexible" },
      ]},
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
    ],
  },

  event_coverage: {
    id: "event_coverage",
    label: "Event Coverage",
    short: "Capture an event — photo, video, or both.",
    icon: Mic2,
    badgeColor: "border-amber-400/40 text-amber-400",
    defaultCrewSlots: ["Videographer", "Photographer"],
    fields: [
      { key: "event_type", label: "Event Type", type: "text", required: true, placeholder: "Concert, launch, wedding, gala…" },
      { key: "duration", label: "Duration", type: "select", required: true, options: [
        { value: "1h", label: "1 hour" }, { value: "2_4h", label: "2–4 hours" },
        { value: "4_8h", label: "4–8 hours" }, { value: "full_day", label: "Full day" },
      ]},
      { key: "location", label: "Location", type: "text", required: true },
      { key: "attendance", label: "Expected Attendance", type: "number", placeholder: "100" },
      { key: "coverage_type", label: "Coverage Needed", type: "select", required: true, options: [
        { value: "photo", label: "Photo only" },
        { value: "video", label: "Video only" },
        { value: "both", label: "Photo + Video" },
      ]},
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
    ],
  },

  creative_direction: {
    id: "creative_direction",
    label: "Creative Direction",
    short: "Concept, treatment, art direction, or consulting.",
    icon: Sparkles,
    badgeColor: "border-fuchsia-400/40 text-fuchsia-400",
    defaultCrewSlots: ["Creative Director"],
    fields: [
      { key: "project_summary", label: "Project Summary", type: "textarea", required: true, placeholder: "What you're trying to make, who it's for…" },
      { key: "deliverables", label: "Deliverables Needed", type: "text", placeholder: "Treatment, mood board, lookbook, etc." },
      { key: "timeline", label: "Timeline", type: "text", placeholder: "When do you need this?" },
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
    ],
  },

  custom: {
    id: "custom",
    label: "Custom Project",
    short: "Something different — tell us what you're imagining.",
    icon: Wand2,
    badgeColor: "border-border text-muted-foreground",
    defaultCrewSlots: ["Producer"],
    fields: [
      { key: "description", label: "Describe your project", type: "textarea", required: true, placeholder: "What are you making? What do you need from RTG?" },
      { key: "goals", label: "Goals", type: "textarea", placeholder: "What does success look like?" },
      { key: "timeline", label: "Timeline", type: "text", placeholder: "When does this need to happen?" },
      { key: "budget", label: "Budget Range", type: "select", required: true, options: BUDGET_OPTIONS },
    ],
  },
};

export const SERVICE_TYPE_ORDER: ServiceTypeId[] = [
  "music_video",
  "photography",
  "film_production",
  "editing",
  "event_coverage",
  "creative_direction",
  "custom",
];

export const getServiceSpec = (id: string | null | undefined): ServiceTypeSpec | null => {
  if (!id) return null;
  return (SERVICE_TYPES as Record<string, ServiceTypeSpec>)[id] ?? null;
};

// Validate the service_details object against the spec. Returns first error message or null.
export const validateServiceDetails = (
  spec: ServiceTypeSpec,
  details: Record<string, unknown>,
): string | null => {
  for (const f of spec.fields) {
    if (!f.required) continue;
    const v = details[f.key];
    if (f.type === "yesno") {
      if (v !== true && v !== false) return `${f.label} is required`;
      continue;
    }
    if (f.type === "toggle") continue; // optional by nature
    if (f.type === "number") {
      if (v === undefined || v === null || v === "") return `${f.label} is required`;
      continue;
    }
    if (typeof v !== "string" || v.trim().length === 0) return `${f.label} is required`;
  }
  return null;
};
