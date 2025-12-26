import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Education } from '#/lib/schema';
import { formatDateRange } from '#/lib/utils/utils';
import { EditorCardActions } from '../../shared/cardActions';

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
    <div className="border-border flex flex-col gap-4 border-b pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{dateRange}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {education.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
              >
                <a
                  href={education.url}
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
          {education.location && (
            <div className="text-muted-foreground text-sm">
              {education.location}
            </div>
          )}
          {education.description && (
            <p className="text-muted-foreground text-sm whitespace-pre-line">
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
