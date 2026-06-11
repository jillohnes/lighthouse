import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { formatDateParam, parseDateParam } from "@/lib/dates";
import { parseSpreadsheetDate } from "@/lib/parse-spreadsheet-date";
import {
  matchesBrandFilter,
  matchesContentRowFilters,
  matchesMarketFilter,
  matchesRegionFilter,
} from "@/lib/query-filters";
import type { DashboardFilters } from "@/lib/types";

export type ContentMetricRecord = {
  metric_date: string;
  region: string;
  market: string;
  product_brand: string;
  hct_rep: string;
  handle: string;
  content_type: string;
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
    product_brand: row.product_brand || null,
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
  return path.join(process.cwd(), "data", "content.xlsx");
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
    product_brand: String(row.Brand ?? "").trim(),
    hct_rep: String(row["HCT Rep"] ?? "").trim(),
    handle: String(row.Handle ?? "").trim(),
    content_type: String(row["Content Type"] ?? "Post").trim(),
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
  return rows.filter((row) => matchesContentRowFilters(filters, row));
}

export function filterContentMetricsByRegionMarket(
  rows: ContentMetricRecord[],
  filters: DashboardFilters,
): ContentMetricRecord[] {
  return rows.filter(
    (row) =>
      matchesRegionFilter(filters, row.region) &&
      matchesMarketFilter(filters, row.market) &&
      matchesBrandFilter(filters, row.product_brand),
  );
}

/** Load creator rows from data/content.xlsx for charts and rankings. */
const PROGRAM_MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;

/**
 * content.xlsx encodes program month as day-of-month on each row's Date
 * (day 1 → Jan, day 2 → Feb, … day 6 → Jun). Falls back to calendar month.
 */
export function getContentProgramMonthLabel(metricDate: string): string | null {
  const date = parseDateParam(metricDate);
  const day = date.getDate();
  if (day >= 1 && day <= PROGRAM_MONTH_LABELS.length) {
    return PROGRAM_MONTH_LABELS[day - 1];
  }

  const monthIndex = date.getMonth();
  if (monthIndex >= 0 && monthIndex < PROGRAM_MONTH_LABELS.length) {
    return PROGRAM_MONTH_LABELS[monthIndex];
  }

  return null;
}

export function loadContentRowsForCharts(
  filters: DashboardFilters,
  filePath = resolveContentPath(),
): ContentMetricRecord[] {
  const allRows = loadContentMetrics(filePath);
  if (!allRows.length) return [];

  const dateFiltered = filterContentMetrics(allRows, filters);
  if (dateFiltered.length > 0) return dateFiltered;

  // Dashboard dates often reflect activations; still show content from the xlsx.
  return filterContentMetricsByRegionMarket(allRows, filters);
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
