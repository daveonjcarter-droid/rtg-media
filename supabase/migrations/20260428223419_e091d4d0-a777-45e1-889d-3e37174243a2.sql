-- Bookings
create type public.shoot_type as enum ('studio', 'location', 'hybrid');
create type public.contact_method as enum ('email', 'phone', 'text');
create type public.booking_status as enum ('new', 'contacted', 'negotiating', 'booked', 'completed', 'declined');
create type public.lead_source as enum ('booking', 'newsletter', 'advertise', 'contact', 'other');
create type public.social_platform as enum ('instagram', 'tiktok', 'x', 'youtube');
create type public.social_status as enum ('draft', 'ready', 'posted');
create type public.advertise_status as enum ('new', 'in_review', 'accepted', 'declined');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  preferred_contact public.contact_method not null default 'email',
  service text,
  shoot_type public.shoot_type,
  project_date date,
  duration text,
  budget text,
  description text,
  reference_link text,
  location_detail text,
  studio_preference text,
  base_cost numeric default 0,
  studio_cost numeric default 0,
  travel_cost numeric default 0,
  equipment_cost numeric default 0,
  status public.booking_status not null default 'new',
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_status_idx on public.bookings(status);
create index bookings_archived_idx on public.bookings(archived);

alter table public.bookings enable row level security;

create policy "Anyone can submit a booking"
  on public.bookings for insert to anon, authenticated with check (true);

create policy "Editors and admins can read bookings"
  on public.bookings for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Editors and admins can update bookings"
  on public.bookings for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Admins can delete bookings"
  on public.bookings for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  source public.lead_source not null default 'other',
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index leads_email_idx on public.leads(email);

alter table public.leads enable row level security;

create policy "Anyone can be added as a lead"
  on public.leads for insert to anon, authenticated with check (true);

create policy "Editors and admins can read leads"
  on public.leads for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Editors and admins can update leads"
  on public.leads for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Admins can delete leads"
  on public.leads for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Newsletter
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert to anon, authenticated with check (true);

create policy "Editors and admins can read subscribers"
  on public.newsletter_subscribers for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Admins can delete subscribers"
  on public.newsletter_subscribers for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Advertise
create table public.advertise_inquiries (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  email text not null,
  budget text,
  message text not null,
  status public.advertise_status not null default 'new',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.advertise_inquiries enable row level security;

create policy "Anyone can submit an advertise inquiry"
  on public.advertise_inquiries for insert to anon, authenticated with check (true);

create policy "Editors and admins can read advertise inquiries"
  on public.advertise_inquiries for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Editors and admins can update advertise inquiries"
  on public.advertise_inquiries for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- Social posts
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  platform public.social_platform not null,
  caption text,
  status public.social_status not null default 'draft',
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, platform)
);

alter table public.social_posts enable row level security;

create policy "Studio team can read social posts"
  on public.social_posts for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'editor') or
    public.has_role(auth.uid(), 'social_manager')
  );

create policy "Studio team can create social posts"
  on public.social_posts for insert to authenticated
  with check (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'editor') or
    public.has_role(auth.uid(), 'social_manager')
  );

create policy "Studio team can update social posts"
  on public.social_posts for update to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'editor') or
    public.has_role(auth.uid(), 'social_manager')
  );

create policy "Editors and admins can delete social posts"
  on public.social_posts for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- updated_at triggers
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger social_posts_updated_at before update on public.social_posts
  for each row execute function public.set_updated_at();

-- Add featured + trending flags to articles
alter table public.articles
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_trending boolean not null default false,
  add column if not exists is_rtg_pick boolean not null default false;