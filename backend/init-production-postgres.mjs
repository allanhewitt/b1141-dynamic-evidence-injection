import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANONICAL_IDS = [
  'b1141-w2-who-dopes-dei',
  'b1141-w8-disclosure-sequence-dei'
];

export async function initialiseProductionPostgres(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const migration001 = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_dei_stage3_architecture.sql'),
      'utf8'
    );
    await pool.query(migration001);

    const before = await pool.query(
      `SELECT id FROM activities WHERE id = ANY($1::text[]) AND model = 'dei' ORDER BY id`,
      [CANONICAL_IDS]
    );

    if (before.rows.length === 0) {
      const migration002 = fs.readFileSync(
        path.join(__dirname, 'migrations', '002_dei_stage4_b1141_configuration.sql'),
        'utf8'
      );
      await pool.query(migration002);
    } else if (before.rows.length !== CANONICAL_IDS.length) {
      throw new Error(
        `Partial DEI production configuration detected: expected 0 or ${CANONICAL_IDS.length} canonical rows, found ${before.rows.length}`
      );
    }

    const { rows } = await pool.query(
      `SELECT id, title, model, schema_version, active
       FROM activities
       WHERE id = ANY($1::text[])
       ORDER BY id`,
      [CANONICAL_IDS]
    );

    if (rows.length !== CANONICAL_IDS.length) {
      throw new Error(`Expected ${CANONICAL_IDS.length} canonical DEI rows; found ${rows.length}`);
    }
    if (rows.some((row) => row.model !== 'dei' || Number(row.schema_version) !== 1)) {
      throw new Error('DEI production read-back failed: canonical rows are not model=dei schema_version=1');
    }

    const titleById = new Map(rows.map((row) => [row.id, row.title]));
    if (titleById.get('b1141-w2-who-dopes-dei') !== 'Who Dopes?' ||
        titleById.get('b1141-w8-disclosure-sequence-dei') !== 'A Club Responds') {
      throw new Error('DEI production read-back failed: canonical titles do not match the accepted Stage 4 baseline');
    }

    console.log('DEI production PostgreSQL initialisation complete.');
    for (const row of rows) {
      console.log(`${row.id} | ${row.title} | active=${row.active}`);
    }
    return rows;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await initialiseProductionPostgres();
}
