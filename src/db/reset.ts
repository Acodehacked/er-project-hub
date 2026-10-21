/**
 * Drops EVERY table in the dev database so migrations can run from scratch.
 *   npm run db:reset   (reset -> migrate -> seed)
 * Refuses to run when NODE_ENV=production.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to reset a production database.');
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, multipleStatements: true });
  const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const { name } of rows) await conn.query(`DROP TABLE IF EXISTS \`${name}\``);
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.end();
  console.log(`✓ Dropped ${rows.length} tables`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
