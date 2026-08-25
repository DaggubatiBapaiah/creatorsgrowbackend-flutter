import { pool } from '../config/db';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Running database migrations...');
  const migrationFile = path.join(__dirname, 'migrations', '001_create_users_table.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Enable uuid-ossp extension in case gen_random_uuid is not native
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migrations executed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runMigrations };
