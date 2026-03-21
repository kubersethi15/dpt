-- ═══════════════════════════════════════════════════════════════
-- DPT CONTENT HUB — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES TABLE (extends Supabase Auth)
-- Role: 'admin' for DPT team, 'client' for clients
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  company text,
  niche text,
  avatar_initials text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. POSTS TABLE (content pipeline)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'changes_requested', 'approved', 'scheduled', 'posted')),
  scheduled_date date,
  platform text default 'LinkedIn' check (platform in ('LinkedIn', 'Twitter', 'Instagram', 'Facebook')),
  content_type text default 'Text' check (content_type in ('Text', 'Carousel', 'Image', 'Video', 'Poll', 'Article')),
  graphic_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. POST COMMENTS (feedback thread per post)
create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  content text not null,
  is_client boolean default false,
  created_at timestamptz default now()
);

-- 4. REPORT DATA (weekly LinkedIn metrics, manually entered)
create table public.report_data (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  week_label text not null,
  week_start date not null,
  impressions integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  profile_views integer default 0,
  followers integer default 0,
  search_appearances integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, week_start)
);

-- 5. GENERATED REPORTS (saved report snapshots)
create table public.generated_reports (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  period_start date,
  period_end date,
  report_data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

create index idx_posts_client on public.posts(client_id);
create index idx_posts_status on public.posts(status);
create index idx_posts_scheduled on public.posts(scheduled_date);
create index idx_comments_post on public.post_comments(post_id);
create index idx_report_data_client on public.report_data(client_id);
create index idx_report_data_week on public.report_data(week_start);

-- ═══════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.report_data enable row level security;
alter table public.generated_reports enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTION: Check if current user is admin
-- ═══════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- PROFILES: Admin sees all, clients see own
create policy "Admin reads all profiles" on public.profiles
  for select using (public.is_admin());
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Admin manages profiles" on public.profiles
  for all using (public.is_admin());
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- POSTS: Admin full access, clients read own + can't edit content
create policy "Admin full access posts" on public.posts
  for all using (public.is_admin());
create policy "Clients read own posts" on public.posts
  for select using (client_id = auth.uid());
create policy "Clients update post status" on public.posts
  for update using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- COMMENTS: Anyone on the post can read/write
create policy "Admin full access comments" on public.post_comments
  for all using (public.is_admin());
create policy "Clients read comments on own posts" on public.post_comments
  for select using (
    exists (select 1 from public.posts where posts.id = post_id and posts.client_id = auth.uid())
  );
create policy "Clients add comments on own posts" on public.post_comments
  for insert with check (
    author_id = auth.uid() and
    exists (select 1 from public.posts where posts.id = post_id and posts.client_id = auth.uid())
  );

-- REPORT DATA: Admin full access, clients read own
create policy "Admin full access report_data" on public.report_data
  for all using (public.is_admin());
create policy "Clients read own report_data" on public.report_data
  for select using (client_id = auth.uid());

-- GENERATED REPORTS: Admin full access, clients read own
create policy "Admin full access generated_reports" on public.generated_reports
  for all using (public.is_admin());
create policy "Clients read own generated_reports" on public.generated_reports
  for select using (client_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ═══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger update_posts_updated_at before update on public.posts
  for each row execute function public.update_updated_at();
create trigger update_report_data_updated_at before update on public.report_data
  for each row execute function public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET FOR GRAPHICS
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('graphics', 'graphics', true);

create policy "Admin uploads graphics" on storage.objects
  for insert with check (bucket_id = 'graphics' and public.is_admin());
create policy "Anyone reads graphics" on storage.objects
  for select using (bucket_id = 'graphics');
create policy "Admin deletes graphics" on storage.objects
  for delete using (bucket_id = 'graphics' and public.is_admin());
