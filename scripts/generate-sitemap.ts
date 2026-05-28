// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://runnerstogreatness.com";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/articles", changefreq: "daily", priority: "0.9" },
  { path: "/breakdown", changefreq: "weekly", priority: "0.8" },
  { path: "/services", changefreq: "monthly", priority: "0.8" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.7" },
  { path: "/book", changefreq: "monthly", priority: "0.7" },
  { path: "/team", changefreq: "weekly", priority: "0.7" },
  { path: "/advertise", changefreq: "monthly", priority: "0.6" },
  { path: "/fest", changefreq: "monthly", priority: "0.6" },
  { path: "/picks", changefreq: "weekly", priority: "0.6" },
  { path: "/apply", changefreq: "monthly", priority: "0.5" },
  { path: "/membership", changefreq: "monthly", priority: "0.7" },
];

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Supabase env not set; skipping dynamic entries.");
    return [];
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const entries: SitemapEntry[] = [];

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, published_at")
    .eq("status", "published");
  articles?.forEach((a: any) => {
    if (a.slug) entries.push({ path: `/articles/${a.slug}`, lastmod: a.published_at?.slice(0, 10), changefreq: "monthly", priority: "0.6" });
  });

  const { data: episodes } = await supabase
    .from("breakdown_episodes")
    .select("slug, published_at")
    .eq("status", "published");
  episodes?.forEach((e: any) => {
    if (e.slug) entries.push({ path: `/breakdown/${e.slug}`, lastmod: e.published_at?.slice(0, 10), changefreq: "monthly", priority: "0.6" });
  });

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("slug, updated_at")
    .eq("is_public", true);
  staff?.forEach((s: any) => {
    if (s.slug) entries.push({ path: `/team/${s.slug}`, lastmod: s.updated_at?.slice(0, 10), changefreq: "monthly", priority: "0.5" });
  });

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const dynamic = await fetchDynamicEntries();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
})();
