-- Add product brand for portfolio filtering (run in Supabase SQL Editor)
alter table program_metrics
  add column if not exists product_brand text;

create index if not exists idx_program_metrics_product_brand
  on program_metrics (product_brand);
