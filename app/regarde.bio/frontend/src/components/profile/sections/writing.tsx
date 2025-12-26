import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { RegardeProfile, Writing } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils/utils';

type WritingsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Writings({ profile }: WritingsProps) {
  const writings = profile.writing?.$isLoaded
    ? profile.writing.filter(
        (writing: any): writing is Loaded<typeof Writing> =>
          writing?.$isLoaded === true,
      )
    : [];

  if (!writings || writings.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary text-md flex min-h-[2rem] w-full items-center justify-start px-2 py-1 font-sans whitespace-nowrap">
            WRITING
          </h3>
        </div>
        <div className="space-y-6">
          {writings.map((writing: any) => {
            const displayTitle = writing.publisher
              ? `${writing.title || 'Untitled'} @${writing.publisher}`
              : writing.title || 'Untitled';

            const writingLink = getValidUrl(writing.url);

            return (
              <div key={writing.$jazz.id} className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-sans text-sm">
                      {formatYearString(writing.year)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="min-w-0 flex-1">
                      {writingLink ? (
                        <Button
                          variant="link-title"
                          asChild
                          size="title"
                          className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
                        >
                          <a
                            href={writingLink}
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
                    {writing.description && (
                      <p className="text-muted-foreground wrap-break-words pr-1 text-sm whitespace-pre-line">
                        {writing.description}
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
