import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { CleanLoadedJazzAppProfile, Volunteering } from '#/lib/schema';
import { formatDateRange, getValidUrl } from '#/lib/utils';

type VolunteeringsProps = {
  profile: CleanLoadedJazzAppProfile;
};

export function Volunteerings({ profile }: VolunteeringsProps) {
  const volunteering = profile.volunteering?.filter(
    (vol: any): vol is Loaded<typeof Volunteering> => vol !== null,
  );

  if (!volunteering || volunteering.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-4 mb-10"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Volunteering</h3>
      <div className="space-y-6">
        {volunteering.map((vol: any) => {
          const displayTitle = `${vol.title || 'Untitled Role'} @${
            vol.organization || 'Unnamed Organization'
          }`;

          const fromYear = String(vol.from || '');
          const toYear = String(vol.to || '');

          const dateRange = formatDateRange(fromYear, toYear);
          const organizationLink = getValidUrl(vol.url);

          return (
            <div key={vol.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {dateRange}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-0.5">
                  <div>
                    {organizationLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1"
                      >
                        <a
                          href={organizationLink}
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
                  {vol.location && (
                    <div className="mb-2">
                      <span className="text-sm text-secondary-foreground">
                        {vol.location}
                      </span>
                    </div>
                  )}
                  {vol.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
                      {vol.description}
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
