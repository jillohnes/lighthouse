/**
 * Import Excel / CSV data into Supabase.
 *
 * Supports two formats:
 *  1. Standard — brand, region, market, date, channel, spend, ...
 *  2. Activations — Region, Market, Date, Location Type, Activation Type, Reach, Impact, Result
 *
 * Usage: pnpm import:data [path/to/file.xlsx]
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

config({ path: ".env.local" });

type MetricRecord = {
  brand: string;
  region: string;
  market: string;
  metric_date: string;
  channel: "on_premise" | "off_premise";
  venue_type: string | null;
  retailer_type: string | null;
  spend: number;
  return_value: number;
  roi: number;
  samples: number;
  content_reach: number;
  py_spend_change: number | null;
  py_roi_change: number | null;
};

const COLUMN_MAP: Record<string, string> = {
  brand: "brand",
  region: "region",
  market: "market",
  date: "metric_date",
  metric_date: "metric_date",
  channel: "channel",
  venue_type: "venue_type",
  "venue type": "venue_type",
  retailer_type: "retailer_type",
  "retailer type": "retailer_type",
  spend: "spend",
  return_value: "return_value",
  "return value": "return_value",
  roi: "roi",
  samples: "samples",
  content_reach: "content_reach",
  "content reach": "content_reach",
  py_spend_change: "py_spend_change",
  "py spend change": "py_spend_change",
  py_roi_change: "py_roi_change",
  "py roi change": "py_roi_change",
};

const REGION_MAP: Record<string, string> = {
  west: "West",
  midwest: "Midwest",
  south: "Southeast",
  east: "Northeast",
  central: "Midwest",
  northeast: "Northeast",
  southeast: "Southeast",
};

function normalizeHeader(header: string): string {
  return COLUMN_MAP[header.trim().toLowerCase()] ?? header.trim().toLowerCase();
}

function normalizeRegion(value: string): string {
  return REGION_MAP[value.trim().toLowerCase()] ?? value.trim();
}

function normalizeChannel(value: string): "on_premise" | "off_premise" {
  const v = value.toLowerCase().replace(/\s+/g, "_");
  if (v.includes("off") || v.includes("digital")) return "off_premise";
  return "on_premise";
}

function parseDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const str = String(value).trim();
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  throw new Error(`Could not parse date: ${value}`);
}

function isActivationsFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase());
  return (
    lower.includes("location type") &&
    lower.includes("activation type") &&
    lower.includes("reach")
  );
}

function mapActivationsRow(row: Record<string, unknown>): MetricRecord {
  const activationType = String(row["Activation Type"] ?? "");
  const locationType = String(row["Location Type"] ?? "");
  const reach = Number(row.Reach) || 0;
  const impact = Number(row.Impact) || 0;
  const result = Number(row.Result) || 0;
  const spend = result * 100;
  const returnValue = Math.round(spend * (0.65 + impact / 200));
  const roi = impact > 0 ? Math.min(100, Math.round(impact * 2.2)) : 0;
  const isDigital = activationType.toLowerCase().includes("digital");
  const channel = isDigital ? "off_premise" : "on_premise";

  return {
    brand: activationType,
    region: String(row.Region ?? "").trim(),
    market: String(row.Market ?? ""),
    metric_date: parseDate(row.Date),
    channel,
    venue_type: channel === "on_premise" ? locationType : null,
    retailer_type: channel === "off_premise" ? locationType : null,
    spend,
    return_value: returnValue,
    roi,
    samples: isDigital ? reach : Math.round(reach * 0.4),
    content_reach: reach * 1000,
    py_spend_change: null,
    py_roi_change: null,
  };
}

function mapStandardRow(row: Record<string, unknown>): MetricRecord {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[normalizeHeader(key)] = value;
  }

  return {
    brand: String(mapped.brand),
    region: normalizeRegion(String(mapped.region)),
    market: String(mapped.market),
    metric_date: parseDate(mapped.metric_date),
    channel: normalizeChannel(String(mapped.channel)),
    venue_type: mapped.venue_type ? String(mapped.venue_type) : null,
    retailer_type: mapped.retailer_type ? String(mapped.retailer_type) : null,
    spend: Number(mapped.spend) || 0,
    return_value: Number(mapped.return_value) || 0,
    roi: Number(mapped.roi) || 0,
    samples: Number(mapped.samples) || 0,
    content_reach: Number(mapped.content_reach) || 0,
    py_spend_change: mapped.py_spend_change ? Number(mapped.py_spend_change) : null,
    py_roi_change: mapped.py_roi_change ? Number(mapped.py_roi_change) : null,
  };
}

async function main() {
  const filePath = process.argv[2] ?? path.join("data", "import.xlsx");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.includes("Activations")
    ? "Activations"
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (!rawRows.length) {
    console.error("No rows found in spreadsheet.");
    process.exit(1);
  }

  const headers = Object.keys(rawRows[0]);
  const useActivations = isActivationsFormat(headers);

  console.log(`Sheet: ${sheetName}`);
  console.log(`Format: ${useActivations ? "Activations" : "Standard"}`);
  console.log(`Rows: ${rawRows.length}`);

  const records = useActivations
    ? rawRows.map(mapActivationsRow)
    : rawRows.map(mapStandardRow);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log("Clearing existing data...");
  const { error: deleteError } = await supabase
    .from("program_metrics")
    .delete()
    .gte("created_at", "1970-01-01");
  if (deleteError) {
    console.error("Failed to clear table:", deleteError.message);
    process.exit(1);
  }

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("program_metrics").insert(batch);
    if (error) {
      console.error("Insert error:", error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${records.length} rows...`);
  }

  console.log(`Done! Imported ${inserted} rows from ${filePath}`);
}

main();
