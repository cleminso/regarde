import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Speaking } from '#/lib/schema';
import { formatYearString } from '#/lib/utils';
import { EditorCardActions } from '../cardActions';

type SpeakingCardProps = {
  speaking: Loaded<typeof Speaking>;
  onEdit: (speaking: Loaded<typeof Speaking>) => void;
  onDelete: (speaking: Loaded<typeof Speaking>) => void;
};

export function SpeakingCard({
  speaking,
  onEdit,
  onDelete,
}: SpeakingCardProps) {
  const displayTitle = speaking.event
    ? `${speaking.title || 'Untitled Talk'} @${speaking.event}`
    : speaking.title || 'Untitled Talk';

  const displayLocation = speaking.location;
  const year = formatYearString(speaking.year);

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{year}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {speaking.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
              >
                <a
                  href={speaking.url}
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
          {displayLocation && (
            <p className="text-sm text-muted-foreground">{displayLocation}</p>
          )}
          {speaking.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {speaking.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={speaking}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
