#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

(async function main(){
  const sqlPath = path.join(__dirname, '..', 'supabase', 'otp_table.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Prefer direct Postgres connection via SUPABASE_DB_URL (recommended)
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_CONN;
  if (dbUrl) {
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      console.log('Connected to Postgres. Running SQL...');
      await client.query(sql);
      console.log('SQL executed successfully. Tables created.');
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error('Failed to execute SQL via Postgres connection:', err.message || err);
      process.exit(2);
    }
  }

  // Fallback: try to use Supabase service role via REST (not implemented)
  console.log('\nNo SUPABASE_DB_URL found in environment.');
  console.log('To run the SQL automatically, provide a Postgres connection string as SUPABASE_DB_URL (from Supabase Project > Settings > Database > Connection string).');
  console.log('\nAlternatively, run the SQL manually in Supabase SQL editor:');
  console.log(`
  1) Open your Supabase project → SQL Editor
  2) Create a new query and paste the contents of: ${sqlPath}
  3) Run the query
`);
  process.exit(0);
})();
