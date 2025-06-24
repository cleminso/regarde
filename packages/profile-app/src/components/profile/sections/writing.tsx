import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { OnboardingProfile, Writing } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils';

type WritingsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Writings({ profile }: WritingsProps) {
  const writings = profile.writing?.filter(
    (writing: any): writing is Loaded<typeof Writing> => writing !== null,
  );

  if (!writings || writings.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Writing</h3>
      <div className="space-y-6">
        {writings.map((writing: any) => {
          const displayTitle = writing.publisher
            ? `${writing.title || 'Untitled'} @${writing.publisher}`
            : writing.title || 'Untitled';

          const writingLink = getValidUrl(writing.url);

          return (
            <div
              key={writing.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {writing.year || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {writingLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group"
                      >
                        <a
                          href={writingLink}
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
                  {writing.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-wrap">
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
  );
}
