// packages/profile-app/src/components/editor/workExp/card.tsx
import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { WorkExp } from '#/lib/schema';
import { formatDateRange } from '#/lib/utils';
import { EditorCardActions } from '../cardActions';

type WorkExpCardProps = {
  workExp: Loaded<typeof WorkExp>;
  onEdit: (workExp: Loaded<typeof WorkExp>) => void;
  onDelete: (workExp: Loaded<typeof WorkExp>) => void;
};

export function WorkExpCard({ workExp, onEdit, onDelete }: WorkExpCardProps) {
  const displayTitle = `${workExp.title || 'Untitled Role'} @ ${
    workExp.company || 'Unnamed Company'
  }`;
  const dateRange = formatDateRange(workExp.from, workExp.to);

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">{dateRange}</span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {workExp.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1"
              >
                <a href={workExp.url} target="_blank" rel="noopener noreferrer">
                  {displayTitle}
                  <ArrowUpRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100" />
                </a>
              </Button>
            ) : (
              <Button
                variant="link-title"
                size="title"
                disabled
                className="cursor-default -mx-1"
              >
                {displayTitle}
              </Button>
            )}
          </div>
          {workExp.location && (
            <div className="text-sm text-secondary-foreground">
              {workExp.location}
            </div>
          )}
          {workExp.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
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
