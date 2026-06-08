/**
 * Import Excel / CSV data into Supabase.
 *
 * Usage:
 *   1. Copy .env.local.example → .env.local and fill in Supabase keys
 *   2. Run schema: supabase/schema.sql in Supabase SQL Editor
 *   3. Place your file at data/import.xlsx (or pass a path as argument)
 *   4. Run: pnpm import:data
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

config({ path: ".env.local" });

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

function normalizeHeader(header: string): string {
  return COLUMN_MAP[header.trim().toLowerCase()] ?? header.trim().toLowerCase();
}

function normalizeChannel(value: string): "on_premise" | "off_premise" {
  const v = value.toLowerCase().replace(/\s+/g, "_");
  if (v.includes("off")) return "off_premise";
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
  const str = String(value);
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  throw new Error(`Could not parse date: ${value}`);
}

async function main() {
  const filePath = process.argv[2] ?? path.join("data", "import.xlsx");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error("Place your Excel file at data/import.xlsx or pass the path as an argument.");
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (!rawRows.length) {
    console.error("No rows found in spreadsheet.");
    process.exit(1);
  }

  const headers = Object.keys(rawRows[0]).map(normalizeHeader);
  const required = ["brand", "region", "market", "metric_date", "channel", "spend"];
  const missing = required.filter((col) => !headers.includes(col));

  if (missing.length) {
    console.error(`Missing required columns: ${missing.join(", ")}`);
    console.error("Expected columns: brand, region, market, date, channel, spend, return_value, roi, samples, content_reach, venue_type, retailer_type");
    process.exit(1);
  }

  const records = rawRows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[normalizeHeader(key)] = value;
    }

    return {
      brand: String(mapped.brand),
      region: String(mapped.region),
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
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

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
