'use client';

import { useEffect } from 'react';
import { trackViewAction } from '@/actions/view-actions';

/** Fires one view event after the page has rendered in the browser. */
export function ViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    const t = setTimeout(() => void trackViewAction(projectId), 1500);
    return () => clearTimeout(t);
  }, [projectId]);
  return null;
}
