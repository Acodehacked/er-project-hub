import 'server-only';
import bcrypt from 'bcryptjs';

/** bcrypt cost factor: ~100ms per hash on a modern CPU — slow for attackers, fine for users. */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A pre-computed hash used when the email does not exist, so a failed login
 * takes the same time either way (prevents discovering valid emails by timing).
 */
export const DUMMY_HASH = bcrypt.hashSync('erhub-timing-dummy', SALT_ROUNDS);
