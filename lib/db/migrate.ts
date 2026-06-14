import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const isMock =
    !dbUrl ||
    dbUrl === "****" ||
    dbUrl.includes("placeholder") ||
    dbUrl.includes("your_postgres");

  if (isMock) {
    console.log('⚠️ No valid DATABASE_URL or POSTGRES_URL found (placeholder or asterisks). Skipping build-time migrations.');
    process.exit(0);
  }

  const connection = postgres(dbUrl as string, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running migrations...');

  const start = Date.now();
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  const end = Date.now();

  console.log('✅ Migrations completed in', end - start, 'ms');
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
