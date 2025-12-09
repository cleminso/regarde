import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { RegardeProfile, Speaking } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils/utils';

type SpeakingsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Speakings({ profile }: SpeakingsProps) {
  const speakings = profile.speaking?.$isLoaded ?profile.speaking.filter(
    (speaking: any): speaking is Loaded<typeof Speaking> => speaking?.$isLoaded === true,
  ): [] ;

  if (!speakings || speakings.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="w-full max-w-[580px] mx-auto flex flex-col gap-4  mb-6">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary w-full px-2 py-1 text-md font-sans whitespace-nowrap flex items-center justify-start min-h-[2rem]">
            SPEAKING
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
              <div key={speaking.$jazz.id} className="flex flex-col pb-4 gap-3">
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
                            <ArrowUpRight className="h-4 w-4 shrink-0" />
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
                        <span className="text-sm text-muted-foreground wrap-break-words">
                          {speaking.location}
                        </span>
                      </div>
                    )}
                    {speaking.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line wrap-break-words pr-1">
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
    </div>
  );
}
