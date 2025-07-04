import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Volunteering } from '#/lib/schema';
import { EditorCardActions } from '../cardActions';

type VolunteeringCardProps = {
  volunteering: Loaded<typeof Volunteering>;
  onEdit: (volunteering: Loaded<typeof Volunteering>) => void;
  onDelete: (volunteering: Loaded<typeof Volunteering>) => void;
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

export function VolunteeringCard({
  volunteering,
  onEdit,
  onDelete,
}: VolunteeringCardProps) {
  const displayTitle = `${volunteering.title || 'Untitled Role'} @${
    volunteering.organization || 'Unnamed Organization'
  }`;
  const dateRange = `${formatDate(volunteering.from)} - ${formatDate(volunteering.to)}`;

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">{dateRange}</span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {volunteering.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1"
              >
                <a
                  href={volunteering.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {displayTitle}
                  <ArrowUpRight className="h-4 w-4 group-hover:opacity-100" />
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
          {volunteering.location && (
            <div className="text-sm text-secondary-foreground">
              {volunteering.location}
            </div>
          )}
          {volunteering.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
              {volunteering.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={volunteering}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
