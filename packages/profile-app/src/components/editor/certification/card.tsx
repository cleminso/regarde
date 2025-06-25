import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Certification } from '#/lib/schema';
import { formatDateRange } from '#/lib/utils';
import { EditorCardActions } from '../cardActions';

type CertificationCardProps = {
  certification: Loaded<typeof Certification>;
  onEdit: (certification: Loaded<typeof Certification>) => void;
  onDelete: (certification: Loaded<typeof Certification>) => void;
};

export function CertificationCard({
  certification,
  onEdit,
  onDelete,
}: CertificationCardProps) {
  const displayTitle = `${certification.name || 'Untitled Certification'}`;
  const dateRange = formatDateRange(certification.issued, certification.expire);

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">{dateRange}</span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {certification.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group"
              >
                <a
                  href={certification.url}
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
          <div className="text-sm text-secondary-foreground">
            {certification.organization || 'Unknown Organization'}
          </div>
          {certification.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
              {certification.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={certification}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
