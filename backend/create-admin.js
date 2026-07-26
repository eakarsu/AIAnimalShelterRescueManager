const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function main() {
  const email = String(process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SEED_ADMIN_PASSWORD || '');
  const tenantId = String(
    process.env.DEFAULT_TENANT_ID ||
    process.env.GOVERNANCE_TENANT_ID ||
    process.env.TENANT_ID ||
    'default',
  ).trim();
  if (!email || password.length < 12) throw new Error('SEED_ADMIN_EMAIL and a password of at least 12 characters are required');
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(email,password,name,role,tenant_id)
     VALUES($1,$2,$3,'admin',$4)
     ON CONFLICT(email) DO UPDATE SET
       password=EXCLUDED.password,
       name=EXCLUDED.name,
       role='admin',
       tenant_id=EXCLUDED.tenant_id`,
    [email, passwordHash, 'Runtime Administrator', tenantId],
  );
  console.log('administrator provisioned');
  await pool.end();
}

main().catch((error) => { console.error(error.message); process.exit(1); });
