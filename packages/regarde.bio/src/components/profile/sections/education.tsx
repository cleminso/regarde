import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { Education, RegardeProfile } from '#/lib/schema';
import { formatDateRange, getValidUrl } from '#/lib/utils/utils';

type EducationsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Educations({ profile }: EducationsProps) {
  const educations = profile.education?.filter(
    (edu: any): edu is Loaded<typeof Education> => edu !== null,
  );

  if (!educations || educations.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="w-full max-w-[580px] mx-auto flex flex-col gap-4  mb-6">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary w-full px-2 py-1 text-md font-sans whitespace-nowrap flex items-center justify-start min-h-[2rem]">
            EDUCATION
          </h3>
        </div>
        <div className="space-y-6">
          {educations.map((education: any) => {
            const displayTitle = `${education.degree || 'Degree'} @${
              education.institution || 'Institution'
            }`;

            const fromYear = String(education.from || '');
            const toYear = String(education.to || '');

            const dateRange = formatDateRange(fromYear, toYear);
            const institutionLink = getValidUrl(education.url);

            return (
              <div key={education.id} className="flex flex-col pb-4 gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-muted-foreground">
                      {dateRange}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="min-w-0 flex-1">
                      {institutionLink ? (
                        <Button
                          variant="link-title"
                          asChild
                          size="title"
                          className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
                        >
                          <a
                            href={institutionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex items-center gap-1 max-w-full"
                          >
                            <span className="truncate">{displayTitle}</span>
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="link-title"
                          disabled
                          size="title"
                          className="justify-start overflow-hidden -mx-1 max-w-full"
                        >
                          <span className="truncate">{displayTitle}</span>
                        </Button>
                      )}
                    </div>
                    {education.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line break-words pr-1">
                        {education.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
