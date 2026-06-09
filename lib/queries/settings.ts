import {
  DEFAULT_PROGRAM_SETTINGS,
  rowsToSettings,
  settingsToRows,
  type ProgramSettings,
} from "@/lib/settings";
import { getSupabaseAdmin, type KpiTargetRow } from "@/lib/supabase/server";

const SETTINGS_KEY_PREFIXES = [
  "hct_",
  "htc_",
  "brand_experience_",
  "digital_sampling_",
  "content_",
];

export async function getProgramSettings(): Promise<ProgramSettings> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("kpi_targets").select("*");

  if (error || !data?.length) return DEFAULT_PROGRAM_SETTINGS;

  const settingsRows = (data as KpiTargetRow[]).filter((row) =>
    SETTINGS_KEY_PREFIXES.some((prefix) => row.metric_key.startsWith(prefix)),
  );

  if (!settingsRows.length) return DEFAULT_PROGRAM_SETTINGS;

  return rowsToSettings(settingsRows);
}

export async function saveProgramSettings(
  settings: ProgramSettings,
): Promise<ProgramSettings> {
  const supabase = getSupabaseAdmin();
  const rows = settingsToRows(settings);

  const { error } = await supabase.from("kpi_targets").upsert(rows, {
    onConflict: "metric_key",
  });

  if (error) throw error;

  return settings;
}
