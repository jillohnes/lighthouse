import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { parseSpreadsheetDate } from "@/lib/parse-spreadsheet-date";
import {
  matchesActivationRowFilters,
  matchesActivationTypeFilter,
  matchesBrandFilter,
  matchesMarketFilter,
  matchesRegionFilter,
} from "@/lib/query-filters";
import { getProgramSettings } from "@/lib/queries/settings";
import {
  BUDGET_MODES,
  normalizeActivationType,
  type ActivationType,
  type ActivationTypeSettings,
} from "@/lib/settings";
import type { ProgramMetricRow } from "@/lib/supabase/server";
import type { DashboardFilters } from "@/lib/types";

/**
 * Decode Supabase row back to Excel metrics from import.xlsx:
 *   Reach  ← content_reach  (Excel Reach)
 *   Impact ← roi           (Excel Impact)
 *   sales  ← return_value  (Excel Result — sales dollars)
 *   cost   ← spend         (activation cost from settings budget)
 */
export function decodeActivation(row: ProgramMetricRow) {
  const sales = Number(row.return_value);

  return {
    activation_type: normalizeActivationType(row.brand),
    region: row.region,
    market: row.market,
    metric_date: row.metric_date,
    location_type: row.venue_type ?? row.retailer_type ?? "Other",
    reach: Number(row.content_reach) / 1000,
    impact: Number(row.roi) / 2.2,
    result: sales,
    sales,
    cost: Number(row.spend),
    channel: row.channel,
    opt_ins: Number(row.opt_ins) || 0,
  };
}

export type DecodedActivation = ReturnType<typeof decodeActivation>;

export type ActivationExcelRecord = {
  product_brand: string;
  activation_type: string;
  region: string;
  market: string;
  metric_date: string;
  location_type: string;
  reach: number;
  impact: number;
  result: number;
  opt_ins: number;
};

let cachedActivations: { mtimeMs: number; rows: ActivationExcelRecord[] } | null =
  null;

export function resolveImportPath(): string {
  return path.join(process.cwd(), "data", "import.xlsx");
}

export function mapActivationExcelRow(
  row: Record<string, unknown>,
): ActivationExcelRecord {
  return {
    product_brand: String(row.Brand ?? "").trim(),
    activation_type: normalizeActivationType(
      String(row["Activation Type"] ?? ""),
    ),
    region: String(row.Region ?? "").trim(),
    market: String(row.Market ?? "").trim(),
    metric_date: parseSpreadsheetDate(row.Date),
    location_type: String(row["Location Type"] ?? "").trim(),
    reach: Number(row.Reach) || 0,
    impact: Number(row.Impact) || 0,
    result: Number(row.Result) || 0,
    opt_ins: Number(row["Opt-Ins"] ?? row["Opt Ins"] ?? 0) || 0,
  };
}

export function loadActivationExcelRecords(
  filePath = resolveImportPath(),
): ActivationExcelRecord[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const { mtimeMs } = fs.statSync(filePath);
    if (cachedActivations && cachedActivations.mtimeMs === mtimeMs) {
      return cachedActivations.rows;
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.includes("Activations")
      ? "Activations"
      : workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[sheetName],
      { defval: "" },
    );

    const rows = rawRows.map(mapActivationExcelRow);
    cachedActivations = { mtimeMs, rows };
    return rows;
  } catch (error) {
    console.error("Failed to load import.xlsx:", error);
    return [];
  }
}

export function filterActivationMetrics(
  rows: ActivationExcelRecord[],
  filters: DashboardFilters,
): ActivationExcelRecord[] {
  return rows.filter((row) => matchesActivationRowFilters(filters, row));
}

export function filterActivationMetricsByRegionMarketBrand(
  rows: ActivationExcelRecord[],
  filters: DashboardFilters,
): ActivationExcelRecord[] {
  return rows.filter(
    (row) =>
      matchesRegionFilter(filters, row.region) &&
      matchesMarketFilter(filters, row.market) &&
      matchesBrandFilter(filters, row.product_brand) &&
      matchesActivationTypeFilter(filters, row.activation_type),
  );
}

function getActivationSpend(
  activationType: ActivationType,
  budgets: Record<ActivationType, ActivationTypeSettings>,
  digitalCount: number,
): number {
  const config = budgets[activationType];
  if (!config) return 0;

  if (BUDGET_MODES[activationType] === "total_cost") {
    return digitalCount > 0 ? config.budget / digitalCount : 0;
  }

  return config.budget;
}

export function activationExcelToProgramRow(
  record: ActivationExcelRecord,
  budgets: Record<ActivationType, ActivationTypeSettings>,
  digitalCount: number,
  index: number,
): ProgramMetricRow {
  const activationType = normalizeActivationType(
    record.activation_type,
  ) as ActivationType;
  const spend = getActivationSpend(activationType, budgets, digitalCount);
  const roi = record.impact > 0 ? record.impact * 2.2 : 0;
  const isDigital = activationType.toLowerCase().includes("digital");
  const channel = isDigital ? "off_premise" : "on_premise";

  return {
    id: `excel-${index}`,
    brand: activationType,
    product_brand: record.product_brand || null,
    region: record.region,
    market: record.market,
    metric_date: record.metric_date,
    channel,
    venue_type: channel === "on_premise" ? record.location_type : null,
    retailer_type: channel === "off_premise" ? record.location_type : null,
    spend,
    return_value: record.result,
    roi,
    samples: isDigital ? record.reach : Math.round(record.reach * 0.4),
    content_reach: record.reach * 1000,
    opt_ins: record.opt_ins,
    py_spend_change: null,
    py_roi_change: null,
  };
}

export function summarizeActivationTypeFromExcel(
  records: ActivationExcelRecord[],
  type: ActivationType,
) {
  const typeRecords = records.filter(
    (record) => normalizeActivationType(record.activation_type) === type,
  );
  const sales = typeRecords.reduce((sum, record) => sum + record.result, 0);
  const impact = typeRecords.reduce((sum, record) => sum + record.impact, 0);
  const reach = typeRecords.reduce((sum, record) => sum + record.reach, 0);

  return {
    count: typeRecords.length,
    sales,
    impact,
    reach,
  };
}

export function loadActivationRowsForDashboard(
  filters: DashboardFilters,
  filePath = resolveImportPath(),
): ActivationExcelRecord[] {
  const allRows = loadActivationExcelRecords(filePath);
  if (!allRows.length) return [];

  const dateFiltered = filterActivationMetrics(allRows, filters);
  if (dateFiltered.length > 0) return dateFiltered;

  return filterActivationMetricsByRegionMarketBrand(allRows, filters);
}

export async function loadFilteredActivationsAsProgramRows(
  filters: DashboardFilters,
  filePath = resolveImportPath(),
): Promise<ProgramMetricRow[]> {
  const records = loadActivationRowsForDashboard(filters, filePath);
  if (!records.length) return [];

  const allRecords = loadActivationExcelRecords(filePath);
  const settings = await getProgramSettings();
  const digitalCount = allRecords.filter((row) =>
    row.activation_type.toLowerCase().includes("digital"),
  ).length;

  return records.map((record, index) =>
    activationExcelToProgramRow(
      record,
      settings.activationTypes,
      digitalCount,
      index,
    ),
  );
}
