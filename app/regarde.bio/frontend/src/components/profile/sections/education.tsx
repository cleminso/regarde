import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { Education, RegardeProfile } from '#/lib/schema';
import { formatDateRange, getValidUrl } from '#/lib/utils/utils';

type EducationsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Educations({ profile }: EducationsProps) {
  const educations = profile.education?.$isLoaded
    ? profile.education.filter(
        (edu: any): edu is Loaded<typeof Education> => edu?.$isLoaded === true,
      )
    : [];

  if (!educations || educations.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary text-md flex min-h-[2rem] w-full items-center justify-start px-2 py-1 font-sans whitespace-nowrap">
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
              <div
                key={education.$jazz.id}
                className="flex flex-col gap-3 pb-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-sans text-sm">
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
                          className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
                        >
                          <a
                            href={institutionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex max-w-full min-w-0 items-center gap-1"
                          >
                            <span className="truncate">{displayTitle}</span>
                            <ArrowUpRight className="h-4 w-4 shrink-0" />
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="link-title"
                          disabled
                          size="title"
                          className="-mx-1 max-w-full justify-start overflow-hidden"
                        >
                          <span className="truncate">{displayTitle}</span>
                        </Button>
                      )}
                    </div>
                    {education.description && (
                      <p className="text-muted-foreground wrap-break-words pr-1 text-sm whitespace-pre-line">
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
