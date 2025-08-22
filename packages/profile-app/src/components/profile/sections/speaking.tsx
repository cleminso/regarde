import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { JazzAppProfile, Speaking } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils';

type SpeakingsProps = {
  profile: Loaded<typeof JazzAppProfile>;
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
      className="mx-auto flex flex-col gap-4 mb-10"
      style={{ width: '540px' }}
    >
      <div className="flex items-center gap-4">
        <h3 className="bg-secondary w-full px-2 text-md font-sans whitespace-nowrap">
          Speaking
        </h3>
      </div>
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
            <div key={speaking.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans text-muted-foreground">
                    {formatYearString(yearString)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="min-w-0 flex-1">
                    {speakingLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
                      >
                        <a
                          href={speakingLink}
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
                  {speaking.location && (
                    <div className="mb-1">
                      <span className="text-sm text-muted-foreground break-words">
                        {speaking.location}
                      </span>
                    </div>
                  )}
                  {speaking.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words pr-1">
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
