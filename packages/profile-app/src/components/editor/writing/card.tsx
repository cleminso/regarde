import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Writing } from '#/lib/schema';
import { EditorCardActions } from '../cardActions';

type WritingCardProps = {
  writing: Loaded<typeof Writing>;
  onEdit: (writing: Loaded<typeof Writing>) => void;
  onDelete: (writing: Loaded<typeof Writing>) => void;
};

export function WritingCard({ writing, onEdit, onDelete }: WritingCardProps) {
  const displayTitle = writing.publisher
    ? `${writing.title || 'Untitled Writing'} — ${writing.publisher}`
    : writing.title || 'Untitled Writing';

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">
            {writing.year || 'Year missing'}
          </span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {writing.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1"
              >
                <a href={writing.url} target="_blank" rel="noopener noreferrer">
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

          {writing.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
              {writing.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={writing}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
