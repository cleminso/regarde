import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Award } from '#/lib/schema';
import { formatYearString } from '#/lib/utils';
import { EditorCardActions } from '../cardActions';

type AwardCardProps = {
  award: Loaded<typeof Award>;
  onEdit: (award: Loaded<typeof Award>) => void;
  onDelete: (award: Loaded<typeof Award>) => void;
};

export function AwardCard({ award, onEdit, onDelete }: AwardCardProps) {
  const displayTitle = award.presenter
    ? `${award.title || 'Untitled Award'} by ${award.presenter}`
    : award.title || 'Untitled Award';

  const displayYear = formatYearString(award.year);

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">
            {displayYear}
          </span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {award.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1"
              >
                <a href={award.url} target="_blank" rel="noopener noreferrer">
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
          {award.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
              {award.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={award}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
