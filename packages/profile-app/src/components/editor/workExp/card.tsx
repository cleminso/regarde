import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { WorkExp } from '#/lib/schema';
import { EditorCardActions } from '../cardActions';

type WorkExpCardProps = {
  workExp: Loaded<typeof WorkExp>;
  onEdit: (workExp: Loaded<typeof WorkExp>) => void;
  onDelete: (workExp: Loaded<typeof WorkExp>) => void;
};

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Now';

  if (date instanceof Date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
    });
  }

  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
      });
    }
  }

  return String(date);
};

export function WorkExpCard({ workExp, onEdit, onDelete }: WorkExpCardProps) {
  const displayTitle = `${workExp.title || 'Untitled Role'} @ ${
    workExp.company || 'Unnamed Company'
  }`;
  const dateRange = `${formatDate(workExp.from)} - ${formatDate(workExp.to)}`;

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-3">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-22.5 flex-shrink-0">
          <span className="text-sm font-sans text-muted-foreground inline-flex items-center">
            {dateRange}
          </span>
        </div>
        <div className="flex flex-col flex-grow">
          <div>
            {workExp.url ? (
              <a
                href={workExp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-md hover:underline hover:underline-offset-4 inline-flex items-center group"
              >
                {displayTitle}
                <ArrowUpRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100" />
              </a>
            ) : (
              <h3 className="text-md font-sans">{displayTitle}</h3>
            )}
          </div>
          <div className="pb-2">
            {workExp.location && (
              <span className="text-sm font-sans text-muted-foreground">
                {workExp.location}
              </span>
            )}
          </div>
          {workExp.description && (
            <p className="text-sm font-sans text-muted-foreground whitespace-pre-line">
              {workExp.description}
            </p>
          )}
        </div>
      </div>

      <div className="pl-30">
        {' '}
        <EditorCardActions item={workExp} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
