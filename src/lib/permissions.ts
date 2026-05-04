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
  | "applicants"
  | "settings"
  | "crew"
  | "my-profile"
  | "my-availability"
  | "my-bookings"
  | "my-portfolio"
  | "portfolio-approvals"
  | "profile-management"
  | "admin-invites"
  | "signup-codes"
  | "staff-approvals"
  | "role-management"
  | "availability"
  | "audit";

export type Group = "Overview" | "Content" | "Pipeline" | "Studio" | "Ops" | "Ecosystem" | "Admin" | "Crew" | "My Work";

export const ROLE_LABELS: Record<AppRole, string> = {
  head_admin: "Head Admin",
  admin: "Admin",
  owner: "Owner",
  co_ceo: "Co-CEO",
  editor: "Editor",
  writer: "Writer",
  journalist: "Journalist",
  designer: "Designer",
  intern: "Intern",
  client: "Client",
  social_manager: "Social Manager",
  booking_manager: "Booking Manager",
  media_manager: "Media Manager",
  social_articles_lead: "Social / Articles Lead",
  project_manager: "Project Manager",
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
  owner: "Founder-tier. Full control over the company and team.",
  co_ceo: "Co-CEO. Equal leadership privileges.",
  journalist: "Reporter. Writes news, reviews, and editorial coverage.",
  designer: "Visual designer. Owns brand assets and editorial layout.",
  intern: "Trainee. Limited write access supervised by senior team.",
  client: "External client account. Public-facing only.",
  editor: "Editorial lead. Approve, schedule, and publish stories.",
  writer: "Contributor. Create drafts and submit for review.",
  social_manager: "Distribute and schedule social posts.",
  booking_manager: "Sales and inquiries. Manage clients and bookings.",
  media_manager: "Asset library. Upload and manage all media.",
  social_articles_lead: "Lead for social + editorial. Combines Social Manager + Editor + analytics access.",
  project_manager: "High-trust operator. Manages projects, tasks, bookings, crew, calendar, and content drafts. All actions audited.",
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
  overview:           [HEAD, "admin", "editor", "writer", "social_manager", "booking_manager", "media_manager", "social_articles_lead", "project_manager"],
  drafts:             [HEAD, "admin", "editor", "writer", "social_articles_lead", "project_manager"],
  submitted:          [HEAD, "admin", "editor", "writer", "social_articles_lead", "project_manager"],
  revisions:          [HEAD, "admin", "editor", "writer", "social_articles_lead", "project_manager"],
  scheduled:          [HEAD, "admin", "editor", "writer", "social_manager", "social_articles_lead", "project_manager"],
  published:          [HEAD, "admin", "editor", "writer", "social_manager", "social_articles_lead", "project_manager"],
  archived:           [HEAD, "admin", "editor", "social_articles_lead"],
  calendar:           [HEAD, "admin", "owner", "co_ceo", "editor", "writer", "journalist", "social_manager", "social_articles_lead", "booking_manager", "media_manager", "designer", "intern", "project_manager", "crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
  media:              [HEAD, "admin", "editor", "writer", "media_manager", "social_manager", "social_articles_lead", "project_manager"],
  import:             [HEAD, "admin", "editor", "writer", "social_articles_lead"],
  social:             [HEAD, "admin", "editor", "social_manager", "social_articles_lead", "project_manager"],
  bookings:           [HEAD, "admin", "editor", "booking_manager", "project_manager"],
  leads:              [HEAD, "admin", "editor", "booking_manager", "project_manager"],
  production:         [HEAD, "admin", "booking_manager", "project_manager"],
  portfolio:          [HEAD, "admin", "editor", "media_manager"],
  staff:              [HEAD, "admin", "editor", "booking_manager", "project_manager"],
  films:              [HEAD, "admin", "editor"],
  fest:               [HEAD, "admin", "editor"],
  chicago:            [HEAD, "admin", "editor"],
  "content-managers": [HEAD, "admin", "editor"],
  users:              [HEAD, "admin"],
  invites:            [HEAD, "admin"],
  applicants:         [HEAD, "admin"],
  "site-updates":     [HEAD, "admin", "media_manager"],
  analytics:          [HEAD, "admin", "editor", "social_manager", "booking_manager", "social_articles_lead"],
  audience:           [HEAD, "admin", "editor", "social_manager", "social_articles_lead"],
  trends:             [HEAD, "admin", "editor", "writer", "social_manager", "social_articles_lead"],
  community:          [HEAD, "admin", "editor", "social_manager", "social_articles_lead"],
  permissions:        [HEAD],
  settings:           [HEAD, "admin"],
  crew:                [HEAD, "admin", "booking_manager", "project_manager"],
  "portfolio-approvals": [HEAD, "admin", "editor", "media_manager"],
  "my-profile":        [HEAD, "admin", "editor", "writer", "social_manager", "booking_manager", "media_manager", "social_articles_lead", "project_manager", "crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
  "my-availability":   ["crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff", HEAD, "admin", "booking_manager", "project_manager"],
  "my-bookings":       ["crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
  "my-portfolio":      ["crew", "photographer", "videographer", "video_editor", "director", "producer", "audio_engineer", "grip_lighting", "makeup_artist", "production_assistant", "studio_staff"],
  "profile-management": [HEAD, "admin", "owner", "co_ceo"],
  "admin-invites":      [HEAD, "admin", "owner", "co_ceo"],
  "signup-codes":       [HEAD, "admin", "owner", "co_ceo"],
  "staff-approvals":    [HEAD, "admin", "owner", "co_ceo"],
  "role-management":    [HEAD, "owner", "co_ceo"],
  availability:         [HEAD, "admin", "owner", "co_ceo", "editor", "booking_manager", "project_manager"],
  audit:                [HEAD, "owner", "co_ceo"],
};

export const OWNERSHIP_ONLY: SectionId[] = [];

export const can = (roles: AppRole[], section: SectionId): boolean => {
  return SECTION_ACCESS[section].some((r) => roles.includes(r));
};

export const isHeadAdmin = (roles: AppRole[]) =>
  roles.includes("head_admin") || roles.includes("owner") || roles.includes("co_ceo");
export const isAdminLike = (roles: AppRole[]) =>
  roles.includes("head_admin") || roles.includes("admin") ||
  roles.includes("owner") || roles.includes("co_ceo");

export const canEditArticle = (roles: AppRole[]) =>
  ["head_admin", "admin", "owner", "co_ceo", "editor", "writer", "journalist"].some((r) => roles.includes(r as AppRole));

export const canPublish = (roles: AppRole[]) =>
  ["head_admin", "admin", "owner", "co_ceo", "editor"].some((r) => roles.includes(r as AppRole));

export const canManageUsers = (roles: AppRole[]) => isAdminLike(roles);

export const canManageBilling = (roles: AppRole[]) =>
  roles.includes("head_admin") || roles.includes("owner");

export const primaryRole = (roles: AppRole[]): AppRole => {
  const order: AppRole[] = ["owner", "co_ceo", "head_admin", "admin", "social_articles_lead", "editor", "journalist", "project_manager", "writer", "booking_manager", "social_manager", "media_manager", "designer", "producer", "crew", "intern", "client"];
  return order.find((r) => roles.includes(r)) ?? "client";
};
