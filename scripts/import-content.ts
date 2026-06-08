/**
 * Import creator/content metrics from data/content.xlsx into Supabase.
 *
 * Rows are stored in program_metrics with brand = "Content":
 *   content_reach      → Organic Impressions
 *   return_value       → Paid Reach (paid impressions)
 *
 * Usage: pnpm import:content [path/to/content.xlsx]
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as XLSX from "xlsx";
import {
  CONTENT_BRAND,
  mapContentToProgramMetric,
  mapCreatorsRow,
  resolveContentPath,
} from "../lib/content-metrics";

config({ path: ".env.local" });

async function main() {
  const filePath = process.argv[2] ?? resolveContentPath();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.includes("Creators")
    ? "Creators"
    : workbook.SheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: "" },
  );

  if (!rawRows.length) {
    console.error("No rows found in spreadsheet.");
    process.exit(1);
  }

  console.log(`Sheet: ${sheetName}`);
  console.log(`Rows: ${rawRows.length}`);

  const records = rawRows
    .map(mapCreatorsRow)
    .map(mapContentToProgramMetric);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(`Clearing existing ${CONTENT_BRAND} rows from program_metrics...`);
  const { error: deleteError } = await supabase
    .from("program_metrics")
    .delete()
    .eq("brand", CONTENT_BRAND);

  if (deleteError) {
    console.error("Failed to clear content rows:", deleteError.message);
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

  console.log(`Done! Imported ${inserted} content rows from ${filePath}`);
  console.log(`Organic Impressions → program_metrics.content_reach`);
  console.log(`Paid Reach → program_metrics.return_value`);
}

main();
