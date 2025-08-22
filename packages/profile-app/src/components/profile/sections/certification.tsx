import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { Certification, JazzAppProfile } from '#/lib/schema';
import { formatDateRange, formatYearString, getValidUrl } from '#/lib/utils';

type CertificationsProps = {
  profile: Loaded<typeof JazzAppProfile>;
};

export function Certifications({ profile }: CertificationsProps) {
  const certifications = profile.certification?.filter(
    (cert: any): cert is Loaded<typeof Certification> => cert !== null,
  );

  if (!certifications || certifications.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-4 mb-10"
      style={{ width: '540px' }}
    >
      <div className="flex items-center gap-4">
        <h3 className="bg-secondary w-full px-2 text-md font-sans whitespace-nowrap">
          Certifications
        </h3>
      </div>
      <div className="space-y-6">
        {certifications.map((certification: any) => {
          const displayTitle = `${certification.name || 'Certification'} @${
            certification.organization || 'Organization'
          }`;

          const issuedYear = String(certification.issued || '');

          const dateInfo = certification.expire
            ? formatDateRange(issuedYear, certification.expire)
            : formatYearString(issuedYear);

          const certificationLink = getValidUrl(certification.url);

          return (
            <div key={certification.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans text-muted-foreground">
                    {dateInfo}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="min-w-0 flex-1">
                    {certificationLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
                      >
                        <a
                          href={certificationLink}
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
                  {certification.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words pr-1">
                      {certification.description}
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
