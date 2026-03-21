-- ═══════════════════════════════════════════════════════════════
-- DPT Content Hub — Migration: Per-Post Metrics
-- Run this in Supabase SQL Editor AFTER the initial schema
-- ═══════════════════════════════════════════════════════════════

-- Per-post LinkedIn metrics (entered by DPT, updatable anytime)
create table if not exists public.post_metrics (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null unique,
  impressions integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  reposts integer default 0,
  clicks integer default 0,
  saves integer default 0,
  video_views integer default 0,
  engagement_rate numeric(5,2) default 0,
  notes text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for quick lookups
create index if not exists idx_post_metrics_post on public.post_metrics(post_id);

-- RLS
alter table public.post_metrics enable row level security;

-- Admin full access
create policy "Admin full access post_metrics" on public.post_metrics
  for all using (public.is_admin());

-- Clients can read metrics for their own posts
create policy "Clients read own post_metrics" on public.post_metrics
  for select using (
    exists (select 1 from public.posts where posts.id = post_id and posts.client_id = auth.uid())
  );

-- Auto-update timestamp
create trigger update_post_metrics_updated_at before update on public.post_metrics
  for each row execute function public.update_updated_at();

-- Add posted_date to posts table (actual date it went live, separate from scheduled_date)
alter table public.posts add column if not exists posted_date date;
