import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgresStore } from './storage/postgres-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = await PostgresStore.fromEnv();
try {
  const migration = fs.readFileSync(path.join(__dirname, 'migrations', '001_dei_stage3_architecture.sql'), 'utf8');
  await store.pool.query(migration);
  const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'activities.json'), 'utf8'));
  for (const activity of fixtures) await store.upsertActivity(activity);
  console.log(`Applied DEI schema and seeded ${fixtures.length} inactive validation activities.`);
} finally { await store.close(); }
