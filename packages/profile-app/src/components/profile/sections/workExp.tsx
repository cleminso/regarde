import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { OnboardingProfile, WorkExp as WorkExpSchema } from '#/lib/schema';

type WorkExpProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

const formatDate = (
  date: Date | string | undefined,
  isEndDate?: boolean,
): string => {
  if (isEndDate && !date) return 'Now';
  if (!date) return 'N/A';

  if (date instanceof Date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
    });
  }
  return String(date);
};

const getHref = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export function WorkExp({ profile }: WorkExpProps) {
  const workExperiences = profile.workExp?.filter(
    (exp: any): exp is Loaded<typeof WorkExpSchema> => exp !== null,
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
          const dateRange = `${formatDate(workExp.from)} - ${formatDate(workExp.to, true)}`;
          const companyLink = getHref(workExp.url);

          return (
            <div
              key={workExp.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-28 flex-shrink-0">
                  <span className="text-sm font-sans text-muted-foreground">
                    {dateRange}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {companyLink ? (
                      <a
                        href={companyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-md font-sans text-foreground hover:underline hover:underline-offset-4 inline-flex items-center"
                      >
                        {displayTitle}
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      <h4 className="text-md font-sans text-foreground">
                        {displayTitle}
                      </h4>
                    )}
                  </div>
                  {workExp.location && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {workExp.location}
                      </span>
                    </div>
                  )}
                  {workExp.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
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
