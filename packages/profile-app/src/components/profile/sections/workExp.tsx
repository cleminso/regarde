import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { OnboardingProfile, WorkExp } from '#/lib/schema';
import { formatDateRange, getValidUrl } from '#/lib/utils';

type WorkExperiencesProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function WorkExperiences({ profile }: WorkExperiencesProps) {
  const workExperiences = profile.workExp?.filter(
    (exp: any): exp is Loaded<typeof WorkExp> => exp !== null,
  );

  if (!workExperiences || workExperiences.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Work Experience</h3>
      <div className="space-y-6">
        {workExperiences.map((workExp: any) => {
          const displayTitle = `${workExp.title || 'Untitled Role'} @ ${
            workExp.company || 'Unnamed Company'
          }`;

          const fromYear = String(workExp.from || '');
          const toYear = String(workExp.to || '');

          const dateRange = formatDateRange(fromYear, toYear);
          const companyLink = getValidUrl(workExp.url);

          return (
            <div
              key={workExp.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {dateRange}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-0.5">
                  <div>
                    {companyLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1"
                      >
                        <a
                          href={companyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {displayTitle}
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="link-title" disabled size="title">
                        {displayTitle}
                      </Button>
                    )}
                  </div>
                  {workExp.location && (
                    <div className="mb-2">
                      <span className="text-sm text-secondary-foreground">
                        {workExp.location}
                      </span>
                    </div>
                  )}
                  {workExp.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
                      {workExp.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
