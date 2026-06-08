/**
 * Connect content.xlsx to Supabase.
 *
 * 1. Creates content_metrics table (if DATABASE_URL is set)
 * 2. Imports data/content.xlsx
 *
 * Usage: pnpm setup:content
 *
 * Without DATABASE_URL, run supabase/content_metrics.sql in the
 * Supabase SQL Editor first, then: pnpm import:content
 */

import { config } from "dotenv";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const SCHEMA_FILE = path.join("supabase", "content_metrics.sql");

async function applySchemaWithPg(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }

  try {
    const pg = await import("pg");
    const sql = fs.readFileSync(SCHEMA_FILE, "utf8");
    const client = new pg.default.Client({ connectionString: databaseUrl });

    await client.connect();
    await client.query(sql);
    await client.end();
    console.log("content_metrics schema applied.");
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Cannot find module 'pg'") ||
        error.message.includes("Cannot find package 'pg'"))
    ) {
      console.error("Install pg first: npm install pg");
      process.exit(1);
    }

    console.error("Failed to apply schema:", error);
    process.exit(1);
  }
}

async function main() {
  const schemaApplied = await applySchemaWithPg();

  if (!schemaApplied) {
    console.log("DATABASE_URL not set — create the table manually:");
    console.log("  Supabase → SQL Editor → paste supabase/content_metrics.sql → Run");
    console.log("");
  }

  const result = spawnSync("npx", ["tsx", "scripts/import-content.ts"], {
    stdio: "inherit",
  });

  if ((result.status ?? 1) === 0) {
    console.log("content.xlsx is now connected to Supabase.");
  }

  process.exit(result.status ?? 1);
}

main();
