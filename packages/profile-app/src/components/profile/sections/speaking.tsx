import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { OnboardingProfile, Speaking } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils';

type SpeakingsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Speakings({ profile }: SpeakingsProps) {
  const speakings = profile.speaking?.filter(
    (speaking: any): speaking is Loaded<typeof Speaking> => speaking !== null,
  );

  if (!speakings || speakings.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Speaking</h3>
      <div className="space-y-6">
        {speakings.map((speaking: any) => {
          const displayTitle = speaking.event
            ? `${speaking.title || 'Untitled Talk'} @${speaking.event}`
            : speaking.title || 'Untitled Talk';

          const speakingLink = getValidUrl(speaking.url);

          const yearString =
            speaking.year instanceof Date
              ? speaking.year.getFullYear().toString()
              : String(speaking.year);

          return (
            <div
              key={speaking.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {formatYearString(yearString)}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {speakingLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group"
                      >
                        <a
                          href={speakingLink}
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
                  {speaking.location && (
                    <div className="mb-1">
                      <span className="text-sm text-secondary-foreground">
                        {speaking.location}
                      </span>
                    </div>
                  )}
                  {speaking.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
                      {speaking.description}
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
