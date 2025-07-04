import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Award, OnboardingProfile } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils';

type AwardsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Awards({ profile }: AwardsProps) {
  const awards = profile.award?.filter(
    (award: any): award is Loaded<typeof Award> => award !== null,
  );

  if (!awards || awards.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-4 mb-10"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Awards</h3>
      <div className="space-y-6">
        {awards.map((award: any) => {
          const displayTitle = `${award.title || 'Untitled Award'} - ${award.presenter || 'Unknown Presenter'}`;

          const awardLink = getValidUrl(award.url);

          return (
            <div key={award.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {formatYearString(award.year)}
                  </span>
                </div>

                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {awardLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group"
                      >
                        <a
                          href={awardLink}
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
                  {award.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
                      {award.description}
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
