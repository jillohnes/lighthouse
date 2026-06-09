-- Add opt-in count from import.xlsx (run in Supabase SQL Editor)
alter table program_metrics
  add column if not exists opt_ins integer not null default 0;
