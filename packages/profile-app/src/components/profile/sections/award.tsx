import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { Award, JazzAppProfile } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils/utils';

type AwardsProps = {
  profile: Loaded<typeof JazzAppProfile>;
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
      style={{ width: '580px' }}
    >
      <div className="flex items-center gap-4">
        <h3 className="bg-secondary w-full px-2 py-1 text-md font-sans whitespace-nowrap flex items-center justify-start min-h-[2rem]">
          AWARDS
        </h3>
      </div>
      <div className="space-y-6">
        {awards.map((award: any) => {
          const displayTitle = `${award.title || 'Untitled Award'} - ${award.presenter || 'Unknown Presenter'}`;

          const awardLink = getValidUrl(award.url);

          return (
            <div key={award.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans text-muted-foreground">
                    {formatYearString(award.year)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="min-w-0 flex-1">
                    {awardLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
                      >
                        <a
                          href={awardLink}
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
                  {award.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words pr-1">
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
