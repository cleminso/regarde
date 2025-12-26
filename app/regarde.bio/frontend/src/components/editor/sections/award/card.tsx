import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Award } from '#/lib/schema';
import { formatYearString } from '#/lib/utils/utils';
import { EditorCardActions } from '../../shared/cardActions';

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
    <div className="border-border flex flex-col gap-4 border-b pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{displayYear}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {award.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
              >
                <a
                  href={award.url}
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
          {award.description && (
            <p className="text-muted-foreground text-sm whitespace-pre-line">
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
