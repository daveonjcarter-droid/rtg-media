-- Roles enum
create type public.app_role as enum ('admin', 'editor', 'writer', 'social_manager');

-- Article status enum
create type public.article_status as enum ('draft', 'submitted', 'revisions', 'approved', 'published');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer role checker
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.get_user_roles(_user_id uuid)
returns setof public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.user_roles where user_id = _user_id
$$;

create policy "Roles readable by authenticated users"
  on public.user_roles for select to authenticated using (true);

create policy "Only admins can insert roles"
  on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update roles"
  on public.user_roles for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete roles"
  on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Auto profile + role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  if lower(new.email) in ('daveonjcarter@gmail.com', 'brendynshields20@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'writer');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Articles
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  slug text unique,
  category text,
  tags text[] default '{}',
  author_id uuid not null references auth.users(id) on delete cascade,
  status public.article_status not null default 'draft',
  cover_image_url text,
  excerpt text,
  body text,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_idx on public.articles(status);
create index articles_author_idx on public.articles(author_id);

alter table public.articles enable row level security;

-- Public can read published
create policy "Published articles are public"
  on public.articles for select to anon, authenticated
  using (status = 'published');

-- Signed-in: see own + (editors/admins see all)
create policy "Authors see their own articles"
  on public.articles for select to authenticated
  using (author_id = auth.uid());

create policy "Editors and admins see all articles"
  on public.articles for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "Social managers see published articles"
  on public.articles for select to authenticated
  using (public.has_role(auth.uid(), 'social_manager') and status = 'published');

-- Insert: any authenticated writer/editor/admin
create policy "Writers, editors, admins can create articles"
  on public.articles for insert to authenticated
  with check (
    author_id = auth.uid() and (
      public.has_role(auth.uid(), 'writer') or
      public.has_role(auth.uid(), 'editor') or
      public.has_role(auth.uid(), 'admin')
    )
  );

-- Update: author can edit own (if not published), editors/admins can edit any
create policy "Authors can update their own non-published articles"
  on public.articles for update to authenticated
  using (author_id = auth.uid() and status <> 'published');

create policy "Editors and admins can update any article"
  on public.articles for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- Delete: editors/admins
create policy "Editors and admins can delete articles"
  on public.articles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger articles_updated_at before update on public.articles
  for each row execute function public.set_updated_at();