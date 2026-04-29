-- Site content store (single row per section key, holds draft + published JSON)
create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.site_content enable row level security;

-- Anyone can read published site content (the page renders use this)
create policy "Anyone can read site content"
on public.site_content
for select
to anon, authenticated
using (true);

-- Only admins can insert/update/delete
create policy "Admins can insert site content"
on public.site_content
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update site content"
on public.site_content
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete site content"
on public.site_content
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

create trigger site_content_set_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

-- Seed the homepage section row so the editor has something to load
insert into public.site_content (section, draft, published)
values ('homepage', '{}'::jsonb, '{}'::jsonb)
on conflict (section) do nothing;

-- Storage bucket for admin-uploaded images
insert into storage.buckets (id, name, public)
values ('site-content', 'site-content', true)
on conflict (id) do nothing;

create policy "Public read site-content images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-content');

create policy "Admins can upload site-content images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-content' and public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update site-content images"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-content' and public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete site-content images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-content' and public.has_role(auth.uid(), 'admin'::app_role));
