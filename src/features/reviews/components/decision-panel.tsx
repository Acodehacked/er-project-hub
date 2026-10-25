'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleX, Forward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { handleActionResult } from '@/components/forms/form-fields';
import { decideProjectAction, decideRevisionAction } from '@/actions/review-actions';

type Decision = 'FORWARD' | 'APPROVE' | 'REJECT';

/**
 * Reviewer decision box. Screening offers Forward / Request changes; the
 * final stage offers Approve / Request changes. The server re-checks that
 * this user may make this decision, so the buttons are convenience only.
 */
export function DecisionPanel({
  targetId,
  target,
  stage,
}: {
  targetId: string;
  target: 'project' | 'revision';
  stage: 'screen' | 'final';
}) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<Decision | null>(null);

  const decide = (decision: Decision) => {
    if (decision === 'REJECT' && comment.trim().length < 10) {
      setError('Tell the team what to change (at least 10 characters).');
      return;
    }
    setError(null);
    setActive(decision);
    startTransition(async () => {
      const action = target === 'project' ? decideProjectAction : decideRevisionAction;
      const result = await action({ targetId, decision, comment: comment.trim() || undefined });
      if (handleActionResult(result)) router.push('/dashboard/reviews');
      setActive(null);
    });
  };

  return (
    <Card className="border-tile-3/40 shadow-lg shadow-tile-3/10">
      <CardHeader>
        <CardTitle className="text-base">{stage === 'screen' ? 'Screening decision' : 'Final decision'}</CardTitle>
        <CardDescription>
          {stage === 'screen'
            ? 'Check the submission is complete and appropriate, then forward it to faculty or request changes.'
            : 'Approving publishes this to the repository immediately.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="review-comment">Comment for the team {stage === 'final' && '(optional when approving)'}</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="What’s good, and what should change?"
            aria-invalid={!!error}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="grid gap-2">
          {stage === 'screen' ? (
            <Button onClick={() => decide('FORWARD')} disabled={pending}>
              {active === 'FORWARD' ? <Spinner /> : <Forward />} Forward to faculty
            </Button>
          ) : (
            <Button onClick={() => decide('APPROVE')} disabled={pending} className="bg-success text-success-foreground hover:bg-success/90">
              {active === 'APPROVE' ? <Spinner /> : <CircleCheck />} Approve & publish
            </Button>
          )}
          <Button variant="outline" onClick={() => decide('REJECT')} disabled={pending} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            {active === 'REJECT' ? <Spinner /> : <CircleX />} Request changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
