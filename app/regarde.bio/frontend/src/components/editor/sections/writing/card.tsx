import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Writing } from '#/lib/schema';
import { EditorCardActions } from '../../shared/cardActions';

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
    <div className="border-border flex flex-col gap-4 border-b pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {writing.year || 'Year missing'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {writing.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
              >
                <a
                  href={writing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-full min-w-0 items-center gap-1"
                >
                  <span className="truncate">{displayTitle}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 group-hover:opacity-100" />
                </a>
              </Button>
            ) : (
              <Button
                variant="link-title"
                size="title"
                disabled
                className="-mx-1 cursor-default justify-start overflow-hidden"
              >
                <span className="truncate">{displayTitle}</span>
              </Button>
            )}
          </div>
          {writing.description && (
            <p className="text-muted-foreground text-sm whitespace-pre-line">
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
