import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Speaking } from '#/lib/schema';
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
  const year = speaking.year?.getFullYear().toString() || 'N/A';

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">{year}</span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {speaking.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group"
              >
                <a
                  href={speaking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {displayTitle}
                  <ArrowUpRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100" />
                </a>
              </Button>
            ) : (
              <Button
                variant="link-title"
                size="title"
                disabled
                className="cursor-default"
              >
                {displayTitle}
              </Button>
            )}
          </div>
          {displayLocation && (
            <p className="text-sm text-muted-foreground">{displayLocation}</p>
          )}
          {speaking.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
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
