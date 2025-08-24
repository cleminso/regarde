import { Loaded } from 'jazz-tools';

import { type JazzAppProfile } from '#/lib/schema';
import { formatTimestamp } from '#/lib/utils/utils';

type NowPageProps = {
  profile: Loaded<typeof JazzAppProfile>;
};

export function NowPage({ profile }: NowPageProps) {
  const nowPage = profile.nowPage;

  if (!nowPage || !nowPage.description) {
    return (
      <div className="w-full">
        <section
          className="mx-auto flex flex-col gap-6 mb-10"
          style={{ width: '580px' }}
        >
          <div className="text-center py-20">
            <p className="text-sm text-foreground">
              This person hasn't shared what they're doing now.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Learn more about{' '}
              <a
                href="https://nownownow.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground underline hover:text-foreground hover:underline"
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
    <div className="w-full">
      <section
        className="mx-auto flex flex-col gap-6 mb-10"
        style={{ width: '580px' }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-foreground">
            {nowPage.title || "What I'm doing now"}
          </h2>
          {nowPage.location && (
            <div className="flex items-center gap-1 text-sm text-foreground">
              <span>at</span>
              <span>{nowPage.location}</span>
            </div>
          )}
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {nowPage.description}
          </p>
        </div>

        <div className="pt-4 border-t border-border flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Learn more about{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline underline-offset-3 hover:text-foreground hover:underline"
            >
              now page
            </a>
            .
          </p>
          <span className="text-xs text-muted-foreground">
            Updated {formatTimestamp(nowPage.lastUpdated)}
          </span>
        </div>
      </section>
    </div>
  );
}
