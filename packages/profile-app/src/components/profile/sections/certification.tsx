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
      <h3 className="text-md font-sans">Certification</h3>
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
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {dateInfo}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-0.5">
                  <div>
                    {certificationLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1"
                      >
                        <a
                          href={certificationLink}
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
                  {certification.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
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
