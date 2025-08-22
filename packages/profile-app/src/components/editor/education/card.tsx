import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Education } from '#/lib/schema';
import { formatDateRange } from '#/lib/utils';
import { EditorCardActions } from '../cardActions';

type EducationCardProps = {
  education: Loaded<typeof Education>;
  onEdit: (education: Loaded<typeof Education>) => void;
  onDelete: (education: Loaded<typeof Education>) => void;
};

export function EducationCard({
  education,
  onEdit,
  onDelete,
}: EducationCardProps) {
  const displayTitle = `${education.degree || 'Untitled Degree'} @${
    education.institution || 'Unnamed Institution'
  }`;
  const dateRange = formatDateRange(education.from, education.to);

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{dateRange}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {education.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
              >
                <a
                  href={education.url}
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
          {education.location && (
            <div className="text-sm text-muted-foreground">
              {education.location}
            </div>
          )}
          {education.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {education.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={education}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
