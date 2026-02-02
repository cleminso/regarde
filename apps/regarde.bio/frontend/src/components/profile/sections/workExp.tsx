import type { RegardeProfile, WorkExp } from "#/lib/schema";
import { Loaded } from "jazz-tools";
import { ArrowUpRight } from "lucide-react";

import { Button } from "#/components/ui/button";
import { formatDateRange, getValidUrl } from "#/lib/utils/utils";

type WorkExperiencesProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function WorkExperiences({ profile }: WorkExperiencesProps) {
  const workExperiences = profile.workExp?.$isLoaded
    ? profile.workExp.filter((exp): exp is Loaded<typeof WorkExp> => exp.$isLoaded === true)
    : [];

  if (!workExperiences || workExperiences.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary text-md flex min-h-[2rem] w-full items-center justify-start px-2 py-1 font-sans whitespace-nowrap">
            WORK EXPERIENCE
          </h3>
        </div>
        <div className="space-y-6">
          {workExperiences.map((workExp: any) => {
            const displayTitle = `${workExp.title || "Untitled Role"} @${
              workExp.company || "Unnamed Company"
            }`;

            const fromYear = String(workExp.from || "");
            const toYear = String(workExp.to || "");

            const dateRange = formatDateRange(fromYear, toYear);
            const companyLink = getValidUrl(workExp.url);

            return (
              <div key={workExp.$jazz.id} className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-sans text-sm">{dateRange}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="min-w-0 flex-1">
                      {companyLink ? (
                        <Button
                          variant="link-title"
                          asChild
                          size="title"
                          className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
                        >
                          <a
                            href={companyLink}
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
                    {workExp.location && (
                      <div className="mb-2">
                        <span className="text-muted-foreground wrap-break-words text-sm">
                          {workExp.location}
                        </span>
                      </div>
                    )}
                    {workExp.description && (
                      <p className="text-muted-foreground wrap-break-words pr-1 text-sm whitespace-pre-line">
                        {workExp.description}
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
