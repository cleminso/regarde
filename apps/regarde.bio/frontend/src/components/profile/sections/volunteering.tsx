import type { RegardeProfile, Volunteering } from "#/lib/schema";
import { Loaded } from "jazz-tools";
import { ArrowUpRight } from "lucide-react";

import { Button } from "#/components/ui/button";
import { formatDateRange, getValidUrl } from "#/lib/utils/utils";

type VolunteeringsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Volunteerings({ profile }: VolunteeringsProps) {
  const volunteering = profile.volunteering?.$isLoaded
    ? profile.volunteering.filter(
        (vol: any): vol is Loaded<typeof Volunteering> => vol?.$isLoaded === true,
      )
    : [];

  if (!volunteering || volunteering.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary text-md flex min-h-[2rem] w-full items-center justify-start px-2 py-1 font-sans whitespace-nowrap">
            VOLUNTEERING
          </h3>
        </div>
        <div className="space-y-6">
          {volunteering.map((vol: any) => {
            const displayTitle = `${vol.title || "Untitled Role"} @${
              vol.organization || "Unnamed Organization"
            }`;

            const fromYear = String(vol.from || "");
            const toYear = String(vol.to || "");

            const dateRange = formatDateRange(fromYear, toYear);
            const organizationLink = getValidUrl(vol.url);

            return (
              <div key={vol.$jazz.id} className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-sans text-sm">{dateRange}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="min-w-0 flex-1">
                      {organizationLink ? (
                        <Button
                          variant="link-title"
                          asChild
                          size="title"
                          className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
                        >
                          <a
                            href={organizationLink}
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
                    {vol.description && (
                      <p className="text-muted-foreground wrap-break-words pr-1 text-sm whitespace-pre-line">
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
    </div>
  );
}
