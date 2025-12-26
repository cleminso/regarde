import { Loaded } from 'jazz-tools';

import { type RegardeProfile } from '#/lib/schema';
import { formatTimestamp } from '#/lib/utils/utils';

type NowPageProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function NowPage({ profile }: NowPageProps) {
  const nowPage = profile.nowPage;

  if (!nowPage?.$isLoaded || !nowPage.description) {
    return (
      <div className="@container">
        <section className="mx-auto mb-10 flex w-full max-w-[580px] flex-col gap-6">
          <div className="py-20 text-center">
            <p className="text-foreground text-sm">
              This person hasn't shared what they're doing now.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Learn more about{' '}
              <a
                href="https://nownownow.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline hover:underline"
              >
                now page
              </a>
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-10 flex w-full max-w-[580px] flex-col gap-6">
        <div className="flex items-center gap-3">
          <h2 className="text-foreground text-lg font-medium">
            {nowPage.title || "What I'm doing now"}
          </h2>
          {nowPage.location && (
            <div className="text-foreground flex items-center gap-1 text-sm">
              <span>at</span>
              <span>{nowPage.location}</span>
            </div>
          )}
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {nowPage.description}
          </p>
        </div>

        <div className="border-border flex items-center justify-between border-t pt-4">
          <p className="text-muted-foreground text-xs">
            Learn more about{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground underline underline-offset-3 hover:underline"
            >
              now page
            </a>
            .
          </p>
          <span className="text-muted-foreground text-xs">
            Updated {formatTimestamp(nowPage.lastUpdated)}
          </span>
        </div>
      </section>
    </div>
  );
}
