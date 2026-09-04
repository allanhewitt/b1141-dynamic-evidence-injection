import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const migration001 = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_dei_stage3_architecture.sql'),
    'utf8'
  );
  const migration002 = fs.readFileSync(
    path.join(__dirname, 'migrations', '002_dei_stage4_b1141_configuration.sql'),
    'utf8'
  );

  await pool.query(migration001);
  await pool.query(migration002);

  const { rows } = await pool.query(`
    SELECT id, title, model, schema_version, active
    FROM activities
    WHERE id IN (
      'b1141-w2-who-dopes-dei',
      'b1141-w8-disclosure-sequence-dei'
    )
    ORDER BY id
  `);

  if (rows.length !== 2) {
    throw new Error(`Expected 2 canonical Stage 4 DEI activities after migration; found ${rows.length}`);
  }
  if (rows.some((row) => row.model !== 'dei' || row.schema_version !== 1 || row.active !== false)) {
    throw new Error('Stage 4 DEI read-back failed: canonical rows are not in the expected inactive v1 state');
  }

  console.log('DEI Stage 4 PostgreSQL initialisation complete.');
  for (const row of rows) {
    console.log(`${row.id} | ${row.title} | active=${row.active}`);
  }
} finally {
  await pool.end();
}
