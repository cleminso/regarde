import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Certification, OnboardingProfile } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils';

type CertificationsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';

  if (date instanceof Date) {
    return date.getFullYear().toString();
  }

  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.getFullYear().toString();
    }
  }

  return String(date);
};

const formatExpireDate = (date: string | undefined): string => {
  if (!date) return 'No expiry';

  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.getFullYear().toString();
  }

  return date;
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
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Certification</h3>
      <div className="space-y-6">
        {certifications.map((certification: any) => {
          const displayTitle = `${certification.name || 'Certification'} @ ${
            certification.organization || 'Organization'
          }`;
          const issuedYear = formatDate(certification.issued);
          const expireInfo = certification.expire
            ? formatExpireDate(certification.expire)
            : 'No expiry';
          const dateInfo = certification.expire
            ? `${issuedYear} - ${expireInfo}`
            : issuedYear;
          const certificationLink = getValidUrl(certification.url);

          return (
            <div
              key={certification.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
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
                        className="inline-flex items-center group"
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
