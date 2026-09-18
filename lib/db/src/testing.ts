import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "./schema";

type SqlExecutor = {
  query(sql: string): Promise<unknown>;
  connect(): Promise<{
    query(sql: string): Promise<unknown>;
    release(): void;
  }>;
};

const postgresIdentifier = /^[a-z_][a-z0-9_]*$/;

export async function createApplicationTablesInSchema(
  executor: SqlExecutor,
  schemaName: string,
) {
  if (!postgresIdentifier.test(schemaName)) {
    throw new Error(`Invalid PostgreSQL schema name: ${schemaName}`);
  }

  const emptySnapshot = generateDrizzleJson({});
  const applicationSnapshot = generateDrizzleJson(schema, emptySnapshot.id);
  const statements = await generateMigration(emptySnapshot, applicationSnapshot);
  const qualifiedSchema = `"${schemaName}".`;
  const client = await executor.connect();

  try {
    await client.query("begin");
    await client.query(`set local search_path to "${schemaName}"`);
    for (const statement of statements) {
      const isolatedStatement = statement.replaceAll(`"public".`, qualifiedSchema);
      if (isolatedStatement.includes(`"public".`)) {
        throw new Error("Generated application schema contains an unexpected public reference");
      }
      await client.query(isolatedStatement);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}