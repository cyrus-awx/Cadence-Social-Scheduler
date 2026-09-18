import pg from "pg";

const SCHEMA_PREFIX = "billing_test_";
const APPLICATION_PREFIX = "billing-test:";
const OWNER_MARKER = "cadence-billing-test";
const DEFAULT_MAX_AGE_HOURS = 24;

function readMaxAgeHours(): number {
  const argument = process.argv.find((value) => value.startsWith("--max-age-hours="));
  const value = argument?.split("=", 2)[1] ?? String(DEFAULT_MAX_AGE_HOURS);
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 1) {
    throw new Error("--max-age-hours must be a number of at least 1");
  }
  return hours;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const maxAgeHours = readMaxAgeHours();
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: "billing-test-schema-cleanup",
  });

  try {
    const candidates = await pool.query<{ schema_name: string }>(`
      select n.nspname as schema_name
      from pg_namespace n
      where n.nspname like '${SCHEMA_PREFIX}%'
        and to_regclass(format('%I.billing_test_schema_owner', n.nspname)) is not null
      order by n.nspname
    `);

    let removed = 0;
    for (const { schema_name: schemaName } of candidates.rows) {
      const ownership = await pool.query<{ is_owned: boolean; is_stale: boolean }>(
        `select
           marker = $1 and owner_id = $2 as is_owned,
           created_at < now() - make_interval(hours => $3) as is_stale
         from ${pg.escapeIdentifier(schemaName)}.billing_test_schema_owner
         where marker = $1
         limit 1`,
        [OWNER_MARKER, schemaName, maxAgeHours],
      );
      if (!ownership.rows[0]?.is_owned || !ownership.rows[0].is_stale) continue;

      const active = await pool.query(
        `select 1
         from pg_stat_activity
         where application_name = $1
         limit 1`,
        [`${APPLICATION_PREFIX}${schemaName}`],
      );
      if (active.rowCount) continue;

      await pool.query(`drop schema ${pg.escapeIdentifier(schemaName)} cascade`);
      removed += 1;
      console.log(`Removed stale billing test schema: ${schemaName}`);
    }

    console.log(`Billing test schema cleanup complete; removed ${removed} schema(s).`);
  } finally {
    await pool.end();
  }
}

await main();