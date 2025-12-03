// packages/regarde.bio/src/components/editor/workExp/card.tsx
import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { WorkExp } from '#/lib/schema';
import { formatDateRange } from '#/lib/utils/utils';
import { EditorCardActions } from '../../shared/cardActions';

type WorkExpCardProps = {
  workExp: Loaded<typeof WorkExp>;
  onEdit: (workExp: Loaded<typeof WorkExp>) => void;
  onDelete: (workExp: Loaded<typeof WorkExp>) => void;
};

export function WorkExpCard({ workExp, onEdit, onDelete }: WorkExpCardProps) {
  const displayTitle = `${workExp.title || 'Untitled Role'} @${
    workExp.company || 'Unnamed Company'
  }`;
  const dateRange = formatDateRange(workExp.from, workExp.to);

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{dateRange}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {workExp.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
              >
                <a
                  href={workExp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex items-center gap-1 max-w-full"
                >
                  <span className="truncate">{displayTitle}</span>
                  <ArrowUpRight className="h-4 w-4 flex-shrink-0 group-hover:opacity-100" />
                </a>
              </Button>
            ) : (
              <Button
                variant="link-title"
                size="title"
                disabled
                className="cursor-default justify-start overflow-hidden -mx-1"
              >
                <span className="truncate">{displayTitle}</span>
              </Button>
            )}
          </div>
          {workExp.location && (
            <div className="text-sm text-muted-foreground">
              {workExp.location}
            </div>
          )}
          {workExp.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {workExp.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={workExp}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
