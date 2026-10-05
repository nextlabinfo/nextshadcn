/**
 * Simple SQL migration runner.
 *
 * Runs every *.sql file in src/server/migrations in filename order,
 * inside a transaction, and records applied files in a _migrations table
 * so each file runs at most once.
 *
 *   pnpm db:migrate          # apply pending migrations
 *   pnpm db:migrate --status # list applied / pending without applying
 *
 * Reads DATABASE_URL from .env.local (or the environment).
 */

import { config } from "dotenv";
import { Pool } from "pg";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });
config();

// __dirname is available because scripts run under tsconfig.scripts.json (CommonJS).
const MIGRATIONS_DIR = join(__dirname, "..", "server", "migrations");

async function main() {
  const statusOnly = process.argv.includes("--status");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("✗ DATABASE_URL is not set (checked .env.local and environment).");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const applied = new Set(
      (await pool.query<{ filename: string }>(`SELECT filename FROM _migrations`)).rows.map((r) => r.filename),
    );

    const pending = files.filter((f) => !applied.has(f));

    if (statusOnly) {
      console.log("Applied:");
      for (const f of files.filter((f) => applied.has(f))) console.log(`  ✓ ${f}`);
      console.log("Pending:");
      if (pending.length === 0) console.log("  (none)");
      for (const f of pending) console.log(`  • ${f}`);
      return;
    }

    if (pending.length === 0) {
      console.log("✓ No pending migrations. Database is up to date.");
      return;
    }

    for (const file of pending) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
        await client.query("COMMIT");
        console.log(`✓ Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`✗ Failed on ${file}:`, (err as Error).message);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log(`\n✓ Done. Applied ${pending.length} migration(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
