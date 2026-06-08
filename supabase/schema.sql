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

-- Default targets (edit in Settings UI or here)
insert into kpi_targets (metric_key, target_value, label) values
  ('htc_reach', 1200, 'Reach (People Engaged) (Per Activation)'),
  ('htc_impact', 350, 'Impact (People Sampled) (Per Activation)'),
  ('htc_result', 150000, 'Results (Sales During Activation) (Per Activation)'),
  ('htc_budget', 2500, 'Avg Activation Cost'),
  ('brand_experience_reach', 1800, 'Reach (People Engaged) (Per Activation)'),
  ('brand_experience_impact', 450, 'Impact (People Sampled) (Per Activation)'),
  ('brand_experience_result', 220000, 'Results (Sales During Activation) (Per Activation)'),
  ('brand_experience_budget', 4500, 'Avg Activation Cost'),
  ('digital_sampling_reach', 1500000, 'Reach (QR Code Scans) (Total Program)'),
  ('digital_sampling_impact', 500000, 'Impact (Redemptions) (Total Program)'),
  ('digital_sampling_result', 1500000, 'Results (Sales) (Total Program)'),
  ('digital_sampling_budget', 500000, 'Total Cost Budget')
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
