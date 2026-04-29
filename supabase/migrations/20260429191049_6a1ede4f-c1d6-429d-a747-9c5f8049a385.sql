
-- ============ page_views ============
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null,
  article_id uuid,
  referrer text,
  source text not null default 'direct', -- direct | social | search | referral
  device text not null default 'unknown', -- mobile | desktop | tablet | unknown
  country text,
  city text,
  session_id text,
  visitor_id text,
  user_agent text
);
create index idx_page_views_created on public.page_views(created_at desc);
create index idx_page_views_path on public.page_views(path);
create index idx_page_views_article on public.page_views(article_id);
create index idx_page_views_source on public.page_views(source);
alter table public.page_views enable row level security;

create policy "Anyone can insert a page view"
on public.page_views for insert
to anon, authenticated
with check (true);

create policy "Editors and admins can read page views"
on public.page_views for select
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'head_admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
);

-- ============ article_engagement ============
create table public.article_engagement (
  article_id uuid primary key,
  views integer not null default 0,
  unique_views integer not null default 0,
  shares integer not null default 0,
  reactions integer not null default 0,
  avg_read_seconds integer not null default 0,
  avg_scroll_pct integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.article_engagement enable row level security;

create policy "Engagement is public for published articles"
on public.article_engagement for select
to anon, authenticated
using (
  exists (select 1 from public.articles a where a.id = article_id and a.status = 'published'::article_status)
);

create policy "Editors and admins can read all engagement"
on public.article_engagement for select
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'head_admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
);

create policy "Anyone can insert engagement row"
on public.article_engagement for insert
to anon, authenticated
with check (true);

create policy "Anyone can bump engagement"
on public.article_engagement for update
to anon, authenticated
using (true);

create trigger trg_article_engagement_updated
before update on public.article_engagement
for each row execute function public.set_updated_at();

-- Atomic view bump used by the public tracking pixel
create or replace function public.bump_article_view(article_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.article_engagement (article_id, views)
  values (article_uuid, 1)
  on conflict (article_id) do update
    set views = public.article_engagement.views + 1,
        updated_at = now();
end;
$$;

-- ============ activity_log ============
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_name text,
  kind text not null, -- article_published | article_drafted | social_scheduled | social_posted | booking_received | lead_captured | inquiry_received
  title text not null,
  detail text,
  link_url text,
  meta jsonb not null default '{}'::jsonb
);
create index idx_activity_log_created on public.activity_log(created_at desc);
alter table public.activity_log enable row level security;

create policy "Editorial team can read activity"
on public.activity_log for select
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'head_admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
  or has_role(auth.uid(), 'booking_manager'::app_role)
);

create policy "Anyone can write activity"
on public.activity_log for insert
to anon, authenticated
with check (true);

-- ============ social_post_metrics ============
create table public.social_post_metrics (
  id uuid primary key default gen_random_uuid(),
  social_post_id uuid not null,
  recorded_at timestamptz not null default now(),
  views integer not null default 0,
  likes integer not null default 0,
  shares integer not null default 0,
  comments integer not null default 0,
  reach integer not null default 0,
  engagement_rate numeric(5,2) not null default 0
);
create index idx_social_metrics_post on public.social_post_metrics(social_post_id);
alter table public.social_post_metrics enable row level security;

create policy "Studio team can read social metrics"
on public.social_post_metrics for select
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
);

create policy "Studio team can write social metrics"
on public.social_post_metrics for insert
to authenticated
with check (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
);

create policy "Studio team can update social metrics"
on public.social_post_metrics for update
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
);

create policy "Studio team can delete social metrics"
on public.social_post_metrics for delete
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
);

-- ============ social_ideas ============
create table public.social_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  title text not null,
  category text not null default 'general', -- film_breakdown | chicago_culture | music_drop | general
  notes text,
  status text not null default 'idea' -- idea | saved | drafted | published
);
create index idx_social_ideas_created on public.social_ideas(created_at desc);
alter table public.social_ideas enable row level security;

create policy "Studio team can read ideas"
on public.social_ideas for select
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
  or has_role(auth.uid(), 'writer'::app_role)
);

create policy "Studio team can insert ideas"
on public.social_ideas for insert
to authenticated
with check (
  (created_by = auth.uid())
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or has_role(auth.uid(), 'editor'::app_role)
    or has_role(auth.uid(), 'social_manager'::app_role)
    or has_role(auth.uid(), 'writer'::app_role)
  )
);

create policy "Studio team can update ideas"
on public.social_ideas for update
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
  or has_role(auth.uid(), 'social_manager'::app_role)
);

create policy "Studio team can delete ideas"
on public.social_ideas for delete
to authenticated
using (
  has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'editor'::app_role)
);

create trigger trg_social_ideas_updated
before update on public.social_ideas
for each row execute function public.set_updated_at();

-- ============ social_posts extensions ============
alter table public.social_posts
  add column if not exists thumbnail_url text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists hashtags text,
  add column if not exists link_url text,
  add column if not exists archived boolean not null default false;
