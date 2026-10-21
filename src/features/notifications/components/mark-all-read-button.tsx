'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { markNotificationsReadAction } from '@/actions/account-actions';

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => { await markNotificationsReadAction(); router.refresh(); })}>
      {pending ? <Spinner /> : <CheckCheck />} Mark all as read
    </Button>
  );
}
