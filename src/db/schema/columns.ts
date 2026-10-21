import { sql } from 'drizzle-orm';
import { timestamp, varchar } from 'drizzle-orm/mysql-core';

/**
 * Reusable column builders so every table follows the same conventions:
 *  - UUID string primary keys (safe to expose in URLs, ids cannot be guessed)
 *  - created_at / updated_at maintained by MySQL itself
 */

export const id = () =>
  varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Foreign-key column holding a UUID. */
export const uuidRef = (name: string) => varchar(name, { length: 36 });

export const createdAt = () => timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`);

export const updatedAt = () =>
  timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
