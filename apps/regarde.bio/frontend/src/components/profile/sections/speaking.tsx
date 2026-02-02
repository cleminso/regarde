import type { RegardeProfile, Speaking } from "#/lib/schema";
import { Loaded } from "jazz-tools";
import { ArrowUpRight } from "lucide-react";

import { Button } from "#/components/ui/button";
import { formatYearString, getValidUrl } from "#/lib/utils/utils";

type SpeakingsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Speakings({ profile }: SpeakingsProps) {
  const speakings = profile.speaking?.$isLoaded
    ? profile.speaking.filter(
        (speaking: any): speaking is Loaded<typeof Speaking> => speaking?.$isLoaded === true,
      )
    : [];

  if (!speakings || speakings.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary text-md flex min-h-[2rem] w-full items-center justify-start px-2 py-1 font-sans whitespace-nowrap">
            SPEAKING
          </h3>
        </div>
        <div className="space-y-6">
          {speakings.map((speaking: any) => {
            const displayTitle = speaking.event
              ? `${speaking.title || "Untitled Talk"} @${speaking.event}`
              : speaking.title || "Untitled Talk";

            const speakingLink = getValidUrl(speaking.url);

            const yearString =
              speaking.year instanceof Date
                ? speaking.year.getFullYear().toString()
                : String(speaking.year);

            return (
              <div key={speaking.$jazz.id} className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-sans text-sm">
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
                          className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
                        >
                          <a
                            href={speakingLink}
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
                    {speaking.location && (
                      <div className="mb-1">
                        <span className="text-muted-foreground wrap-break-words text-sm">
                          {speaking.location}
                        </span>
                      </div>
                    )}
                    {speaking.description && (
                      <p className="text-muted-foreground wrap-break-words pr-1 text-sm whitespace-pre-line">
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
