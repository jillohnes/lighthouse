import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { formatDateParam } from "@/lib/dates";
import { parseSpreadsheetDate } from "@/lib/parse-spreadsheet-date";
import type { DashboardFilters } from "@/lib/types";

export type ContentMetricRecord = {
  metric_date: string;
  region: string;
  market: string;
  hct_rep: string;
  handle: string;
  instagram_followers: number;
  tiktok_followers: number;
  avg_eng_rate: number;
  avg_viewability: number;
  stories_per_month: number;
  reels_per_month: number;
  organic_reach_instagram: number;
  organic_reach_tiktok: number;
  organic_impressions: number;
  paid_media: boolean;
  paid_boosting_total: number;
  paid_impressions: number;
  ctr_benchmark: number;
  ctr_results: number;
  total_clicks: number;
  cpc_benchmark: number;
  cpc_results: number;
  cpc_delta: number;
};

export type ContentTotals = {
  organicImpressions: number;
  paidReach: number;
};

/** Stored in program_metrics.brand — keeps content rows separate from activations. */
export const CONTENT_BRAND = "Content";

export function mapContentToProgramMetric(row: ContentMetricRecord) {
  return {
    brand: CONTENT_BRAND,
    region: row.region,
    market: row.market,
    metric_date: row.metric_date,
    channel: "off_premise" as const,
    venue_type: row.handle,
    retailer_type: row.hct_rep,
    spend: 0,
    return_value: row.paid_impressions,
    roi: 0,
    samples: 0,
    content_reach: row.organic_impressions,
    py_spend_change: null,
    py_roi_change: null,
  };
}

let cachedContent: { mtimeMs: number; rows: ContentMetricRecord[] } | null =
  null;

export function resolveContentPath(): string {
  const candidates = [
    path.join(process.cwd(), "data", "content.xlsx"),
    path.join(process.cwd(), "..", "data", "content.xlsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapCreatorsRow(row: Record<string, unknown>): ContentMetricRecord {
  const paidFlag = String(row["Paid Media (Y/N)"] ?? "")
    .trim()
    .toUpperCase();

  return {
    metric_date: parseSpreadsheetDate(row.Date),
    region: String(row.Region ?? "").trim(),
    market: String(row.Market ?? "").trim(),
    hct_rep: String(row["HCT Rep"] ?? "").trim(),
    handle: String(row.Handle ?? "").trim(),
    instagram_followers: num(row["Instagram (Total Followers)"]),
    tiktok_followers: num(row["TikTok (Total Followers)"]),
    avg_eng_rate: num(row["Avg Eng Rate"]),
    avg_viewability: num(row["Avg Viewability"]),
    stories_per_month: num(row["Stories per Month"]),
    reels_per_month: num(row["Reels per Month"]),
    organic_reach_instagram: num(row["Total Organic Reach Instagram"]),
    organic_reach_tiktok: num(row["Total Organic Reach TikTok"]),
    organic_impressions: num(row["Total Organic Impressions"]),
    paid_media: paidFlag === "Y" || paidFlag === "YES",
    paid_boosting_total: num(row["Paid Boosting Total"]),
    paid_impressions: num(row["Paid Impressions"]),
    ctr_benchmark: num(row["CTR Benchmark"]),
    ctr_results: num(row["CTR Results"]),
    total_clicks: num(row["Total Clicks"]),
    cpc_benchmark: num(row["CPC Benchmark"]),
    cpc_results: num(row["CPC Results"]),
    cpc_delta: num(row["CPC Delta"]),
  };
}

export function loadContentMetrics(
  filePath = resolveContentPath(),
): ContentMetricRecord[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const { mtimeMs } = fs.statSync(filePath);
    if (cachedContent && cachedContent.mtimeMs === mtimeMs) {
      return cachedContent.rows;
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.includes("Creators")
      ? "Creators"
      : workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[sheetName],
      { defval: "" },
    );

    const rows = rawRows.map(mapCreatorsRow);
    cachedContent = { mtimeMs, rows };
    return rows;
  } catch (error) {
    console.error("Failed to load content.xlsx:", error);
    return [];
  }
}

export function getContentDateRange(): { min: string; max: string } | null {
  const rows = loadContentMetrics();
  if (!rows.length) return null;

  const dates = rows.map((row) => row.metric_date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

export function hasContentData(filters?: DashboardFilters): boolean {
  const rows = loadContentMetrics();
  if (!rows.length) return false;
  if (!filters) return true;
  return filterContentMetrics(rows, filters).length > 0;
}

export function filterContentMetrics(
  rows: ContentMetricRecord[],
  filters: DashboardFilters,
): ContentMetricRecord[] {
  const startDate = formatDateParam(filters.startDate);
  const endDate = formatDateParam(filters.endDate);
  const regions = new Set(filters.region);
  const markets = new Set(filters.market);

  return rows.filter((row) => {
    if (row.metric_date < startDate || row.metric_date > endDate) return false;
    if (regions.size > 0 && !regions.has(row.region)) return false;
    if (markets.size > 0 && !markets.has(row.market)) return false;
    return true;
  });
}

export function sumContentTotals(rows: ContentMetricRecord[]): ContentTotals {
  return rows.reduce(
    (totals, row) => ({
      organicImpressions: totals.organicImpressions + row.organic_impressions,
      paidReach: totals.paidReach + row.paid_impressions,
    }),
    { organicImpressions: 0, paidReach: 0 },
  );
}

export function getContentTotalsFromExcel(
  filters: DashboardFilters,
  filePath = resolveContentPath(),
): ContentTotals {
  try {
    const rows = loadContentMetrics(filePath);
    const filtered = filterContentMetrics(rows, filters);
    return sumContentTotals(filtered);
  } catch {
    return { organicImpressions: 0, paidReach: 0 };
  }
}
