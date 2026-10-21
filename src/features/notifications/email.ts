import 'server-only';
import type { NotifyInput } from './service';

/**
 * Email delivery channel — intentionally a no-op for now.
 *
 * To enable email later: implement `send` with Resend / Nodemailer (SMTP),
 * look up the recipients' emails, and add the provider keys to `.env`.
 * Nothing else in the app needs to change.
 */
export interface NotificationChannel {
  send(input: NotifyInput): Promise<void>;
}

export const emailChannel: NotificationChannel = {
  async send() {
    // Not implemented yet (deferred by design).
  },
};
