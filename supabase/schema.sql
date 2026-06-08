-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table if not exists program_metrics (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  region text not null,
  market text not null,
  metric_date date not null,
  channel text not null check (channel in ('on_premise', 'off_premise')),
  venue_type text,
  retailer_type text,
  spend numeric not null default 0,
  return_value numeric not null default 0,
  roi numeric not null default 0,
  samples integer not null default 0,
  content_reach bigint not null default 0,
  py_spend_change numeric,
  py_roi_change numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_program_metrics_filters
  on program_metrics (brand, region, market, metric_date);

create index if not exists idx_program_metrics_channel
  on program_metrics (channel);

create table if not exists kpi_targets (
  metric_key text primary key,
  target_value numeric not null,
  label text not null
);

-- Default targets (edit to match your program goals)
insert into kpi_targets (metric_key, target_value, label) values
  ('spend', 3500000, 'Spend to Date'),
  ('return_value', 3000000, 'Return Value'),
  ('roi', 90, 'ROI to Date'),
  ('samples', 25000, 'TTL Samples'),
  ('content_reach', 15000000, 'TTL Content Reach'),
  ('active_programs', 15, 'Active Programs'),
  ('markets', 10, 'Markets'),
  ('on_premise_roi', 90, 'On Premise ROI Target'),
  ('off_premise_roi', 85, 'Off Premise ROI Target'),
  ('total_spend', 4500000, 'Total Spend Target')
on conflict (metric_key) do nothing;

-- Allow service role full access (tighten with RLS before production)
alter table program_metrics enable row level security;
alter table kpi_targets enable row level security;

create policy "Service role full access on program_metrics"
  on program_metrics for all
  using (true)
  with check (true);

create policy "Service role full access on kpi_targets"
  on kpi_targets for all
  using (true)
  with check (true);
