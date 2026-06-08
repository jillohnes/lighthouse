-- Run this in Supabase: SQL Editor → New query → paste → Run
-- (Only needed once, before `pnpm import:content`)

create table if not exists content_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  region text not null,
  market text not null,
  hct_rep text not null,
  handle text not null,
  instagram_followers integer not null default 0,
  tiktok_followers integer not null default 0,
  avg_eng_rate numeric not null default 0,
  avg_viewability numeric not null default 0,
  stories_per_month integer not null default 0,
  reels_per_month integer not null default 0,
  organic_reach_instagram numeric not null default 0,
  organic_reach_tiktok numeric not null default 0,
  organic_impressions bigint not null default 0,
  paid_media boolean not null default false,
  paid_boosting_total numeric not null default 0,
  paid_impressions bigint not null default 0,
  ctr_benchmark numeric not null default 0,
  ctr_results numeric not null default 0,
  total_clicks numeric not null default 0,
  cpc_benchmark numeric not null default 0,
  cpc_results numeric not null default 0,
  cpc_delta numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_metrics_filters
  on content_metrics (region, market, metric_date);

create index if not exists idx_content_metrics_handle
  on content_metrics (handle);

alter table content_metrics enable row level security;

drop policy if exists "Service role full access on content_metrics" on content_metrics;

create policy "Service role full access on content_metrics"
  on content_metrics for all
  using (true)
  with check (true);
