import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Education, OnboardingProfile } from '#/lib/schema';
import { formatDateRange, getValidUrl } from '#/lib/utils';

type EducationsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Educations({ profile }: EducationsProps) {
  const educations = profile.education?.filter(
    (edu: any): edu is Loaded<typeof Education> => edu !== null,
  );

  if (!educations || educations.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Education</h3>
      <div className="space-y-6">
        {educations.map((education: any) => {
          const displayTitle = `${education.degree || 'Degree'} @ ${
            education.institution || 'Institution'
          }`;

          const fromYear = String(education.from || '');
          const toYear = String(education.to || '');

          const dateRange = formatDateRange(fromYear, toYear);
          const institutionLink = getValidUrl(education.url);

          return (
            <div
              key={education.id}
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
                    {institutionLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group"
                      >
                        <a
                          href={institutionLink}
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
                  {education.location && (
                    <div className="mb-2">
                      <span className="text-sm text-secondary-foreground">
                        {education.location}
                      </span>
                    </div>
                  )}
                  {education.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
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
  );
}
