-- ============================================================
-- RTG OS Phase 1: Services / Staff / Portfolio / Booking links
-- ============================================================

-- Services catalog
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  short_description text,
  long_description text,
  icon text,
  cover_image_url text,
  pricing_model text not null default 'starting_at', -- starting_at | hourly | half_day | full_day | custom
  base_price numeric(10,2),
  sale_price numeric(10,2),
  packages jsonb not null default '[]'::jsonb,        -- [{name, price, includes:[]}]
  add_ons jsonb not null default '[]'::jsonb,         -- [{name, price}]
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.services enable row level security;

create policy "Available services are public"
  on public.services for select
  to anon, authenticated
  using (is_available = true);

create policy "Editors and admins see all services"
  on public.services for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'booking_manager'));

create policy "Editors and admins manage services"
  on public.services for insert
  to authenticated
  with check (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'));

create policy "Editors and admins update services"
  on public.services for update
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'));

create policy "Admins delete services"
  on public.services for delete
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin'));

create trigger set_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- Staff profiles (linked optionally to an auth user)
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,                                 -- nullable: not every staffer has a login
  slug text unique not null,
  display_name text not null,
  role_title text,
  bio text,
  photo_url text,
  cover_image_url text,
  location text default 'Chicago',
  specialties text[] not null default '{}',
  service_ids uuid[] not null default '{}',            -- denormalized list of services they offer
  instagram text,
  twitter text,
  website text,
  email text,
  is_public boolean not null default true,
  is_bookable boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.staff_profiles enable row level security;

create policy "Public staff are viewable"
  on public.staff_profiles for select
  to anon, authenticated
  using (is_public = true);

create policy "Editorial team sees all staff"
  on public.staff_profiles for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'booking_manager'));

create policy "Editors and admins create staff"
  on public.staff_profiles for insert
  to authenticated
  with check (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'));

create policy "Editors and admins update staff"
  on public.staff_profiles for update
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'));

create policy "Admins delete staff"
  on public.staff_profiles for delete
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin'));

create trigger set_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function public.set_updated_at();

-- Recurring weekly availability (0=Sun .. 6=Sat)
create table if not exists public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);
alter table public.staff_availability enable row level security;

create policy "Public availability viewable"
  on public.staff_availability for select
  to anon, authenticated
  using (exists (select 1 from public.staff_profiles s where s.id = staff_id and s.is_public = true));

create policy "Editorial team sees all availability"
  on public.staff_availability for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'booking_manager'));

create policy "Editors manage availability"
  on public.staff_availability for all
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'))
  with check (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'));

-- Blackout dates (full-day off)
create table if not exists public.staff_blackouts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  blackout_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(staff_id, blackout_date)
);
alter table public.staff_blackouts enable row level security;

create policy "Editorial team reads blackouts"
  on public.staff_blackouts for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'booking_manager'));

create policy "Public read blackouts for booking"
  on public.staff_blackouts for select
  to anon, authenticated
  using (exists (select 1 from public.staff_profiles s where s.id = staff_id and s.is_public = true));

create policy "Editors manage blackouts"
  on public.staff_blackouts for all
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'))
  with check (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor'));

-- Portfolio items per staff
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff_profiles(id) on delete cascade, -- nullable for studio-wide pieces
  title text not null,
  category text not null default 'Photography',
  client text,
  year int,
  thumbnail_url text,
  media_url text,             -- main photo OR video link
  media_type text not null default 'image', -- image | video
  description text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  is_public boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_items enable row level security;

create policy "Public portfolio items viewable"
  on public.portfolio_items for select
  to anon, authenticated
  using (is_public = true);

create policy "Editorial team sees all portfolio"
  on public.portfolio_items for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'media_manager'));

create policy "Editors manage portfolio"
  on public.portfolio_items for all
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'media_manager'))
  with check (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'head_admin') or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'media_manager'));

create trigger set_portfolio_items_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- Extend bookings with structured links + assignment workflow
alter table public.bookings
  add column if not exists service_id uuid,
  add column if not exists requested_staff_id uuid,
  add column if not exists assigned_staff_id uuid,
  add column if not exists assignment_status text not null default 'unassigned',  -- unassigned | needs_assignment | assigned | rtg_assigning
  add column if not exists no_preference boolean not null default false,
  add column if not exists project_time time,
  add column if not exists deposit_paid boolean not null default false,
  add column if not exists total_estimate numeric(10,2);

-- Extend booking_status enum (safe-guarded)
do $$
begin
  if not exists (select 1 from pg_type t join pg_enum e on t.oid=e.enumtypid where t.typname='booking_status' and e.enumlabel='contacted') then
    alter type booking_status add value 'contacted';
  end if;
exception when others then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_enum e on t.oid=e.enumtypid where t.typname='booking_status' and e.enumlabel='pending_deposit') then
    alter type booking_status add value 'pending_deposit';
  end if;
exception when others then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_enum e on t.oid=e.enumtypid where t.typname='booking_status' and e.enumlabel='booked') then
    alter type booking_status add value 'booked';
  end if;
exception when others then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_enum e on t.oid=e.enumtypid where t.typname='booking_status' and e.enumlabel='completed') then
    alter type booking_status add value 'completed';
  end if;
exception when others then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_enum e on t.oid=e.enumtypid where t.typname='booking_status' and e.enumlabel='declined') then
    alter type booking_status add value 'declined';
  end if;
exception when others then null;
end $$;

create index if not exists idx_bookings_assigned_staff on public.bookings(assigned_staff_id);
create index if not exists idx_bookings_service on public.bookings(service_id);
create index if not exists idx_portfolio_staff on public.portfolio_items(staff_id);
create index if not exists idx_staff_avail_staff on public.staff_availability(staff_id);
