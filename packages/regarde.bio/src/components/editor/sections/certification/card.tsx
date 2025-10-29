import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Certification } from '#/lib/schema';
import { formatDateRange } from '#/lib/utils/utils';
import { EditorCardActions } from '../../shared/cardActions';

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{dateRange}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {certification.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
              >
                <a
                  href={certification.url}
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
          <div className="text-sm text-muted-foreground">
            {certification.organization || 'Unknown Organization'}
          </div>
          {certification.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
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
