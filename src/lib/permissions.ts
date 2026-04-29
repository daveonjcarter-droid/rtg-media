import type { AppRole } from "@/contexts/AuthContext";

export type SectionId =
  | "overview"
  | "drafts"
  | "submitted"
  | "revisions"
  | "scheduled"
  | "published"
  | "archived"
  | "calendar"
  | "media"
  | "import"
  | "social"
  | "bookings"
  | "leads"
  | "production"
  | "portfolio"
  | "staff"
  | "films"
  | "fest"
  | "chicago"
  | "content-managers"
  | "users"
  | "site-updates"
  | "analytics"
  | "audience"
  | "trends"
  | "community"
  | "permissions"
  | "invites"
  | "settings"
  | "crew"
  | "my-profile"
  | "my-availability"
  | "my-bookings"
  | "my-portfolio"
  | "portfolio-approvals";

export type Group = "Content" | "Pipeline" | "Studio" | "Ops" | "Ecosystem" | "Admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  head_admin: "Head Admin",
  admin: "Admin",
  editor: "Editor",
  writer: "Writer",
  social_manager: "Social Manager",
  booking_manager: "Booking Manager",
  media_manager: "Media Manager",
  social_articles_lead: "Social / Articles Lead",
  crew: "Crew",
  photographer: "Photographer",
  videographer: "Videographer",
  video_editor: "Video Editor",
  director: "Director",
  producer: "Producer",
  audio_engineer: "Audio Engineer",
  grip_lighting: "Grip / Lighting",
  makeup_artist: "Makeup Artist",
  production_assistant: "Production Assistant",
  studio_staff: "Studio Staff",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  head_admin: "Full ownership. All tools, billing, brand settings.",
  admin: "High-level manager. Cannot remove ownership or change billing.",
  editor: "Editorial lead. Approve, schedule, and publish stories.",
  writer: "Contributor. Create drafts and submit for review.",
  social_manager: "Distribute and schedule social posts.",
  booking_manager: "Sales and inquiries. Manage clients and bookings.",
  media_manager: "Asset library. Upload and manage all media.",
  social_articles_lead: "Lead for social + editorial. Combines Social Manager + Editor + analytics access.",
  crew: "Production crew. Manage own profile, availability, and assigned bookings.",
  photographer: "Crew — Photography assignments and portfolio.",
  videographer: "Crew — Video capture assignments and reel.",
  video_editor: "Crew — Post-production editor.",
  director: "Crew — Directs shoots and productions.",
  producer: "Crew — Manages production logistics on set.",
  audio_engineer: "Crew — On-set and post audio.",
  grip_lighting: "Crew — Grip and lighting department.",
  makeup_artist: "Crew — Hair and makeup.",
  production_assistant: "Crew — Production assistant on set.",
  studio_staff: "Crew — Studio operations and front-of-house.",
};

const HEAD = "head_admin" as const;

/** Sections each role can access. head_admin sees everything. */
export const SECTION_ACCESS: Record<SectionId, AppRole[]> = {
  overview:           [HEAD, "admin", "editor", "writer", "social_manager", "booking_manager", "media_manager", "social_articles_lead"],
  drafts:             [HEAD, "admin", "editor", "writer", "social_articles_lead"],
  submitted:          [HEAD, "admin", "editor", "writer", "social_articles_lead"],
  revisions:          [HEAD, "admin", "editor", "writer", "social_articles_lead"],
  scheduled:          [HEAD, "admin", "editor", "writer", "social_manager", "social_articles_lead"],
  published:          [HEAD, "admin", "editor", "writer", "social_manager", "social_articles_lead"],
  archived:           [HEAD, "admin", "editor", "social_articles_lead"],
  calendar:           [HEAD, "admin", "editor", "social_manager", "social_articles_lead"],
  media:              [HEAD, "admin", "editor", "writer", "media_manager", "social_manager", "social_articles_lead"],
  import:             [HEAD, "admin", "editor", "writer", "social_articles_lead"],
  social:             [HEAD, "admin", "editor", "social_manager", "social_articles_lead"],
  bookings:           [HEAD, "admin", "editor", "booking_manager"],
  leads:              [HEAD, "admin", "editor", "booking_manager"],
  production:         [HEAD, "admin", "booking_manager"],
  portfolio:          [HEAD, "admin", "editor", "media_manager"],
  staff:              [HEAD, "admin", "editor", "booking_manager"],
  films:              [HEAD, "admin", "editor"],
  fest:               [HEAD, "admin", "editor"],
  chicago:            [HEAD, "admin", "editor"],
  "content-managers": [HEAD, "admin", "editor"],
  users:              [HEAD, "admin"],
  invites:            [HEAD, "admin"],
  "site-updates":     [HEAD, "admin", "media_manager"],
  analytics:          [HEAD, "admin", "editor", "social_manager", "booking_manager", "social_articles_lead"],
  audience:           [HEAD, "admin", "editor", "social_manager", "social_articles_lead"],
  trends:             [HEAD, "admin", "editor", "writer", "social_manager", "social_articles_lead"],
  community:          [HEAD, "admin", "editor", "social_manager", "social_articles_lead"],
  permissions:        [HEAD],
  settings:           [HEAD, "admin"],
  crew:                [HEAD, "admin", "booking_manager"],
  "portfolio-approvals": [HEAD, "admin", "editor", "media_manager"],
  "my-profile":        [HEAD, "admin", "editor", "writer", "social_manager", "booking_manager", "media_manager", "social_articles_lead", "crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
  "my-availability":   ["crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff", HEAD, "admin", "booking_manager"],
  "my-bookings":       ["crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
  "my-portfolio":      ["crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
};

export const OWNERSHIP_ONLY: SectionId[] = [];

export const can = (roles: AppRole[], section: SectionId): boolean => {
  return SECTION_ACCESS[section].some((r) => roles.includes(r));
};

export const isHeadAdmin = (roles: AppRole[]) => roles.includes("head_admin");
export const isAdminLike = (roles: AppRole[]) =>
  roles.includes("head_admin") || roles.includes("admin");

export const canEditArticle = (roles: AppRole[]) =>
  ["head_admin", "admin", "editor", "writer"].some((r) => roles.includes(r as AppRole));

export const canPublish = (roles: AppRole[]) =>
  ["head_admin", "admin", "editor"].some((r) => roles.includes(r as AppRole));

export const canManageUsers = (roles: AppRole[]) =>
  roles.includes("head_admin") || roles.includes("admin");

export const canManageBilling = (roles: AppRole[]) => roles.includes("head_admin");

export const primaryRole = (roles: AppRole[]): AppRole => {
  const order: AppRole[] = ["head_admin", "admin", "social_articles_lead", "editor", "writer", "booking_manager", "social_manager", "media_manager"];
  return order.find((r) => roles.includes(r)) ?? "writer";
};
